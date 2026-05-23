import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getAllMeltReceiptProducts } from '../../api/services/MeltingPurchaseService';
import { getMetalById } from '../../api/services/metalService';
import { getProductById } from '../../api/services/productService';
import { getBranchById } from '../../api/services/branchService';
import { getCompanyById } from '../../api/services/companyService';
import {
    Card,
    Typography,
    Button,
    Space,
    Divider,
    Table,
    Row,
    Col,
    Tag,
    message,
    Spin
} from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import logo from '../../assets/logo.jpg';
import '../Receipt/Recipt.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

import { getMCXRates } from '../../api/services/quatationService';

const { Title, Text } = Typography;

const SalesReceipt = () => {
    const { meltId } = useParams();
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [branchDetails, setBranchDetails] = useState({});
    const [companyDetails, setCompanyDetails] = useState({});
    const [liveGoldRate, setLiveGoldRate] = useState(0);
    const receiptRef = useRef();
    const pdfRef = useRef();

    // Ported from Sales.js
    const calculateProductValues = (product, rate) => {
        if (!product) return {};
        const weight = parseFloat(product.weight) || 0;
        const dustWeight = parseFloat(product.dust_weight) || 0;
        const purity = parseFloat(product.purity) || 100;
        const marginPercent = 3;

        const netWeight = (weight - dustWeight) * (purity / 100);
        const marginWeight = (netWeight * marginPercent) / 100;
        const finalWeight = netWeight - marginWeight;
        const amount = finalWeight * rate;

        return {
            netWeight: parseFloat(netWeight.toFixed(3)),
            marginWeight: parseFloat(marginWeight.toFixed(3)),
            finalWeight: parseFloat(finalWeight.toFixed(3)),
            rate: parseFloat(rate.toFixed(2)),
            amount: parseFloat(amount.toFixed(2))
        };
    };

    // Ported from Sales.js
    const getFinalProductTotal = (record, calculatedAmount) => {
        if (!record) return 0;
        if (record.total_amount) return parseFloat(record.total_amount);

        const paymentDetails = record.payment_details
            ? (typeof record.payment_details === 'string' ? JSON.parse(record.payment_details) : record.payment_details)
            : null;

        if (paymentDetails && paymentDetails.total_amount) return parseFloat(paymentDetails.total_amount);

        return calculatedAmount || 0;
    };

    const fetchMCXData = async () => {
        try {
            const response = await getMCXRates();
            const goldRate = response[0]?.rate || 0;
            setLiveGoldRate(goldRate);
            return goldRate;
        } catch (error) {
            console.error('Error fetching MCX rates:', error);
            return 0;
        }
    };

    useEffect(() => {
        const fetchMeltDetails = async () => {
            try {
                setLoading(true);
                const currentRate = await fetchMCXData();

                // Switch back to getAllMeltReceiptProducts as it definitely finds the record
                const response = await getAllMeltReceiptProducts({ id: meltId, isSalesPage: true });
                const purchases = response.purchases || response.data?.purchases || [];
                const meltData = purchases.find(p => p.id === parseInt(meltId));

                if (meltData) {
                    const paymentDetails = meltData.payment_details ? (typeof meltData.payment_details === 'string' ? JSON.parse(meltData.payment_details) : meltData.payment_details) : null;
                    const rateToUse = paymentDetails?.rate || currentRate;

                    const calc = calculateProductValues(meltData, rateToUse);
                    const finalTotal = getFinalProductTotal(meltData, calc.amount);

                    // Extract accurate IDs from nested purchases if main IDs are null
                    let actualMetalId = meltData.metal;
                    let actualProductId = meltData.product;
                    let fallbackSubProduct = null;

                    if (!actualMetalId || !actualProductId) {
                        try {
                            const innerPurchases = typeof meltData.purchases === 'string' ? JSON.parse(meltData.purchases) : meltData.purchases;
                            if (Array.isArray(innerPurchases) && innerPurchases.length > 0) {
                                if (!actualMetalId) actualMetalId = innerPurchases[0].metal;
                                if (!actualProductId) actualProductId = innerPurchases[0].product;
                                fallbackSubProduct = innerPurchases[0].sub_product || innerPurchases[0].product_type;
                            }
                        } catch (e) {}
                    }

                    let metal = { metalname: 'N/A' };
                    let product = { product_name: 'N/A' };

                    try {
                        const promises = [];
                        if (actualMetalId) promises.push(getMetalById(actualMetalId).then(m => { metal = m; }).catch(e => console.warn(e)));
                        if (actualProductId && !isNaN(Number(actualProductId))) {
                            promises.push(getProductById(actualProductId).then(p => { product = p; }).catch(e => console.warn(e)));
                        }
                        await Promise.all(promises);
                    } catch (e) {
                        console.warn('Error fetching metal/product data', e);
                    }

                    let finalProductName = product.product_name;
                    if (!finalProductName || finalProductName === 'N/A') {
                        finalProductName = fallbackSubProduct || actualProductId || 'N/A';
                    }

                    setRecord({
                        ...meltData,
                        metal_name: metal.metalname || 'N/A',
                        product_name: product.product_name || 'N/A',
                        calculated: calc,
                        final_total_display: finalTotal,
                        payment_details_parsed: paymentDetails
                    });

                    generateQRCode(`MELT-${meltId}`);
                } else {
                    message.error('Melt record not found');
                }
            } catch (error) {
                console.error('Error fetching melt details:', error);
                message.error('Failed to load receipt details');
            } finally {
                setLoading(false);
            }
        };

        fetchMeltDetails();
    }, [meltId]);

    useEffect(() => {
        const fetchOrgDetails = async () => {
            try {
                const branchId = localStorage.getItem('userBranchId');
                if (branchId) {
                    const branch = await getBranchById(branchId);
                    setBranchDetails(branch);
                    if (branch.company_id) {
                        const company = await getCompanyById(branch.company_id);
                        setCompanyDetails(company);
                    }
                }
            } catch (err) {
                console.log("Failed to fetch organization details", err);
            }
        };
        fetchOrgDetails();
    }, []);

    const generateQRCode = async (text) => {
        try {
            const qrData = await QRCode.toDataURL(text, { width: 120, margin: 2 });
            setQrCodeDataUrl(qrData);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = receiptRef.current.innerHTML;
        printWindow.document.open();
        printWindow.document.write(`
      <html>
        <head>
          <title>Sales Receipt #AMAMELT${meltId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .no-print { display: none !important; }
            .receipt-container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .company-info h2 { margin: 0; color: #b8860b; }
            .section-title { background: #f5f5f5; padding: 5px 10px; font-weight: bold; margin: 15px 0 10px; border-left: 4px solid #b8860b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #444; color: #fff; padding: 8px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            .total-section { display: flex; justify-content: flex-end; gap: 20px; background: #fafafa; padding: 15px; border: 1px solid #eee; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .signature { margin-top: 40px; text-align: right; border-top: 1px dashed #ccc; display: inline-block; float: right; padding-top: 5px; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
              .receipt-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">${printContent}</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    const handleDownloadPDF = async () => {
        if (!pdfRef.current) return;
        try {
            message.loading('Generating PDF...', 0);
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`Sales_Receipt_AMAMELT${meltId}.pdf`);
            message.destroy();
            message.success('PDF downloaded successfully');
        } catch (error) {
            message.destroy();
            message.error('Failed to generate PDF');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    if (!record) return <div style={{ textAlign: 'center', padding: '50px' }}>Record not found</div>;

    // Financial calculations
    const calc = record.calculated || {};

    // Use sales_payments history for accuracy
    const payments = record.sales_payments || [];
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.completed_payment || p.paid_amount || 0), 0);
    const roundOff = payments.reduce((sum, p) => sum + parseFloat(p.pending_payment || p.round_off_amount || 0), 0);

    // Total Amount is the base value from calculation or record
    const baseTotal = parseFloat(record.calculated?.amount || record.total_amount || 0);
    // Final Amount = Base + Round Off (Always sum for visual consistency on report)
    // Final Amount = Base + GST + Round Off
    const finalAmount = baseTotal + parseFloat(record.cgst || 0) + parseFloat(record.sgst || 0) + roundOff;

    const productTableData = [
        {
            key: '1',
            description: `${record.metal_name} - ${record.product_name}`,
            gross_wt: parseFloat(record.weight || 0).toFixed(3),
            melt_wt: parseFloat(record.melt_weight || 0).toFixed(3),
            dust_wt: parseFloat(record.dust_weight || 0).toFixed(3),
            pure_wt: parseFloat(calc.finalWeight || 0).toFixed(3),
            rate: (calc.rate || 0).toFixed(2),
            amount: baseTotal.toFixed(2)
        }
    ];

    const columns = [
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Gross Wt (g)', dataIndex: 'gross_wt', key: 'gross_wt', align: 'right' },
        { title: 'Dust Wt (g)', dataIndex: 'dust_wt', key: 'dust_wt', align: 'right' },
        { title: 'Pure Wt (g)', dataIndex: 'pure_wt', key: 'pure_wt', align: 'right' },
        { title: 'Rate (₹/g)', dataIndex: 'rate', key: 'rate', align: 'right' },
        { title: 'Amount (₹)', dataIndex: 'amount', key: 'amount', align: 'right' }
    ];

    return (
        <div className="page-container" style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                    <Space>
                        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Receipt</Button>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>Download PDF</Button>
                    </Space>
                </div>

                <div ref={receiptRef}>
                    <div ref={pdfRef}>
                        <Card className="receipt-card" style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            {/* Header */}
                            <Row gutter={16} align="middle">
                                <Col span={4}>
                                    <img src={logo} alt="Logo" style={{ width: '100%', maxWidth: '80px' }} />
                                </Col>
                                <Col span={14}>
                                    <Title level={3} style={{ margin: 0, color: '#b8860b' }}>Amaya Gold Point</Title>
                                    <Text style={{ fontSize: '12px', display: 'block' }}>
                                        {branchDetails.address1}, {branchDetails.city}<br />
                                        {branchDetails.district}, {branchDetails.state} - {branchDetails.pincode}<br />
                                        GSTIN: {companyDetails.gst_no} | Phone: {branchDetails.phoneno}
                                    </Text>
                                </Col>
                                <Col span={6} style={{ textAlign: 'right' }}>
                                    <div style={{ textAlign: 'center', display: 'inline-block' }}>
                                        <Text strong style={{ display: 'block', fontSize: '10px' }}>Scan QR</Text>
                                        {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" style={{ width: '80px' }} />}
                                    </div>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '15px 0', borderTop: '2px solid #eee' }} />

                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <Title level={4} style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>SALES RECEIPT</Title>
                            </div>

                            <Row justify="space-between" style={{ marginBottom: '20px' }}>
                                <Col>
                                    <Text strong>Receipt No: </Text>
                                    <Text type="secondary">#AMAMELT{record.id || meltId}</Text>
                                </Col>
                                <Col>
                                    <Text strong>Date: </Text>
                                    <Text>{new Date(record.created_at).toLocaleString('en-IN')}</Text>
                                </Col>
                            </Row>

                            {/* Customer Details */}
                            <div className="section-title" style={{ background: '#f9f9f9', padding: '8px 12px', fontWeight: 'bold', marginBottom: '10px', borderLeft: '4px solid #b8860b' }}>
                                CUSTOMER DETAILS
                            </div>
                            <Row gutter={24} style={{ marginBottom: '20px' }}>
                                <Col span={12}>
                                    <div><Text strong>Name: </Text><Text>{record.assign_customer_name}</Text></div>
                                    <div><Text strong>Aadhar: </Text><Text>{record.aadhar_no || 'N/A'}</Text></div>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <div><Text strong>Payment Method: </Text><Tag color="green">{payments.length > 0 ? Array.from(new Set(payments.map(p => p.payment_type))).join(', ') : 'N/A'}</Tag></div>
                                    <div><Text strong>Type: </Text><Tag color="blue">Melt Sale</Tag></div>
                                </Col>
                            </Row>

                            {/* Sales Details */}
                            <div className="section-title" style={{ background: '#f9f9f9', padding: '8px 12px', fontWeight: 'bold', marginBottom: '10px', borderLeft: '4px solid #b8860b' }}>
                                SALES DETAILS
                            </div>
                            <Table
                                columns={columns}
                                dataSource={productTableData}
                                pagination={false}
                                bordered
                                size="small"
                                style={{ marginBottom: '20px' }}
                            />

                            {/* Totals */}
                            <Row justify="end">
                                <Col span={12}>
                                    <div style={{ background: '#fafafa', padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
                                        <Row gutter={[8, 8]}>
                                            <Col span={12}><Text strong>Total Amount:</Text></Col>
                                            <Col span={12} style={{ textAlign: 'right' }}><Text strong>₹{baseTotal.toFixed(2)}</Text></Col>
                                            
                                            {parseFloat(record.cgst || 0) > 0 && (
                                                <>
                                                    <Col span={12}><Text strong>CGST (1.5%):</Text></Col>
                                                    <Col span={12} style={{ textAlign: 'right' }}><Text strong>₹{parseFloat(record.cgst).toFixed(2)}</Text></Col>
                                                </>
                                            )}
                                            {parseFloat(record.sgst || 0) > 0 && (
                                                <>
                                                    <Col span={12}><Text strong>SGST (1.5%):</Text></Col>
                                                    <Col span={12} style={{ textAlign: 'right' }}><Text strong>₹{parseFloat(record.sgst).toFixed(2)}</Text></Col>
                                                </>
                                            )}

                                            <Col span={12}><Text strong>Round Off (+): </Text></Col>
                                            <Col span={12} style={{ textAlign: 'right' }}><Text strong>₹{roundOff.toFixed(2)}</Text></Col>

                                            <Divider style={{ margin: '8px 0' }} />

                                            <Col span={12}><Title level={5} style={{ margin: 0 }}>Final Amount:</Title></Col>
                                            <Col span={12} style={{ textAlign: 'right' }}><Title level={5} style={{ margin: 0 }}>₹{finalAmount.toFixed(2)}</Title></Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>

                            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                <Text italic type="secondary">Thank you for your business!</Text>
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-block', borderTop: '1px solid #333', paddingTop: '5px', minWidth: '150px' }}>
                                        <Text strong>Authorized Signature</Text>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SalesReceipt;
