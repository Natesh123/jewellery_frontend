import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPurchaseById } from '../../api/services/purchaseService';
import { getProductById } from '../../api/services/productService';
import { getSubProductById } from '../../api/services/subProductServices';
import { getMetalById } from '../../api/services/metalService';
import { getBranchById } from '../../api/services/branchService';
import { getCompanyById } from '../../api/services/companyService';
import {
  Card,
  Typography,
  Button,
  Space,
  Image,
  Divider,
  Table,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Spin
} from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import logo from '../../assets/logo.jpg';
import './Recipt.css';
import { uploadConfigUrl } from '../../api/apiUrl';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const { Title, Text } = Typography;

const Receipt = () => {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [enhancedProducts, setEnhancedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [branchDetails, setBranchDetails] = useState({});
  const [companyDetails, setCompanyDetails] = useState({});
  const receiptRef = useRef();
  const pdfRef = useRef(); // Separate ref for PDF generation

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        setLoading(true);
        const response = await getPurchaseById(purchaseId);
        setPurchase(response.data);
        await fetchProductDetails(response.data.products);
        generateQRCode(response.data.purchase_id);
      } catch (error) {
        console.error('Error fetching purchase:', error);
        message.error('Failed to load purchase details');
      } finally {
        setLoading(false);
      }
    };

    const fetchProductDetails = async (products) => {
      if (!products || products.length === 0) return;

      try {
        setLoadingProducts(true);

        const productsWithDetails = await Promise.all(
          products.map(async (product) => {
            try {
              const [metal, productDetail, subProduct] = await Promise.all([
                getMetalById(product.metal),
                getProductById(product.product),
                getSubProductById(product.sub_product)
              ]);

              return {
                ...product,
                metal_name: metal.metalname || "",
                product_name: productDetail.product_name || "",
                sub_product_name: subProduct.sub_product_name || product.sub_product
              };
            } catch (error) {
              console.error('Error fetching product details:', error);
              return {
                ...product,
                metal_name: product.metal,
                product_name: product.product,
                sub_product_name: product.sub_product
              };
            }
          })
        );

        setEnhancedProducts(productsWithDetails);
      } catch (error) {
        console.error('Error fetching product details:', error);
        message.error('Failed to load product details');
      } finally {
        setLoadingProducts(false);
      }
    };

    const generateQRCode = async (purchaseId) => {
      try {
        // Generate QR code with purchase ID
        const qrCodeData = await QRCode.toDataURL(purchaseId, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrCodeData);
      } catch (error) {
        console.error('Error generating QR code:', error);
        message.error('Failed to generate QR code');
      }
    };

    fetchPurchase();
  }, [purchaseId]);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      try {
        const branchDetails = await getBranchById(localStorage.getItem('userBranchId'))
        setBranchDetails(branchDetails);
      } catch (err) {
        console.log("Failed to fetch Branch details", err);
      }
    }
    const fetchCompanyDetails = async () => {
      try {
        const branchDetails = await getBranchById(localStorage.getItem('userBranchId'))
        const companyDetails = await getCompanyById(branchDetails.company_id)
        setCompanyDetails(companyDetails);
      } catch (err) {
        console.log("Failed to fetch Branch details", err);
      }
    }
    fetchBranchDetails();
    fetchCompanyDetails();
  }, []);

  // Create PDF-specific content without buttons
  useEffect(() => {
    if (pdfRef.current && receiptRef.current) {
      const receiptContent = receiptRef.current.cloneNode(true);

      // Remove all elements with no-print class
      const noPrintElements = receiptContent.querySelectorAll('.no-print');
      noPrintElements.forEach(element => element.remove());

      // Also remove the Card extra content (buttons)
      const cardElement = receiptContent.querySelector('.ant-card');
      if (cardElement) {
        const cardExtra = cardElement.querySelector('.ant-card-extra');
        if (cardExtra) {
          cardExtra.remove();
        }
      }

      pdfRef.current.innerHTML = receiptContent.innerHTML;
    }
  }, [purchase, enhancedProducts, qrCodeDataUrl, branchDetails, companyDetails]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = receiptRef.current.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${purchase?.purchase_id || ''}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page setup - A4 dimensions (210mm x 297mm) */
          @page {
            size: A4;
            margin: 10mm 15mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.4;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            background: white !important;
            font-size: 12px;
          }
          
          /* Main container - accounting for page margins */
          .print-container {
            width: 180mm; /* 210mm - 15mm margins each side */
            margin: 0 auto;
            padding: 5mm 0;
          }
          
          /* Header styles */
          .print-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
            page-break-after: avoid;
          }
          
          .print-logo {
            width: 70px;
            height: 50px;
            margin-right: 15px;
            object-fit: contain;
          }
          
          .print-company-info {
            flex: 1;
          }
          
          .print-company-name {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
            color: #000;
          }
          
          .print-company-address {
            font-size: 11px;
            line-height: 1.3;
            color: #555;
          }
          
          /* Receipt title */
          .receipt-title {
            text-align: center;
            margin: 10px 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: #000;
          }
          
          /* Meta information */
          .receipt-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 11px;
          }
          
          /* Sections */
          .section-title {
            font-size: 13px;
            margin: 8px 0 4px;
            color: #000;
            text-transform: uppercase;
          }
          
          /* Customer details */
          .customer-detail {
            margin-bottom: 4px;
            font-size: 11px;
          }
          
          /* Table styles - critical for A4 fitting */
          .products-table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 11px;
            page-break-inside: avoid;
          }
          
          .products-table table {
            width: 100% !important;
            table-layout: fixed;
          }
          
          .products-table th {
            background-color: #f5f5f5 !important;
            padding: 6px 4px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
            color: #000;
          }
          
          .products-table td {
            padding: 6px 4px;
            border: 1px solid #ddd;
            vertical-align: top;
            word-wrap: break-word;
          }
          
          /* Column width distribution */
          .products-table td:nth-child(1) { width: 35%; } /* Description */
          .products-table td:nth-child(2), 
          .products-table td:nth-child(3),
          .products-table td:nth-child(4) { width: 15%; } /* Weight/Rate */
          .products-table td:nth-child(5) { width: 20%; } /* Amount */
          
          /* Totals section */
          .total-section {
            text-align: right;
            margin: 10px 0;
            padding: 8px;
            background-color: #fafafa;
            border: 1px solid #eee;
            page-break-inside: avoid;
          }
          
          /* Verification section */
          .verification-section {
            display: flex;
            justify-content: space-around;
            margin: 15px 0;
            page-break-inside: avoid;
          }
          
          .barcode-container, .qrcode-container {
            text-align: center;
            padding: 8px;
          }
          
          .barcode-text, .qrcode-text {
            display: block;
            margin-top: 4px;
            font-size: 11px;
          }
          
          /* Footer */
          .receipt-footer {
            margin-top: 15px;
            text-align: center;
            font-size: 11px;
            page-break-before: avoid;
          }
          
          .footer-text {
            margin-bottom: 4px;
          }
          
          .footer-signature {
            display: block;
            margin-top: 20px;
            padding-top: 15px;
            text-align: right;
            border-top: 1px dashed #ccc;
          }
          
          /* Utility classes */
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-bold {
            font-weight: bold;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Hide buttons in print */
          .ant-card-extra {
            display: none !important;
          }
          
          /* Print-specific visibility */
          @media print {
            body {
              visibility: visible !important;
            }
            .print-container * {
              visibility: visible !important;
            }
            .no-print {
              display: none !important;
            }
            .ant-card-extra {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    try {
      message.loading('Generating PDF...', 0);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`receipt_${purchase.purchase_id}.pdf`);
      message.destroy();
      message.success('PDF downloaded successfully');
    } catch (error) {
      message.destroy();
      message.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <Spin size="large" tip="Loading receipt..." />
    </div>
  );

  if (!purchase) return <div className="error-container">Purchase not found</div>;

  // Format date
  const purchaseDate = new Date(purchase.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Product table columns
  const productColumns = [
    {
      title: 'Description',
      dataIndex: 'product',
      key: 'product',
      render: (_, record) => (
        <div>
          <Text strong>
            Gold
          </Text>
          <br />
          <Text type="secondary">
            Style: {record.sub_product_name} -{record.purity}%
          </Text>
        </div>
      )

    },
    {
      title: 'Gross Wt (g)',
      dataIndex: 'gross_weight',
      key: 'gross_weight',
      align: 'right',
      render: (value) => value.toFixed(3)
    },
    {
      title: 'Dust Wt (g)',
      dataIndex: 'dust_weight',
      key: 'dust_weight',
      align: 'right',
      render: (value) => value.toFixed(3)
    },
    {
      title: 'Stone Wt (g)',
      dataIndex: 'stone_weight',
      key: 'stone_weight',
      align: 'right',
      render: (value) => value.toFixed(3)
    },
    {
      title: 'Pure Wt (g)',
      dataIndex: 'final_weight',
      key: 'final_weight',
      align: 'right',
      render: (value) => parseFloat(value).toFixed(3)
    },
    {
      title: 'Rate (₹/g)',
      dataIndex: 'rate',
      key: 'rate',
      align: 'right',
      render: (rate) => `₹${parseFloat(rate).toFixed(2)}`
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`
    }
  ];

  return (
    <div className="page-container">
      {/* Hidden container for PDF generation (without buttons) */}
      <div
        ref={pdfRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm'
        }}
      />

      {/* Visible container for screen display */}
      <div className="receipt-container" ref={receiptRef}>
        {/* Print-specific header (only visible when printing) */}
        <div className="print-only print-header" style={{ display: 'none' }}>
          <img src={logo} alt="Company Logo" className="print-logo" />
          <div className="print-company-info">
            <h3 className="print-company-name">Amaya Gold Point</h3>
            <div className="print-company-address">
              {branchDetails.address1},{branchDetails.city}<br />
              {branchDetails.district}, {branchDetails.state} - {branchDetails.pincode}<br />
              GSTIN: {companyDetails.gst_no}<br />
              Phone: {branchDetails.phoneno}
            </div>
          </div>
          <img src={logo} alt="Company Logo" className="print-logo" />
        </div>

        <Card
          title={null}
          className="receipt-card"
          extra={
            <Space className="no-print">
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                Print Receipt
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
            </Space>
          }
        >
          {/* Company info (visible on screen only) */}
          <div className="screen-only company-display">
            <Row gutter={16} align="middle">
              <Col>
                <img src={logo} alt="Company Logo" className="screen-logo" />
              </Col>
              <Col>
                <Title level={3} className="company-title">Amaya Gold Point</Title>
                <Text className="company-subtitle">
                  <div> {branchDetails.address1},{branchDetails.city}</div>
                  <div>{branchDetails.district}, {branchDetails.state} - {branchDetails.pincode}</div>
                  <div>GSTIN: {companyDetails.gst_no} | Phone: {branchDetails.phoneno}</div>
                </Text>
              </Col>
              <Col>
                <div className="">
                  <p className="ll">Scan QR</p>
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="QR Code" className="screen-logo12" />
                  )}
                </div>

              </Col>
            </Row>
            <Divider className="company-divider" />
          </div>

          {/* Receipt header */}
          <div className="receipt-header">
            <Title level={4} className="receipt-title">PURCHASE RECEIPT</Title>
            <div className="receipt-meta">
              <div className="receipt-number">
                <Text strong>Receipt No: </Text>
                <Text className="receipt-number-value">{purchase.purchase_id}</Text>
              </div>
              <div className="receipt-date">
                <Text strong>Date: </Text>
                <Text>{purchaseDate}</Text>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="customer-info">
            <Title level={5} className="section-title">CUSTOMER DETAILS</Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="customer-detail">
                  <Text strong>Name: </Text>
                  <Text>{purchase.customer_name}</Text>
                </div>
                <div className="customer-detail">
                  <Text strong>Aadhar: </Text>
                  <Text>{purchase.aadhar_no}</Text>
                </div>
                {/* <div className="customer-detail">
                  <Text strong>PAN: </Text>
                  <Text>{purchase.pan_no}</Text>
                </div> */}
              </Col>
              <Col xs={24} sm={12}>
                <div className="customer-detail">
                  <Text strong>Payment Method: </Text>
                  <Tag
                    color={purchase.payment_method === 'cash' ? 'green' : 'blue'}
                    className="payment-tag"
                  >
                    {purchase.payment_method === 'cash' ? 'Cash' : 'Bank Transfer'}
                  </Tag>
                </div>
                <div className="customer-detail">
                  <Text strong>Type: </Text>
                  <Tag
                    color={purchase.pledge_status === '0' ? 'green' : 'blue'}
                    className="payment-tag"
                  >
                    {purchase.pledge_status === '0' ? 'Customer Purchase' : 'Pledge Purchase'}
                  </Tag>
                </div>
                {purchase.payment_method !== 'cash' && (
                  <div className="customer-detail">
                    <Text strong>Transaction Ref: </Text>
                    <Text>{purchase.transaction_reference || 'N/A'}</Text>
                  </div>
                )}
              </Col>
            </Row>
          </div>

          {/* Products table */}
          <Divider className="section-divider" />
          <Title level={5} className="section-title">PURCHASE DETAILS</Title>
          <Table
            columns={productColumns}
            dataSource={enhancedProducts}
            pagination={false}
            rowKey="key"
            size="middle"
            bordered
            className="products-table"
            loading={loadingProducts}
          />

          {/* Totals */}
          <Divider className="section-divider" />
          <Row justify="end">
            <Col xs={28} sm={20} md={18}>
              <div
                className="total-section"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20
                }}
              >
                {/* ➤ NEW: Margin Percent Card */}
                <Statistic
                  title="Margin Percent"
                  value={`${purchase?.products[0]?.margin_percent || 0}%`}
                  valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
                />

                {/* ➤ Total Amount */}
                <Statistic
                  title="Total Amount"
                  value={Math.round(purchase.final_amount)}
                  prefix="₹"
                  valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
                />

                {/* ➤ Round Off Amount */}
                <Statistic
                  title="Round Off Amount"
                  value={Math.round(purchase.total_amount - purchase.final_amount )}
                  prefix="₹"
                  valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
                />

                {/* ➤ Final Amount */}
                <Statistic
                  title="Final Amount"
                  value={Math.round(purchase.total_amount )}
                  prefix="₹"
                  valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
                />
              </div>
            </Col>
          </Row>


          {/* Footer */}
          <Divider className="section-divider" />
          <div className="receipt-footer">
            <Text className="footer-text">Thank you for your sales!</Text>
            <Text className="footer-text">For any queries, please contact our customer support</Text>
            <Text className="footer-text">Terms & Conditions apply</Text>
            <Text className="footer-text">Authorized Signature</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Receipt;