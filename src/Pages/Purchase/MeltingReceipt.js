import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Select,
    Table,
    Space,
    message,
    Modal,
    Card,
    Row,
    Col,
    Typography,
    Tag,
    Divider,
    InputNumber,
    Checkbox, Spin, Radio
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import Swal from 'sweetalert2';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// API Services
import {
    getAllMeltReceiptPurchases,
    updatePurchaseMeltStatus,
    createMeltProducts, getAllMeltReceiptProducts, updateMeltProduct,
    updateMeltDetails,
    updateMeltWages
} from '../../api/services/MeltingPurchaseService';

import { getProducts } from '../../api/services/productService';
import { getMetals } from '../../api/services/metalService';
import { getSubProducts } from '../../api/services/subProductServices';
import { getProductById } from '../../api/services/productService';
import { getMetalById } from '../../api/services/metalService';

import { DatePicker } from 'antd';
import { getMCXRates } from '../../api/services/quatationService';
import Statistic from 'antd/es/statistic/Statistic';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const MeltingReceipt = () => {
    const [form] = Form.useForm();
    const [metals, setMetals] = useState([]);
    const [products, setAllProducts] = useState([]);
    const [subProducts, setAllSubProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [selectedPurchases, setSelectedPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([]);
    const [isMeltingPopupVisible, setIsMeltingPopupVisible] = useState(false);
    const [liveGoldRate, setLiveGoldRate] = useState(0.0);
    const [isConfirmationPopupVisible, setIsConfirmationPopupVisible] = useState(false);
    const [confirmationSelections, setConfirmationSelections] = useState([]);

    // Melt products state
    const [meltProducts, setMeltProducts] = useState([]);
    const [meltPagination, setMeltPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    });
    const [isMeltTableLoading, setIsMeltTableLoading] = useState(false);

    // Options for dropdowns
    const [metalOptions, setMetalOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [subProductOptions, setSubProductOptions] = useState({});
    const [purchaseDetailsVisible, setPurchaseDetailsVisible] = useState(false);
    const [selectedPurchasesJson, setSelectedPurchasesJson] = useState('');
    const [selectedMeltRecord, setSelectedMeltRecord] = useState(null);

    const [isMeltModalVisible, setIsMeltModalVisible] = useState(false);
    const [selectedMeltData, setSelectedMeltData] = useState(null);


    const [isWageModalOpen, setIsWageModalOpen] = useState(false);
    const [selectedWagesData, setSelectedWagesData] = useState(null);

    // Calculation state
    const [calculations, setCalculations] = useState({});

    // Main table pagination
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    });

    const [isTableLoading, setIsTableLoading] = useState(false);

    const [purchaseFilters, setPurchaseFilters] = useState({
        search: '',
        metal: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [selectedForPdf, setSelectedForPdf] = useState([]);
    // Handle date range change
    const handleDateRangeChange = (dates, dateStrings) => {
        setDateRange(dates);
        if (dates && dates.length === 2) {
            setPurchaseFilters({
                ...purchaseFilters,
                startDate: dateStrings[0],
                endDate: dateStrings[1]
            });
        } else {
            setPurchaseFilters({
                ...purchaseFilters,
                startDate: '',
                endDate: ''
            });
        }
    };

    const fetchMCXData = async () => {
        try {
            const response = await getMCXRates();
            const goldRate = response[0]?.rate || 0;
            setLiveGoldRate(goldRate);
        } catch (error) {
            console.error('Error fetching MCX rates:', error);
        }
    };

    // Load initial data
    useEffect(() => {
        const initializeData = async () => {
            await fetchMCXData();
            await fetchProductOptionsData();
            await fetchMeltProducts(1, meltPagination.pageSize);
        };

        initializeData();

        // Set up 1-second live refresh for rates
        const interval = setInterval(() => {
            fetchMCXData();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Fetch options for dropdowns
    const fetchProductOptionsData = async () => {
        try {
            await fetchMetalOptions();
            await fetchProductOptions();
            await fetchAllSubProductOptions();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchMetalOptions = async () => {
        try {
            const response = await getMetals();
            const metalsData = response.data?.metals || response.metals || [];
            setMetalOptions(metalsData.map(metal => ({
                id: metal.id,
                name: metal.metalname,
                code: metal.metal_code
            })));
            setMetals(metalsData);
        } catch (error) {
            message.error('Failed to fetch metal options');
            console.error('Error fetching metals:', error);
        }
    };

    const handleViewPurchaseDetails = (record) => {
        setSelectedPurchasesJson(record.purchases);
        setSelectedMeltRecord(record);
        setPurchaseDetailsVisible(true);
    };

    const handleMeltProductModal = async (meltJson) => {
        setSelectedMeltData(meltJson);
        setIsMeltModalVisible(true);
    }

    const handleOpenWageModal = (wagesData) => {
        setSelectedWagesData(wagesData);
        setIsWageModalOpen(true);
    };

    const handleClosePurchaseDetails = () => {
        setPurchaseDetailsVisible(false);
        setSelectedPurchasesJson('');
        setSelectedMeltRecord(null);
    };

    const fetchProductOptions = async () => {
        try {
            const response = await getProducts(1, 100000);
            const productsData = response.data?.products || response.products || [];
            const formattedProducts = productsData.map(product => ({
                id: product.id,
                name: product.product_name,
                code: product.product_code,
                metalId: product.metal_id
            }));
            setProductOptions(formattedProducts);
            setAllProducts(productsData);
        } catch (error) {
            message.error('Failed to fetch product options');
            console.error('Error fetching products:', error);
        }
    };

    const fetchAllSubProductOptions = async () => {
        try {
            const response = await getSubProducts();
            const subsData = response.data?.subProducts || response.subProducts || [];
            const subsByProduct = {};

            subsData.forEach(sub => {
                const productId = sub.product_id;
                if (!subsByProduct[productId]) {
                    subsByProduct[productId] = [];
                }
                subsByProduct[productId].push({
                    id: sub.id,
                    name: sub.sub_product_name,
                    code: sub.sub_product_code,
                    productId: productId
                });
            });
            setSubProductOptions(subsByProduct);
            setAllSubProducts(subsData);
        } catch (error) {
            message.error('Failed to fetch sub product options');
            console.error('Error fetching sub products:', error);
        }
    };

    const fetchMeltProducts = async (page = 1, pageSize = 10, filters = {}) => {
        try {
            setIsMeltTableLoading(true);
            const response = await getAllMeltReceiptProducts({
                page: page,
                limit: pageSize,
                search: filters.search || purchaseFilters.search,
                metal: filters.metal || purchaseFilters.metal,
                status: filters.status || purchaseFilters.status,
                startDate: filters.startDate || purchaseFilters.startDate,
                endDate: filters.endDate || purchaseFilters.endDate
            });

            const meltProductsData = response.data?.purchases || response.purchases || [];
            console.log(meltProductsData)
            // Initialize calculations for each product
            const initialCalculations = {};
            meltProductsData.forEach(product => {
                initialCalculations[product.id] = calculateProductValues(product);
            });
            setCalculations(initialCalculations);

            setMeltProducts(meltProductsData);

            if (response.data?.pagination) {
                setMeltPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.data.pagination.total
                }));
            } else if (response.pagination) {
                setMeltPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.pagination.total
                }));
            }
        } catch (error) {
            message.error('Failed to load melt products');
            console.error('Error loading melt products:', error);
        } finally {
            setIsMeltTableLoading(false);
        }
    };
    const handleSearch = () => {
        setMeltPagination({
            ...meltPagination,
            current: 1 // Reset to first page when searching
        });
        fetchMeltProducts(1, meltPagination.pageSize, purchaseFilters);
    };
    const handleMarkAsMelt = async () => {
        await fetchInitialData()
        setIsMeltingPopupVisible(true)

        // fetchMeltProducts(1, meltPagination.pageSize, purchaseFilters);
    }
    const handleResetFilters = () => {
        setPurchaseFilters({
            search: '',
            metal: '',
            status: '',
            startDate: '',
            endDate: ''
        });
        setDateRange([]);
        fetchMeltProducts(1, meltPagination.pageSize);
    };
    const generatePDF = async (selectedRows = null) => {
        try {
            setPdfLoading(true);

            // Determine which rows to include in PDF
            const productsToExport = selectedRows && selectedRows.length > 0
                ? meltProducts.filter(product => selectedRows.includes(product.id))
                : meltProducts;

            if (productsToExport.length === 0) {
                message.warning('No data to export');
                return;
            }

            // Create PDF document
            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text('Melting Products Report', 105, 15, { align: 'center' });

            // Filters info
            doc.setFontSize(10);
            let filterInfo = `Report Date: ${new Date().toLocaleDateString()}`;
            if (purchaseFilters.startDate && purchaseFilters.endDate) {
                filterInfo += ` | Date Range: ${purchaseFilters.startDate} to ${purchaseFilters.endDate}`;
            }
            if (purchaseFilters.metal) {
                const metalName = getMetalNameById(purchaseFilters.metal);
                filterInfo += ` | Metal: ${metalName}`;
            }
            if (purchaseFilters.status) {
                filterInfo += ` | Status: ${purchaseFilters.status === '1' ? 'Completed' : 'Pending'}`;
            }
            doc.text(filterInfo, 105, 25, { align: 'center' });

            // Table headers
            const headers = [
                ['ID', 'Metal', 'Product', 'Weight (g)', 'Melt Weight (g)',
                    'Dust Weight (g)', 'Purity (%)', 'Net Weight (g)',
                    'Final Weight (g)', 'Status', 'Created Date']
            ];

            // Table data
            const data = productsToExport.map(product => {
                const calc = calculations[product.id] || {};
                return [
                    `#AMAMELT${product.id}`,
                    getMetalNameById(product.metal),
                    getProductNameById(product.product),
                    parseFloat(product.weight || 0).toFixed(3),
                    parseFloat(product.melt_weight || 0).toFixed(3),
                    parseFloat(product.dust_weight || 0).toFixed(3),
                    parseFloat(product.purity || 0).toFixed(2),
                    calc.netWeight ? calc.netWeight.toFixed(3) : '0.000',
                    calc.finalWeight ? calc.finalWeight.toFixed(3) : '0.000',
                    product.melt_details === null ? 'Pending' : 'Completed',
                    product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'
                ];
            });

            // Add summary row
            const totalRow = [
                'TOTAL',
                '',
                '',
                getTotalWeight(),
                getTotalMeltWeight(),
                getTotalDustWeight(),
                '',
                getTotalNetWeight(),
                getTotalFinalWeight(),
                '',
                ''
            ];
            data.push(totalRow);

            // Generate table
            autoTable(doc, {
                head: headers,
                body: data,
                startY: 30,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 10, right: 10 },
                didDrawPage: (data) => {
                    // Footer
                    doc.setFontSize(8);
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount}`,
                        doc.internal.pageSize.width / 2,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });

            // Save PDF
            const fileName = `melting-products-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            message.success(`PDF exported successfully (${productsToExport.length} records)`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            message.error('Failed to generate PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    // Function to handle bulk selection for PDF
    const handleBulkSelectForPDF = (selectedRowKeys) => {
        setSelectedForPdf(selectedRowKeys);
    };

    // Select all for PDF
    const handleSelectAllForPDF = () => {
        const allIds = meltProducts.map(product => product.id);
        setSelectedForPdf(allIds);
    };

    // Clear selection for PDF
    const handleClearSelectionForPDF = () => {
        setSelectedForPdf([]);
    };
    // Calculate product values
    const calculateProductValues = (product) => {
        const weight = parseFloat(product.weight) || 0;
        const meltWeight = parseFloat(product.melt_weight) || 0;
        const dustWeight = parseFloat(product.dust_weight) || 0;
        const purity = parseFloat(product.purity) || 100;
        const marginPercent = parseFloat(product.margin_percent);

        // Net weight after dust & stone
        const netWeight = (weight - dustWeight) * (purity / 100);

        // Margin deduction
        const marginWeight = (netWeight * marginPercent) / 100;

        // Final weight after margin
        const finalWeight = netWeight - marginWeight;

        // Get current rate
        const currentRate = liveGoldRate;

        // Amount
        const amount = finalWeight * currentRate;

        return {
            netWeight: parseFloat(netWeight.toFixed(3)),
            marginWeight: parseFloat(marginWeight.toFixed(3)),
            finalWeight: parseFloat(finalWeight.toFixed(3)),
            rate: parseFloat(currentRate.toFixed(2)),
            amount: parseFloat(amount.toFixed(2))
        };
    };

    const handleMeltTableChange = (newPagination) => {
        const { current, pageSize } = newPagination;
        setMeltPagination(prev => ({
            ...prev,
            current: current,
            pageSize: pageSize
        }));
        fetchMeltProducts(current, pageSize);
    };

    const handleMeltProductUpdate = (id, field, value) => {
        const updatedProducts = meltProducts.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );

        setMeltProducts(updatedProducts);

        // Recalculate values when relevant fields change
        if (['expected_purity', 'expected_weight', 'weight', 'melt_weight', 'dust_weight', 'stone_weight', 'purity', 'metal'].includes(field)) {
            const updatedProduct = updatedProducts.find(item => item.id === id);
            if (updatedProduct) {
                const newCalculations = calculateProductValues(updatedProduct);
                setCalculations(prev => ({
                    ...prev,
                    [id]: newCalculations
                }));
            }
        }
    };

    const handleUpdateMeltProduct = async (id) => {

        try {
            const product = meltProducts.find(item => item.id === id);

            setLoading(true);

            // Call API to update melt product
            await updateMeltProduct(id, {
                metal: product.metal,
                product: product.product,
                product_type: product.product_type,
                sub_product: product.sub_product,
                melt_weight: product.melt_weight,
                dust_weight: product.dust_weight,
                purity: product.purity,
                wages: product.wages,
                status: 1
            });

            message.success('Melt product updated successfully');

            // Refresh the table
            fetchMeltProducts(meltPagination.current, meltPagination.pageSize);

        } catch (error) {
            console.error('Error updating melt product:', error);
            message.error('Failed to update melt product');
        } finally {
            setLoading(false);
        }
    };

    const PurchaseDetailsModal = ({ purchasesJson, visible, onCancel, record }) => {
        const [purchaseData, setPurchaseData] = useState([]);
        const [loading, setLoading] = useState(false);
        const [isSaving, setIsSaving] = useState(false);
        const [cgst, setCgst] = useState(0);
        const [sgst, setSgst] = useState(0);
        const [roundOff, setRoundOff] = useState(0);

        useEffect(() => {
            if (visible && purchasesJson) {
                setLoading(true);
                try {
                    const parsedData = JSON.parse(purchasesJson || '[]');
                    const data = Array.isArray(parsedData) ? parsedData : [];

                    // Initialize rate if missing (derived from amount / gross_weight)
                    const initializedData = data.map(item => {
                        const amount = parseFloat(item.amount) || 0;
                        const weight = parseFloat(item.gross_weight) || 0;
                        if (!item.rate && weight > 0) {
                            return { ...item, rate: (amount / weight).toFixed(2) };
                        }
                        return item;
                    });

                    setPurchaseData(initializedData);

                    // Initialize tax fields from record
                    if (record) {
                        setCgst(record.cgst || 0);
                        setSgst(record.sgst || 0);
                        setRoundOff(record.round_off || 0);
                    }
                } catch (error) {
                    console.error('Error parsing purchase details:', error);
                    setPurchaseData([]);
                } finally {
                    setLoading(false);
                }
            }
        }, [visible, purchasesJson, record]);

        const handleUpdatePurchaseItem = (index, field, value) => {
            const newData = [...purchaseData];
            const item = { ...newData[index], [field]: value };

            if (field === 'rate' || field === 'gross_weight') {
                const rate = parseFloat(field === 'rate' ? value : item.rate) || 0;
                const weight = parseFloat(field === 'gross_weight' ? value : item.gross_weight) || 0;
                item.amount = (rate * weight).toFixed(2);
            } else if (field === 'amount') {
                const amount = parseFloat(value) || 0;
                const weight = parseFloat(item.gross_weight) || 0;
                if (weight > 0) {
                    item.rate = (amount / weight).toFixed(2);
                }
            }

            newData[index] = item;
            setPurchaseData(newData);
        };

        useEffect(() => {
            const total = purchaseData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            const gst = (total * 0.015).toFixed(2);
            setCgst(parseFloat(gst));
            setSgst(parseFloat(gst));
        }, [purchaseData]);

        const handleSaveChanges = async () => {
            if (!record?.id) return;

            setIsSaving(true);
            try {
                const totalWt = purchaseData.reduce((total, product) => total + parseFloat(product.gross_weight || 0), 0).toFixed(3);
                await updateMeltProduct(record.id, {
                    purchases: JSON.stringify(purchaseData),
                    weight: totalWt,
                    cgst: cgst || 0,
                    sgst: sgst || 0,
                    round_off: roundOff || 0
                });
                message.success('Product details updated successfully');
                fetchMeltProducts();
                onCancel();
            } catch (error) {
                console.error('Error updating purchase details:', error);
                message.error('Failed to update product details');
            } finally {
                setIsSaving(false);
            }
        };

        const isNewFormat = Array.isArray(purchaseData) && purchaseData.length > 0 && typeof purchaseData[0] === 'object' && purchaseData[0].purchase_id;

        const totalWeight = purchaseData.reduce((total, product) => total + parseFloat(product.gross_weight || 0), 0).toFixed(3);
        const totalAmount = purchaseData.reduce((total, product) => total + parseFloat(product.amount || 0), 0).toFixed(2);

        return (
            <Modal
                title={isNewFormat ? "Product Details" : "Purchase Details"}
                visible={visible}
                onCancel={onCancel}
                footer={[
                    <Button key="close" onClick={onCancel}>
                        Close
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={isSaving}
                        onClick={handleSaveChanges}
                        disabled={purchaseData.length === 0}
                    >
                        Save Changes
                    </Button>
                ]}
                width={isNewFormat ? 900 : 600}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <ReloadOutlined spin />
                        <div>Loading details...</div>
                    </div>
                ) : isNewFormat ? (
                    <div>
                        <Table
                            size="small"
                            dataSource={purchaseData}
                            pagination={false}
                            rowKey={(record, index) => index}
                            columns={[
                                {
                                    title: 'Purchase ID',
                                    dataIndex: 'purchase_id',
                                    key: 'purchase_id',
                                    width: 120,
                                    render: (text) => <Tag color="blue">{text}</Tag>
                                },
                                {
                                    title: 'Customer',
                                    dataIndex: 'customer_name',
                                    key: 'customer_name',
                                    width: 120,
                                    render: (text) => <Text>{text || 'N/A'}</Text>
                                },
                                {
                                    title: 'Product',
                                    key: 'product',
                                    width: 150,
                                    render: (_, record) => (
                                        <Text>
                                            {record.metal || 'N/A'} - {record.product || 'N/A'} - {record.sub_product || 'N/A'}
                                        </Text>
                                    )
                                },
                                {
                                    title: 'Product Type',
                                    key: 'product_type',
                                    width: 120,
                                    render: () => {
                                        const details = record?.metal_details ? JSON.parse(record.metal_details) : null;
                                        return <Tag color="gold">{record?.product_type || details?.conversion_type || 'old ornaments'}</Tag>;
                                    }
                                },
                                {
                                    title: 'Weight (g)',
                                    key: 'weight',
                                    width: 160,
                                    render: (_, record, index) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', width: '40px' }}>Gross:</span>
                                                <InputNumber
                                                    size="small"
                                                    value={record.gross_weight}
                                                    onChange={(val) => handleUpdatePurchaseItem(index, 'gross_weight', val)}
                                                    style={{ width: '90px' }}
                                                    step={0.001}
                                                    precision={3}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', width: '40px' }}>Net:</span>
                                                <InputNumber
                                                    size="small"
                                                    value={record.net_weight}
                                                    onChange={(val) => handleUpdatePurchaseItem(index, 'net_weight', val)}
                                                    style={{ width: '90px' }}
                                                    step={0.001}
                                                    precision={3}
                                                />
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Rate (₹/g)',
                                    key: 'rate',
                                    width: 120,
                                    render: (_, record, index) => (
                                        <InputNumber
                                            size="small"
                                            value={record.rate}
                                            onChange={(val) => handleUpdatePurchaseItem(index, 'rate', val)}
                                            style={{ width: '100px' }}
                                            precision={2}
                                        />
                                    )
                                },
                                {
                                    title: 'Amount (₹)',
                                    key: 'amount',
                                    width: 130,
                                    render: (_, record, index) => (
                                        <InputNumber
                                            size="small"
                                            value={record.amount}
                                            onChange={(val) => handleUpdatePurchaseItem(index, 'amount', val)}
                                            style={{ width: '110px' }}
                                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                            precision={2}
                                        />
                                    )
                                }
                            ]}
                            summary={() => (
                                <Table.Summary>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell colSpan={4}>
                                            <Text strong>Sub Total:</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell>
                                            <Text strong>{totalWeight}g</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell>
                                            <Text strong>₹{totalAmount}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                        <Divider />
                        <Row gutter={16}>
                            <Col span={8}>
                                <Text strong>CGST (1.5%) (₹): </Text>
                                <InputNumber
                                    size="small"
                                    value={cgst}
                                    onChange={setCgst}
                                    style={{ width: '100%' }}
                                    precision={2}
                                />
                            </Col>
                            <Col span={8}>
                                <Text strong>SGST (1.5%) (₹): </Text>
                                <InputNumber
                                    size="small"
                                    value={sgst}
                                    onChange={setSgst}
                                    style={{ width: '100%' }}
                                    precision={2}
                                />
                            </Col>
                            <Col span={8}>
                                <Text strong>Round Off (₹): </Text>
                                <InputNumber
                                    size="small"
                                    value={roundOff}
                                    onChange={setRoundOff}
                                    style={{ width: '100%' }}
                                    precision={2}
                                />
                            </Col>
                        </Row>
                        <div style={{ marginTop: 16, textAlign: 'right', paddingRight: '20px' }}>
                            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                Grand Total: ₹{(parseFloat(totalAmount) + parseFloat(cgst || 0) + parseFloat(sgst || 0) + parseFloat(roundOff || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Title>
                        </div>
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Text type="secondary">Total Products: {purchaseData.length}</Text>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Text strong>Linked Purchase IDs: </Text>
                        {purchaseData.map((id, index) => (
                            <Tag key={index} color="blue" style={{ margin: '4px' }}>
                                #{id}
                            </Tag>
                        ))}
                        <Divider />
                        <Text>Total Purchases: {purchaseData.length}</Text>
                    </div>
                )}
            </Modal>
        );
    };

    function MeltUpdateModal({ visible, onClose, meltJson }) {

        const [form] = Form.useForm();
        const [pureWeight, setPureWeight] = useState(0);
        const [finalWeight, setFinalWeight] = useState(0);
        const [isConvert, setIsConvert] = useState("22k");
        const [goldSmithName, setGoldSmithName] = useState('');
        const [filteredProducts, setFilteredProducts] = useState([]);
        const [filteredSubProducts, setFilteredSubProducts] = useState([]);
        const filterProductsByMetal = (metalId) => {
            const filtered = productOptions.filter(
                product => product.metalId === metalId
            );

            setFilteredProducts(filtered);
            setFilteredSubProducts([]);

            form.setFieldsValue({
                product_id: null,
                sub_product_id: null
            });
        };
        const filterSubProductsByProduct = (productId) => {
            setFilteredSubProducts(subProductOptions[productId] || []);

            form.setFieldsValue({
                sub_product_id: null
            });
        };


        // Set default total weight when modal opens
        useEffect(() => {
            if (visible && meltJson) {
                try {
                    const details = meltJson.metal_details ? JSON.parse(meltJson.metal_details) : null;

                    if (details) {
                        form.setFieldsValue({
                            total_weight: parseFloat(details.weight || meltJson.weight || 0).toFixed(3),
                            purity: details.purity,
                            copper_weight: details.copper_weight,
                            metal: details.metal,
                            product: details.product,
                            sub_product: details.sub_product,
                            gold_smith_name: meltJson.assign_smith_name
                        });

                        setIsConvert(details.conversion_type || "22k");
                        setPureWeight(parseFloat(details.pure_weight || 0));
                        setFinalWeight(parseFloat(details.final_weight || 0));

                        if (details.metal) filterProductsByMetal(details.metal);
                        if (details.product) filterSubProductsByProduct(details.product);
                    } else {
                        form.setFieldsValue({
                            total_weight: parseFloat(meltJson.weight || 0).toFixed(3),
                            gold_smith_name: meltJson.assign_smith_name
                        });
                        setIsConvert("22k");
                        setPureWeight(0);
                        setFinalWeight(0);
                    }
                } catch (e) {
                    console.error("Error parsing metal_details:", e);
                    form.setFieldsValue({
                        total_weight: parseFloat(meltJson.weight || 0).toFixed(3)
                    });
                }
            }
        }, [visible, meltJson]);

        const onValuesChange = (_, values) => {
            const { total_weight, purity, copper_weight, gold_smith_name } = values;

            const pw = total_weight && purity ? (total_weight * purity) / 100 : 0;
            setPureWeight(pw);
            setGoldSmithName(gold_smith_name)

            if (isConvert === "24K" && copper_weight) {
                setFinalWeight(pw + parseFloat(copper_weight));
            } else {
                setFinalWeight(pw);
            }
        };

        const onFinish = async (values) => {
            const data = {
                weight: values.total_weight,
                purity: values.purity,
                pure_weight: parseFloat(pureWeight).toFixed(3),
                copper_weight: parseFloat(values.copper_weight).toFixed(3) || 0,
                final_weight: parseFloat(finalWeight).toFixed(3),
                metal: values.metal,
                product: values.product,
                sub_product: values.sub_product,
                conversion_type: isConvert
            }

            const updateData = {
                melt_weight: parseFloat(finalWeight).toFixed(3),
                melt_details: JSON.stringify(data),
                assign_smith_name: values.gold_smith_name,
                metal: values.metal,
                product: values.product,
                sub_product: values.sub_product
            }

            console.log(updateData);

            await updateMeltDetails(meltJson.id, updateData);

            message.success('Melt Details updated successfully');

            fetchMeltProducts(meltPagination.current, meltPagination.pageSize);

            onClose();
        };

        return (
            <Modal
                title="Received Melt Product"
                visible={visible}
                onCancel={onClose}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={onValuesChange}
                >
                    <Form.Item
                        label="Total Weight (g)"
                        name="total_weight"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} step={0.01} style={{ width: "100%" }} readOnly />
                    </Form.Item>

                    <Form.Item
                        label="Purity (%)"
                        name="purity"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} step={0.1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label="Pure Weight">
                        <InputNumber value={parseFloat(pureWeight).toFixed(3)} readOnly style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        label="Metal"
                        name="metal"
                        rules={[{ required: true, message: "Select metal" }]}
                    >
                        <Select
                            placeholder="Select Metal"
                            onChange={filterProductsByMetal}
                            allowClear
                        >
                            {metalOptions.map(metal => (
                                <Select.Option key={metal.id} value={metal.id}>
                                    {metal.name} ({metal.code})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        label="Product"
                        name="product"
                        rules={[{ required: true, message: "Select product" }]}
                    >
                        <Select
                            placeholder="Select Product"
                            onChange={filterSubProductsByProduct}
                            disabled={!filteredProducts.length}
                            allowClear
                        >
                            {filteredProducts.map(product => (
                                <Select.Option key={product.id} value={product.id}>
                                    {product.name} ({product.code})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        label="Sub Product"
                        name="sub_product"
                        rules={[{ required: true, message: "Select sub product" }]}
                    >
                        <Select
                            placeholder="Select Sub Product"
                            disabled={!filteredSubProducts.length}
                            allowClear
                        >
                            {filteredSubProducts.map(sub => (
                                <Select.Option key={sub.id} value={sub.id}>
                                    {sub.name} ({sub.code})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>



                    <Form.Item label="Conversion Type">
                        <Radio.Group value={isConvert} onChange={(e) => setIsConvert(e.target.value)}>
                            <Radio value="24K">24K (yes)</Radio>
                            <Radio value="22k">22k (No)</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {isConvert === "24K" && (
                        <Form.Item
                            label="Copper Weight (g)"
                            name="copper_weight"
                            rules={[{ required: true }]}
                        >
                            <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
                        </Form.Item>
                    )}

                    <Form.Item label="Final Weight">
                        <InputNumber value={parseFloat(finalWeight).toFixed(3)} readOnly style={{ width: "100%" }} />
                    </Form.Item>

                    {/* <Form.Item label="Gold Smith Name" name="gold_smith_name" rules={[{ required: true }]}>
                        <Input type='text' />
                    </Form.Item> */}

                    <div style={{ textAlign: "right" }}>
                        <Button onClick={onClose} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal>
        );
    }


    function WagesUpdate({ visible, onClose, wagesData }) {
        const [form] = Form.useForm();
        const [currentBalance, setCurrentBalance] = useState(0);
        const [historyList, setHistoryList] = useState([]);
        const [partialAmount, setPartialAmount] = useState(null); // store even if input hides

        useEffect(() => {
            if (!wagesData) return;

            const total = Number(wagesData.total_wage ?? 0);
            form.setFieldsValue({ total_wages: total });

            const history = wagesData.wages_history ? JSON.parse(wagesData.wages_history) : [];
            setHistoryList(history);

            const prevPaid = history.reduce((sum, h) => sum + Number(h.paid_amount ?? 0), 0);

            const initialBalance = total - prevPaid;
            setCurrentBalance(initialBalance);

            form.setFieldsValue({ balance: initialBalance });
        }, [wagesData, form]);

        // handle typing safely
        const handleFieldChange = (_, allValues) => {
            const total = Number(allValues.total_wages ?? 0);
            const enteredPartial = Number(allValues.partial_amount ?? partialAmount ?? 0);

            const history = wagesData?.wages_history ? JSON.parse(wagesData.wages_history) : [];
            const prevPaid = history.reduce((sum, h) => sum + Number(h.paid_amount ?? 0), 0);

            let newBalance = total - (prevPaid + enteredPartial);

            if (newBalance < 0) newBalance = 0;

            setPartialAmount(enteredPartial);
            setCurrentBalance(newBalance);

            form.setFieldsValue({ balance: newBalance });
        };

        const handleSaveWages = async (values) => {
            const total = Number(values.total_wages ?? 0);
            const finalPaid = Number(partialAmount ?? values.partial_amount ?? 0);

            const history = wagesData.wages_history ? JSON.parse(wagesData.wages_history) : [];
            const prevPaid = history.reduce((sum, h) => sum + Number(h.paid_amount ?? 0), 0);

            const newBalance = total - (prevPaid + finalPaid);

            const newEntry = {
                paid_amount: finalPaid,
                balance: newBalance < 0 ? 0 : newBalance,
                settled_at: new Date().toISOString()
            };

            const updateData = {
                total_wages: total,
                wages_history: JSON.stringify([...history, newEntry])
            };

            await updateMeltWages(wagesData.id, updateData);

            message.success("Wages updated successfully");
            fetchMeltProducts(meltPagination.current, meltPagination.pageSize);

            onClose();
        };

        return (
            <Modal
                title="Update Wages Amount"
                visible={visible}
                onCancel={onClose}
                footer={null}
                destroyOnClose
            >
                {/* Previous History List */}
                {historyList.length > 0 && (
                    <div style={{ padding: 10, background: "#fafafa", marginBottom: 12, borderRadius: 6 }}>
                        <strong>Previous Payments:</strong>
                        <ul style={{ marginTop: 8 }}>
                            {historyList.map((h, i) => (
                                <li key={i}>
                                    ₹{Number(h.paid_amount)} — {new Date(h.settled_at).toLocaleString()} — Balance: ₹{Number(h.balance)}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={handleFieldChange}
                    onFinish={handleSaveWages}
                >
                    <Form.Item
                        label="Total Wages"
                        name="total_wages"
                        rules={[{ required: true, message: "Enter total wages" }]}
                    >
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>

                    {/* Always show until SAVE is clicked */}
                    <Form.Item
                        label="Partial Amount"
                        name="partial_amount"
                        rules={[{ required: true, message: "Enter partial amount" }]}
                    >
                        <InputNumber
                            min={1}
                            style={{ width: "100%" }}
                            onChange={(value) => setPartialAmount(value)}
                        />
                    </Form.Item>

                    <Form.Item label="Balance Amount" name="balance">
                        <InputNumber readOnly style={{ width: "100%" }} />
                    </Form.Item>

                    <div style={{ textAlign: "right" }}>
                        <Button onClick={onClose} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit"
                            disabled={
                                historyList.length > 0 &&
                                historyList[historyList.length - 1].balance <= 0
                            }>
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal>
        );
    }



    const fetchInitialData = async (page = 1, pageSize = 10000000) => {
        try {
            setIsTableLoading(true);
            const purchasesResponse = await getAllMeltReceiptPurchases({
                page: page,
                limit: pageSize,
                search: purchaseFilters.search,
                metal: purchaseFilters.metal,
                status: purchaseFilters.status
            });

            setSelectedPurchases(purchasesResponse.purchases)
            setPurchases(purchasesResponse.purchases);
            setFilteredPurchases(purchasesResponse.purchases);

            if (purchasesResponse.pagination) {
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: purchasesResponse.pagination.total
                }));
            }

        } catch (error) {
            message.error('Failed to load purchases data');
            console.error('Error loading purchases data:', error);
        } finally {
            setIsTableLoading(false);
        }
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        const { current, pageSize } = newPagination;
        setPagination(prev => ({
            ...prev,
            current: current,
            pageSize: pageSize
        }));
        applyPurchaseFilters(current, pageSize);
    };

    const applyPurchaseFilters = async (page = 1, pageSize = pagination.pageSize) => {
        try {
            setIsTableLoading(true);
            const purchasesResponse = await getAllMeltReceiptPurchases({
                page: page,
                limit: pageSize,
                search: purchaseFilters.search,
                metal: purchaseFilters.metal,
                status: purchaseFilters.status
            });

            setFilteredPurchases(purchasesResponse.purchases || []);

            if (purchasesResponse.pagination) {
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: purchasesResponse.pagination.total
                }));
            }

        } catch (error) {
            message.error('Failed to filter purchases');
            console.error('Error filtering purchases:', error);
        } finally {
            setIsTableLoading(false);
        }
    };

    // useEffect(() => {
    //     applyPurchaseFilters(1);
    // }, [purchaseFilters]);

    // Purchase selection functions
    const togglePurchaseSelection = (purchase) => {
        setSelectedPurchases(prev => {
            const isSelected = prev.some(p => p.id === purchase.id);
            if (isSelected) {
                return prev.filter(p => p.id !== purchase.id);
            } else {
                return [...prev, purchase];
            }
        });
    };

    const selectAllPurchases = () => {
        const availablePurchases = filteredPurchases.filter(p => p.melting_status === 0);
        setSelectedPurchases(availablePurchases);
    };

    const clearAllSelections = () => {
        setSelectedPurchases([]);
    };

    const getTotalSelectedWeight = () => {
        return selectedPurchases.reduce((total, purchase) => {
            const productWeight = purchase.products?.[0]?.gross_weight || 0;
            return total + parseFloat(productWeight);
        }, 0).toFixed(3);
    };

    const getTotalSelectedAmount = () => {
        return selectedPurchases.reduce((total, purchase) => {
            return total + parseFloat(purchase.total_amount || 0);
        }, 0).toFixed(2);
    };

    // Handle opening confirmation popup
    const handleSubmitAll = () => {
        if (selectedPurchases.length === 0) {
            message.warning('Please select at least one purchase to submit');
            return;
        }

        // Initialize all as selected in confirmation modal
        setConfirmationSelections(selectedPurchases.map(p => p.id));
        setIsConfirmationPopupVisible(true);
    };
    const handleFinalSubmit = async (meltingData = null) => {
        // If meltingData is provided from confirmation modal, use it
        // Otherwise use the existing logic with confirmationSelections
        if (!meltingData && confirmationSelections.length === 0) {
            message.warning('Please select at least one product to submit');
            return;
        }

        try {
            setLoading(true);

            let selectedProducts = [];
            let totalWeight = 0;
            let selectedPurchaseIds = [];

            if (meltingData) {
                // Use the data passed from confirmation modal
                selectedProducts = meltingData;

                // Calculate total weight from the provided meltingData
                totalWeight = selectedProducts.reduce((total, product) => {
                    const productWeight = product.gross_weight || product.weight || 0;
                    return total + parseFloat(productWeight);
                }, 0).toFixed(3);

                // Get unique purchase IDs
                selectedPurchaseIds = [...new Set(selectedProducts.map(product => product.purchase_record_id))];
            } else {
                // Original logic for when called without meltingData
                // Extract all products from selected purchases with consistent uniqueKey
                const allProducts = selectedPurchases.flatMap((purchase, purchaseIndex) => {
                    // Handle both single product object and array of products
                    const products = purchase.products;

                    if (Array.isArray(products)) {
                        return products.map((product, productIndex) => ({
                            ...product,
                            purchase_record_id: purchase.id,
                            purchase_id: purchase.purchase_id,
                            customer_name: purchase.customer_name,
                            uniqueKey: `${purchase.id}-${productIndex}`
                        }));
                    } else if (typeof products === 'object' && products !== null) {
                        // Handle single product object
                        return [{
                            ...products,
                            purchase_record_id: purchase.id,
                            purchase_id: purchase.purchase_id,
                            customer_name: purchase.customer_name,
                            uniqueKey: `${purchase.id}-0`
                        }];
                    } else {
                        return [];
                    }
                });

                // Filter only the selected products based on confirmationSelections
                selectedProducts = allProducts.filter(product =>
                    confirmationSelections.includes(product.uniqueKey)
                );

                // Calculate total weight for ONLY the selected products
                totalWeight = selectedProducts.reduce((total, product) => {
                    const productWeight = product.gross_weight || product.weight || 0;
                    return total + parseFloat(productWeight);
                }, 0).toFixed(3);

                // Get unique purchase IDs from selected products
                selectedPurchaseIds = [...new Set(selectedProducts.map(product => product.purchase_record_id))];
            }

            // Log the selected products with expected values for debugging
            console.log('Submitting melting data with expected values:', selectedProducts);

            // Prepare the data to be sent to createMeltProducts
            // Include expected_purity and expected_weight in the data
            const meltProductsData = {
                selected: true,
                total_weight: totalWeight,
                purchases: JSON.stringify(selectedProducts.map(product => ({
                    ...product,
                    // Ensure expected values are included
                    expected_purity: product.expected_purity || product.purity || 0,
                    expected_weight: product.expected_weight || product.net_weight || 0
                }))),
                // Optional: Add summary of expected values
                expected_summary: {
                    total_expected_weight: selectedProducts.reduce((sum, p) => sum + (parseFloat(p.expected_weight) || 0), 0).toFixed(3),
                    avg_expected_purity: selectedProducts.reduce((sum, p, _, arr) =>
                        sum + (parseFloat(p.expected_purity) || 0) / arr.length, 0
                    ).toFixed(2)
                }
            };

            // Call createMeltProducts API with the enhanced data
            if (selectedProducts.length > 0) {
                await createMeltProducts(meltProductsData);
            }

            // Update melting status for each purchase that has selected products
            for (const purchaseId of selectedPurchaseIds) {
                const purchaseMeltingData = {
                    purchase_id: purchaseId,
                    melting_status: 1,
                    melted_at: new Date().toISOString(),
                    // Optionally include expected values in the purchase update
                    expected_values: JSON.stringify(selectedProducts
                        .filter(p => p.purchase_record_id === purchaseId)
                        .map(p => ({
                            product_id: p.id,
                            expected_purity: p.expected_purity,
                            expected_weight: p.expected_weight
                        }))
                    )
                };

                await updatePurchaseMeltStatus(purchaseId, purchaseMeltingData);
            }

            // Enhanced success message with detailed information including expected values
            const totalExpectedWeight = selectedProducts.reduce((sum, p) =>
                sum + (parseFloat(p.expected_weight) || 0), 0
            ).toFixed(3);

            const avgExpectedPurity = selectedProducts.reduce((sum, p) =>
                sum + (parseFloat(p.expected_purity) || 0), 0
            ) / selectedProducts.length;

            Swal.fire({
                icon: 'success',
                title: 'Melting Process Completed',
                html: `
                    <div style="text-align: left;">
                        <h4>✅ Selected for Melting:</h4>
                        <p>• Products: <strong>${selectedProducts.length}</strong></p>
                        <p>• Weight: <strong>${totalWeight}g</strong></p>
                        <p>• Expected Weight: <strong>${totalExpectedWeight}g</strong></p>
                        <p>• Avg Expected Purity: <strong>${avgExpectedPurity.toFixed(2)}%</strong></p>
                        <p>• Purchases: <strong>${selectedPurchaseIds.length}</strong></p>
                        <hr style="margin: 10px 0;">
                        <small><em>Expected values have been recorded for each product.</em></small>
                    </div>
                `,
                width: 500,
                timer: 4000,
                showConfirmButton: true
            });

            // Reset and close all modals
            setSelectedPurchases([]);
            setConfirmationSelections([]);
            setExpectedValues({}); // Clear expected values state
            setIsConfirmationPopupVisible(false);
            setIsMeltingPopupVisible(false);

            // Refresh data
            fetchInitialData(pagination.current, pagination.pageSize);
            fetchMeltProducts(meltPagination.current, meltPagination.pageSize);

        } catch (error) {
            console.error('Error updating melting status:', error);
            message.error('Failed to update melting status');
        } finally {
            setLoading(false);
        }
    };

    // Toggle selection in confirmation modal
    const toggleConfirmationSelection = (purchaseId) => {
        setConfirmationSelections(prev =>
            prev.includes(purchaseId)
                ? prev.filter(id => id !== purchaseId)
                : [...prev, purchaseId]
        );
    };

    // Select all in confirmation modal
    const selectAllInConfirmation = () => {
        setConfirmationSelections(selectedPurchases.map(p => p.id));
    };

    // Clear all in confirmation modal
    const clearAllInConfirmation = () => {
        setConfirmationSelections([]);
    };
    const [expectedValues, setExpectedValues] = useState({});
    // Add expectedValues state at the top with other states

    // Update the renderConfirmationPopup function
    const renderConfirmationPopup = () => {
        // Extract all products from selected purchases with purchase info
        const allProducts = selectedPurchases.flatMap((purchase, purchaseIndex) => {
            const products = purchase.products;

            if (Array.isArray(products)) {
                return products.map((product, productIndex) => {
                    const uniqueKey = `${purchase.id}-${productIndex}`;
                    return {
                        ...product,
                        purchase_record_id: purchase.id,
                        purchase_id: purchase.purchase_id,
                        customer_name: purchase.customer_name,
                        uniqueKey: uniqueKey,
                        // Use expectedValues if available, otherwise use product values
                        expected_purity: expectedValues[uniqueKey]?.purity !== undefined
                            ? expectedValues[uniqueKey].purity
                            : (product.purity || 0),
                        expected_weight: expectedValues[uniqueKey]?.weight !== undefined
                            ? expectedValues[uniqueKey].weight
                            : (product.net_weight || 0)
                    };
                });
            } else if (typeof products === 'object' && products !== null) {
                const uniqueKey = `${purchase.id}-0`;
                return [{
                    ...products,
                    purchase_record_id: purchase.id,
                    purchase_id: purchase.purchase_id,
                    customer_name: purchase.customer_name,
                    uniqueKey: uniqueKey,
                    expected_purity: expectedValues[uniqueKey]?.purity !== undefined
                        ? expectedValues[uniqueKey].purity
                        : (products.purity || 0),
                    expected_weight: expectedValues[uniqueKey]?.weight !== undefined
                        ? expectedValues[uniqueKey].weight
                        : (products.net_weight || 0)
                }];
            } else {
                return [];
            }
        });

        // Calculate totals only for currently selected products in confirmation
        const selectedProducts = allProducts.filter(product =>
            confirmationSelections.includes(product.uniqueKey)
        );

        const notSelectedProducts = allProducts.filter(product =>
            !confirmationSelections.includes(product.uniqueKey)
        );

        const calculateSelectedTotal = () => {
            return selectedProducts.reduce((acc, product) => {
                const productWeight = product.gross_weight || product.weight || 0;
                const amount = product.amount || 0;

                return {
                    weight: acc.weight + parseFloat(productWeight),
                    amount: acc.amount + parseFloat(amount),
                    count: acc.count + 1
                };
            }, { weight: 0, amount: 0, count: 0 });
        };

        const calculateNotSelectedTotal = () => {
            return notSelectedProducts.reduce((acc, product) => {
                const productWeight = product.gross_weight || product.weight || 0;
                const amount = product.amount || 0;

                return {
                    weight: acc.weight + parseFloat(productWeight),
                    amount: acc.amount + parseFloat(amount),
                    count: acc.count + 1
                };
            }, { weight: 0, amount: 0, count: 0 });
        };

        const selectedTotals = calculateSelectedTotal();
        const notSelectedTotals = calculateNotSelectedTotal();

        const totals = {
            selected: {
                weight: selectedTotals.weight.toFixed(3),
                amount: selectedTotals.amount.toFixed(2),
                count: selectedTotals.count
            },
            notSelected: {
                weight: notSelectedTotals.weight.toFixed(3),
                amount: notSelectedTotals.amount.toFixed(2),
                count: notSelectedTotals.count
            }
        };

        // Select all products in confirmation
        const selectAllInConfirmation = () => {
            const allProductIds = allProducts.map(product => product.uniqueKey);
            setConfirmationSelections(allProductIds);
        };

        // Clear all selections in confirmation
        const clearAllInConfirmation = () => {
            setConfirmationSelections([]);
        };

        // Toggle individual product selection
        const toggleConfirmationSelection = (productUniqueKey) => {
            setConfirmationSelections(prev => {
                const isSelected = prev.includes(productUniqueKey);
                if (isSelected) {
                    return prev.filter(id => id !== productUniqueKey);
                } else {
                    return [...prev, productUniqueKey];
                }
            });
        };

        // Handle purity change
        const handlePurityChange = (uniqueKey, value) => {
            setExpectedValues(prev => ({
                ...prev,
                [uniqueKey]: {
                    ...prev[uniqueKey],
                    purity: value || 0
                }
            }));
        };

        // Handle weight change
        const handleWeightChange = (uniqueKey, value) => {
            setExpectedValues(prev => ({
                ...prev,
                [uniqueKey]: {
                    ...prev[uniqueKey],
                    weight: value || 0
                }
            }));
        };

        // Product Details Component for Confirmation
        const ConfirmationProductDetails = ({ product }) => {
            const [details, setDetails] = useState({
                metalName: 'Loading...',
                productName: 'Loading...',
                subProductName: 'Loading...'
            });

            const isSelected = confirmationSelections.includes(product.uniqueKey);

            useEffect(() => {
                const fetchDetails = async () => {
                    try {
                        const [metalRes, productRes] = await Promise.all([
                            getMetalById(product.metal),
                            getProductById(product.product)
                        ]);

                        setDetails({
                            metalName: metalRes?.metalname || 'N/A',
                            productName: productRes?.product_name || 'N/A',
                            subProductName: product.sub_product || 'N/A'
                        });
                    } catch (error) {
                        console.error('Error fetching details:', error);
                        setDetails({
                            metalName: 'Error',
                            productName: 'Error',
                            subProductName: 'Error'
                        });
                    }
                };

                if (product?.metal && product?.product) {
                    fetchDetails();
                }
            }, [product]);

            return (
                <div>
                    <div>
                        <Text strong>{details.metalName}</Text> - {details.productName}
                        {details.subProductName && ` - ${details.subProductName}`}
                        {isSelected && <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>Selected</Tag>}
                    </div>
                    <div style={{ marginTop: 4 }}>
                        <Space size="small">
                            <Text type="secondary">Gross: {product.gross_weight || '0.000'}g</Text>
                            <Text type="secondary">Net: {product.net_weight || '0.000'}g</Text>
                        </Space>
                    </div>
                    <div style={{ marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            Purity: {product.purity || '0'}% | Rate: ₹{product.rate || '0.00'}
                        </Text>
                    </div>
                </div>
            );
        };

        // Update handleFinalSubmit to include expected values
        // Update handleFinalSubmit to include expected values
        const handleFinalSubmits = async () => {
            // Prepare data with expected values
            const meltingData = confirmationSelections.map(uniqueKey => {
                const product = allProducts.find(p => p.uniqueKey === uniqueKey);
                return {
                    ...product,
                    expected_purity: expectedValues[uniqueKey]?.purity !== undefined
                        ? expectedValues[uniqueKey].purity
                        : (product.purity || 0),
                    expected_weight: expectedValues[uniqueKey]?.weight !== undefined
                        ? expectedValues[uniqueKey].weight
                        : (product.net_weight || 0)
                };
            });

            console.log('Submitting melting data with expected values:', meltingData);

            try {
                setLoading(true);

                // Call the main handleFinalSubmit with the prepared data
                await handleFinalSubmit(meltingData);

                // The reset will happen inside handleFinalSubmit
                // No need to reset here as it's handled in the main function
            } catch (error) {
                console.error('Error submitting melting data:', error);
                message.error('Failed to submit melting data');
            } finally {
                setLoading(false);
            }
        };

        return (
            <Modal
                title={
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Select Products for Melting
                        <Tag color="blue" style={{ marginLeft: 16 }}>
                            {confirmationSelections.length} of {allProducts.length} products selected
                        </Tag>
                    </div>
                }
                visible={isConfirmationPopupVisible}
                onCancel={() => {
                    setIsConfirmationPopupVisible(false);
                    setExpectedValues({});
                    setConfirmationSelections([]);
                }}
                footer={null}
                width={1000}
                style={{ top: 20 }}
                destroyOnClose
            >
                <Card>
                    {/* Summary Statistics */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={8}>
                            <Card size="small">
                                <Statistic
                                    title="Selected Products"
                                    value={totals.selected.count}
                                    prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                                    valueStyle={{ color: "#52c41a" }}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <Text>Weight: <Text strong>{totals.selected.weight}g</Text></Text>
                                    <br />
                                    <Text>Amount: <Text strong>₹{totals.selected.amount}</Text></Text>
                                </div>
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size="small">
                                <Statistic
                                    title="Available Products"
                                    value={allProducts.length}
                                    valueStyle={{ color: "#1890ff" }}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <Text>Total Weight: <Text strong>
                                        {(parseFloat(totals.selected.weight) + parseFloat(totals.notSelected.weight)).toFixed(3)}g
                                    </Text></Text>
                                    <br />
                                    <Text>Total Amount: <Text strong>
                                        ₹{(parseFloat(totals.selected.amount) + parseFloat(totals.notSelected.amount)).toFixed(2)}
                                    </Text></Text>
                                </div>
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card size="small">
                                <Statistic
                                    title="From Purchases"
                                    value={selectedPurchases.length}
                                    valueStyle={{ color: "#fa8c16" }}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <Text>Products: <Text strong>{allProducts.length}</Text></Text>
                                    <br />
                                    <Text>Customers: <Text strong>
                                        {[...new Set(selectedPurchases.map(p => p.customer_name))].length}
                                    </Text></Text>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Selection Actions */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Space>
                                <Button onClick={selectAllInConfirmation}>
                                    Select All Products
                                </Button>
                                <Button onClick={clearAllInConfirmation}>
                                    Clear All
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    {/* Products Table */}
                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                        <Table
                            size="small"
                            dataSource={allProducts}
                            rowKey={product => product.uniqueKey}
                            pagination={false}
                            columns={[
                                {
                                    title: 'Select',
                                    key: 'selection',
                                    width: 80,
                                    render: (_, product) => (
                                        <Checkbox
                                            checked={confirmationSelections.includes(product.uniqueKey)}
                                            onChange={() => toggleConfirmationSelection(product.uniqueKey)}
                                        />
                                    )
                                },
                                {
                                    title: 'Purchase ID',
                                    dataIndex: 'purchase_id',
                                    key: 'purchase_id',
                                    width: 120,
                                    render: (text) => <Tag color="blue">{text}</Tag>
                                },
                                {
                                    title: 'Customer',
                                    dataIndex: 'customer_name',
                                    key: 'customer_name',
                                    width: 150,
                                    render: (text) => <Text>{text}</Text>
                                },
                                {
                                    title: 'Product Details',
                                    key: 'product_details',
                                    width: 250,
                                    render: (_, product) => <ConfirmationProductDetails product={product} />
                                },
                                {
                                    title: 'Weight (g)',
                                    key: 'weight',
                                    width: 120,
                                    render: (_, product) => (
                                        <div>
                                            <div>Gross: {product.gross_weight || '0.000'}</div>
                                            <div>Net: {product.net_weight || '0.000'}</div>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Amount (₹)',
                                    key: 'amount',
                                    width: 100,
                                    render: (_, product) => (
                                        <Text strong>₹{product.amount || '0.00'}</Text>
                                    )
                                },
                                {
                                    title: 'Expected Purity',
                                    key: 'expected_purity',
                                    width: 150,
                                    render: (_, record) => {
                                        const isSelected = confirmationSelections.includes(record.uniqueKey);
                                        const currentValue = expectedValues[record.uniqueKey]?.purity !== undefined
                                            ? expectedValues[record.uniqueKey].purity
                                            : record.expected_purity;

                                        return (
                                            <InputNumber
                                                min={0}
                                                max={100}
                                                style={{ width: '100%' }}
                                                value={currentValue}
                                                placeholder="Purity (%)"
                                                disabled={!isSelected}
                                                onChange={(value) => handlePurityChange(record.uniqueKey, value)}
                                            />
                                        );
                                    }
                                },
                                {
                                    title: 'Expected Weight',
                                    key: 'expected_weight',
                                    width: 150,
                                    render: (_, record) => {
                                        const isSelected = confirmationSelections.includes(record.uniqueKey);
                                        const currentValue = expectedValues[record.uniqueKey]?.weight !== undefined
                                            ? expectedValues[record.uniqueKey].weight
                                            : record.expected_weight;

                                        return (
                                            <InputNumber
                                                min={0}
                                                style={{ width: '100%' }}
                                                value={currentValue}
                                                placeholder="Weight (g)"
                                                disabled={!isSelected}
                                                onChange={(value) => handleWeightChange(record.uniqueKey, value)}
                                            />
                                        );
                                    }
                                }
                            ]}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button
                                onClick={() => {
                                    setIsConfirmationPopupVisible(false);
                                    setExpectedValues({});
                                    setConfirmationSelections([]);
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleFinalSubmits}
                                disabled={confirmationSelections.length === 0}
                                loading={loading}
                                style={{
                                    background: "#52c41a",
                                    borderColor: "#52c41a"
                                }}
                                icon={<CheckCircleOutlined />}
                            >
                                Confirm Melting
                            </Button>
                        </Space>
                    </div>
                </Card>
            </Modal>
        );
    };

    const startMeltingProcess = async () => {
        await fetchInitialData(1, pagination.pageSize);

        setIsConfirmationPopupVisible(true);
    };

    // Add these helper functions
    const getMetalNameById = (metalId) => {
        const metal = metalOptions.find(m => m.id === Number(metalId));
        return metal?.name || 'N/A';
    };

    const getProductNameById = (productId) => {
        const product = productOptions.find(p => p.id === Number(productId));
        return product?.name || 'N/A';
    };

    const getSubProductNameById = (subProductId) => {
        if (!subProductId || !Array.isArray(subProducts)) return 'N/A';

        const subProduct = subProducts.find(
            sp => sp.id === Number(subProductId)
        );

        return subProduct?.sub_product_name || 'N/A';
    };


    // const getLatestBalance = (record) => {
    //     if (!record.wages_history) return null;

    //     const history = JSON.parse(record.wages_history);
    //     if (!history.length) return null;

    //     console.log(history);

    //     return history[history.length - 1].balance;
    // };


    const calculateExpectedValues = (record) => {
        if (!record.purchases) return { expectedPurity: 0, expectedWeight: 0 };

        const purchases = JSON.parse(record.purchases);

        let totalNetWeight = 0;
        let totalPureWeight = 0;

        purchases.forEach(p => {
            const net = Number(p.net_weight || 0);
            const purity = Number(p.expected_purity || p.purity || 0);

            totalNetWeight += net;
            totalPureWeight += (net * purity) / 100;
        });

        return {
            expectedPurity: totalNetWeight
                ? (totalPureWeight / totalNetWeight) * 100
                : 0,
            expectedWeight: totalPureWeight
        };
    };
    // Add these states at the top with other states
    const [isAssignSmithModalVisible, setIsAssignSmithModalVisible] = useState(false);
    const [selectedProductForSmith, setSelectedProductForSmith] = useState(null);

    // Add this function near your other handler functions
    const handleOpenAssignSmithModal = (product) => {
        setSelectedProductForSmith(product);
        setIsAssignSmithModalVisible(true);
    };

    const handleCloseAssignSmithModal = () => {
        setIsAssignSmithModalVisible(false);
        setSelectedProductForSmith(null);
    };

    const handleAssignSmith = async (values) => {
        try {
            setLoading(true);
            const formatMySQLDate = (date = new Date()) => {
                return date.toISOString().slice(0, 19).replace('T', ' ');
            };
            const updateData = {
                assign_smith_name: values.smith_name,
                total_wage: values.wages || 0.0,
                assigned_at: formatMySQLDate()
            };

            await updateMeltDetails(selectedProductForSmith.id, updateData);

            message.success('Smith assigned successfully');

            // Refresh the table
            fetchMeltProducts(meltPagination.current, meltPagination.pageSize);

            handleCloseAssignSmithModal();
        } catch (error) {
            console.error('Error assigning smith:', error);
            message.error('Failed to assign smith');
        } finally {
            setLoading(false);
        }
    };

    // Add the Assign Smith Popup Component
    const AssignSmithPopup = ({ visible, onClose, product, onAssign }) => {
        const [form] = Form.useForm();

        useEffect(() => {
            if (product && visible) {
                form.setFieldsValue({
                    smith_name: product.assign_smith_name || '',
                    wages: product.wages || 0
                });
            }
        }, [product, visible, form]);

        const onFinish = (values) => {
            onAssign(values);
        };

        return (
            <Modal
                title="Assign Smith"
                visible={visible}
                onCancel={onClose}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Smith Name"
                        name="smith_name"
                        rules={[{ required: true, message: 'Please enter smith name' }]}
                    >
                        <Input
                            placeholder="Enter smith name"
                            maxLength={100}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Wages (₹)"
                        name="wages"
                        rules={[{ required: true, message: 'Please enter wages amount' }]}
                    >
                        <InputNumber
                            placeholder="Enter wages amount"
                            style={{ width: '100%' }}
                            min={0}
                            step={1}
                            precision={2}
                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Product Details"
                    >
                        <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <Text type="secondary">
                                Product ID: <Text strong>#{product?.id}</Text>
                            </Text>
                            <br />
                            <Text type="secondary">
                                Weight: <Text strong>{product?.weight || '0.000'}g</Text>
                            </Text>
                            <br />
                            <Text type="secondary">
                                Metal: <Text strong>{getMetalNameById(product?.metal)}</Text>
                            </Text>
                        </div>
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Button onClick={onClose} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Assign Smith
                        </Button>
                    </div>
                </Form>
            </Modal>
        );
    };
    // Updated meltProductColumns with automatic name resolution
    const meltProductColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (text) => <Tag color="blue">#AMAMELT{text}</Tag>
        },
        {
            title: 'Metal',
            dataIndex: 'metal',
            key: 'metal',
            width: 120,
            render: (text, record) => (

                <Text>{getMetalNameById(text)}</Text>

            )
        },
        {
            title: 'Product',
            dataIndex: 'product',
            key: 'product',
            width: 120,
            render: (text, record) => (

                <Text>{getProductNameById(text)}</Text>

            )
        },
        {
            title: 'Sub Product',
            dataIndex: 'sub_product',
            key: 'sub_product',
            width: 120,
            render: (text, record) => (

                <Text>{getSubProductNameById(text)}</Text>
            )
        },
        {
            title: 'Weight (g)',
            dataIndex: 'weight',
            key: 'weight',
            width: 120,
            render: (text) => <Text strong>{parseFloat(text).toFixed(3) || '0.000'}g</Text>
        },
        {
            title: 'Dust Weight (g)',
            dataIndex: 'dust_weight',
            key: 'dust_weight',
            width: 150,
            render: (text, record) => (
                record.status === 0 ? (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter dust weight"
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'dust_weight', value)}
                        min={0}
                        step={0.001}
                        precision={3}
                    />
                ) : (
                    <Text>{text || '0.000'}g</Text>
                )
            )
        },
        {
            title: 'Expected Purity (%)',
            key: 'expected_purity',
            width: 150,
            render: (_, record) => {
                const { expectedPurity } = calculateExpectedValues(record);
                return <Text>{expectedPurity.toFixed(2)}%</Text>;
            }
        },
        {
            title: 'Expected Weight (g)',
            key: 'expected_weight',
            width: 150,
            render: (_, record) => {
                const { expectedWeight } = calculateExpectedValues(record);
                return <Text>{expectedWeight.toFixed(3)}g</Text>;
            }
        },
        {
            title: 'Stone Weight (g)',
            dataIndex: 'stone_weight',
            key: 'stone_weight',
            width: 150,
            render: (text, record) => (
                record.status === 0 ? (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter Stone weight"
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'stone_weight', value)}
                        min={0}
                        step={0.001}
                        precision={3}
                    />
                ) : (
                    <Text>{text || '0.000'}g</Text>
                )
            )
        },
        {
            title: 'Melt Weight (g)',
            dataIndex: 'melt_weight',
            key: 'melt_weight',
            width: 150,
            render: (text, record) => (
                record.status === 0 ? (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter melt weight"
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'melt_weight', value)}
                        min={0}
                        step={0.001}
                        precision={3}
                    />
                ) : (
                    <Text>{text || '0.000'}g</Text>
                )
            )
        },
        {
            title: 'Wages (Rs.)',
            dataIndex: 'wages',
            key: 'wages',
            width: 150,
            render: (text, record) => (
                record.status === 0 ? (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter wages"
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'wages', value)}
                        min={0}
                        step={0.001}
                        precision={3}
                    />
                ) : (
                    <Text>Rs.{text || '0.000'}</Text>
                )
            )
        },
        {
            title: 'Purity (%)',
            dataIndex: 'purity',
            key: 'purity',
            width: 120,
            render: (text, record) => (
                record.status === 0 ? (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter purity"
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'purity', value)}
                        min={0}
                        max={100}
                        step={0.1}
                        precision={2}
                        formatter={value => `${value}%`}
                        parser={value => value.replace('%', '')}
                    />
                ) : (
                    <Text>{text || '0.00'}%</Text>
                )
            )
        },
        // Calculation Columns
        {
            title: 'Net Weight (g)',
            key: 'net_weight',
            width: 120,
            render: (_, record) => (
                <Text strong>{(calculations[record.id]?.netWeight || 0).toFixed(3)}g</Text>
            )
        },
        {
            title: 'Final Weight (g)',
            key: 'final_weight',
            width: 120,
            render: (_, record) => (
                <Text strong style={{ color: "#52c41a" }}>
                    {(calculations[record.id]?.finalWeight || 0).toFixed(3)}g
                </Text>
            )
        },
        {
            title: 'Melting Status',
            key: 'status',
            width: 100,
            render: (record) => (
                <Tag color={record.melt_details != null ? 'green' : 'orange'}>
                    {record.melt_details != null ? 'Completed' : 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Smith Name',
            key: 'status',
            width: 100,
            render: (record) => (
                <Tag >
                    {record.assign_smith_name}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleViewPurchaseDetails(record)}
                        icon={<InfoCircleOutlined />}
                    >
                        Details
                    </Button>
                    {/* <Button
                        type="primary"
                        size="small"
                        onClick={() => handleOpenAssignSmithModal(record)}
                        disabled={record.assign_smith_name != null}
                        style={{ background: "#1677ff", borderColor: "#1677ff" }}

                    >
                        Assign Smith
                    </Button> */}
                    <Button
                        type="primary"
                        size="small"

                        onClick={() => handleMeltProductModal(record)}
                        disabled={record.melt_details != null}
                        style={{
                            background: "#52c41a",
                            borderColor: "#52c41a"
                        }}
                    >
                        Received Melting Product
                    </Button>

                    {/* <Button
                        type="primary"
                        size="small"
                        disabled={record.melt_details == null}
                        style={{ background: "#1677ff", borderColor: "#1677ff" }}
                        onClick={() => handleOpenWageModal(record)} // Use record.id here
                    >
                        Update Wages
                    </Button> */}
                </Space>
            )
        }
    ];

    // Calculate totals for summary
    const getTotalWeight = () => {
        return meltProducts.reduce((total, product) => {
            return total + (parseFloat(product.weight) || 0);
        }, 0).toFixed(3);
    };

    const getTotalMeltWeight = () => {
        return meltProducts.reduce((total, product) => {
            return total + (parseFloat(product.melt_weight) || 0);
        }, 0).toFixed(3);
    };

    const getTotalDustWeight = () => {
        return meltProducts.reduce((total, product) => {
            return total + (parseFloat(product.dust_weight) || 0);
        }, 0).toFixed(3);
    };

    const getTotalNetWeight = () => {
        return Object.values(calculations).reduce((total, calc) => {
            return total + (calc.netWeight || 0);
        }, 0).toFixed(3);
    };

    const getTotalFinalWeight = () => {
        return Object.values(calculations).reduce((total, calc) => {
            return total + (calc.finalWeight || 0);
        }, 0).toFixed(3);
    };

    const getTotalAmount = () => {
        return Object.values(calculations).reduce((total, calc) => {
            return total + (calc.amount || 0);
        }, 0).toFixed(2);
    };

    // Enhanced table summary with all calculation totals
    const meltTableSummary = () => (
        <Table.Summary>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} colSpan={5}>
                    <Text strong>Total:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                    <Text strong>{getTotalWeight()}g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                    <Text strong>{getTotalMeltWeight()}g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                    <Text strong>{getTotalDustWeight()}g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                    {/* Purity column - no total */}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                    <Text strong>{getTotalNetWeight()}g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                    <Text strong>{(Object.values(calculations).reduce((total, calc) => total + (calc.marginWeight || 0), 0)).toFixed(3)}g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                    <Text strong style={{ color: "#52c41a" }}>{getTotalFinalWeight()}g</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                    {/* Rate column - no total */}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9}>
                    <Text strong style={{ color: "#faad14" }}>₹{getTotalAmount()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} colSpan={2}>
                    {/* Status and Actions columns */}
                </Table.Summary.Cell>
            </Table.Summary.Row>
        </Table.Summary>
    );

    const renderMeltingPopup = () => {
        const notMeltedPurchases = filteredPurchases.filter(p => p.melting_status === 0 && p.collect_accounts_status === 1);

        return (
            <Modal
                title="Mark Purchases as Melted"
                visible={isMeltingPopupVisible}
                onCancel={() => {
                    setIsMeltingPopupVisible(false);
                    setSelectedPurchases([]);
                }}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                <Card title="Select Purchases to Mark as Melted" style={{ marginBottom: 16 }}>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Space>
                                <Button onClick={selectAllPurchases}>
                                    Select All Available
                                </Button>
                                <Button onClick={clearAllSelections}>
                                    Clear All
                                </Button>
                                <Tag color="blue">
                                    Selected: {selectedPurchases.length} purchases
                                </Tag>
                            </Space>
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                            <Space direction="vertical" align="end">
                                <Text strong>
                                    Total Selected Weight: {getTotalSelectedWeight()}g
                                </Text>
                                <Text strong>
                                    Total Amount: ₹{getTotalSelectedAmount()}
                                </Text>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <Space>
                        <Button
                            onClick={() => {
                                setIsMeltingPopupVisible(false);
                                setSelectedPurchases([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSubmitAll}
                            disabled={selectedPurchases.length === 0}
                            loading={loading}
                            style={{
                                background: "#52c41a",
                                borderColor: "#52c41a"
                            }}
                        >
                            Submit All ({selectedPurchases.length} selected)
                        </Button>
                    </Space>
                </div>
            </Modal>
        );
    };

    return (
        <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
            {/* Header with Create Button */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} justify="center" align="middle">
                    <Text style={{ fontSize: 24 }}>Melting Receipt</Text>
                </Row>

                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search melt products..."
                            prefix={<SearchOutlined />}
                            value={purchaseFilters.search}
                            onChange={(e) => setPurchaseFilters({ ...purchaseFilters, search: e.target.value })}
                            allowClear
                            onPressEnter={handleSearch}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            placeholder="Filter by Metal"
                            value={purchaseFilters.metal}
                            onChange={(value) => setPurchaseFilters({ ...purchaseFilters, metal: value })}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {metalOptions.map(metal => (
                                <Option key={metal.id} value={metal.id}>{metal.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            placeholder="Status"
                            value={purchaseFilters.status}
                            onChange={(value) => setPurchaseFilters({ ...purchaseFilters, status: value })}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="1">Completed</Option>
                            <Option value="0">Pending</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Button
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            type="primary"
                            style={{ marginRight: 8 }}
                        >
                            Search
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleResetFilters}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>

                {/* PDF Export Section */}
                <Divider style={{ margin: '16px 0' }} />
                <Row gutter={16} align="middle">

                    <Col span={12}>
                        <Space>

                            <Button
                                icon={<DownloadOutlined />}
                                onClick={() => generatePDF()}
                                loading={pdfLoading}
                            >
                                Export All
                            </Button>
                            <Button
                                icon={<FilePdfOutlined />}
                                onClick={() => generatePDF(selectedForPdf)}
                                disabled={selectedForPdf.length === 0}
                                loading={pdfLoading}
                            >
                                Export Selected ({selectedForPdf.length})
                            </Button>
                            <Button
                                onClick={handleSelectAllForPDF}
                                size="small"
                            >
                                Select All
                            </Button>
                            <Button
                                onClick={handleClearSelectionForPDF}
                                size="small"
                                danger
                            >
                                Clear Selection
                            </Button>
                        </Space>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Text type="secondary">
                            Showing {meltProducts.length} of {meltPagination.total} records
                        </Text>
                        &nbsp;&nbsp;&nbsp;
                        {/* <Button

                            onClick={startMeltingProcess}
                            type="primary"
                            style={{
                                background: roots.gradient.gold,
                                border: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Mark As Melted
                        </Button> */}
                    </Col>
                </Row>
            </Card>

            {/* Main Melt Product Table */}
            <Card>
                <Table
                    columns={meltProductColumns}
                    dataSource={meltProducts}
                    pagination={{
                        current: meltPagination.current,
                        pageSize: meltPagination.pageSize,
                        total: meltPagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, pageSize) => {
                            setMeltPagination({
                                ...meltPagination,
                                current: page,
                                pageSize: pageSize
                            });
                            fetchMeltProducts(page, pageSize, purchaseFilters);
                        }
                    }}
                    scroll={{ x: 1500 }}
                    rowKey="id"
                    loading={isMeltTableLoading}
                    summary={meltTableSummary}
                    rowSelection={{
                        selectedRowKeys: selectedForPdf,
                        onChange: handleBulkSelectForPDF,
                        selections: [
                            Table.SELECTION_ALL,
                            Table.SELECTION_INVERT,
                            Table.SELECTION_NONE,
                        ],
                    }}
                />
            </Card>
            <PurchaseDetailsModal
                purchasesJson={selectedPurchasesJson}
                visible={purchaseDetailsVisible}
                onCancel={handleClosePurchaseDetails}
                record={selectedMeltRecord}
            />

            <MeltUpdateModal
                visible={isMeltModalVisible}
                onClose={() => setIsMeltModalVisible(false)}
                meltJson={selectedMeltData}
            />
            <AssignSmithPopup
                visible={isAssignSmithModalVisible}
                onClose={() => setIsAssignSmithModalVisible(false)}
                product={selectedProductForSmith}
                onAssign={handleAssignSmith}
            />


            <WagesUpdate
                visible={isWageModalOpen}
                onClose={() => setIsWageModalOpen(false)}
                wagesData={selectedWagesData}
            />

            {renderMeltingPopup()}
            {renderConfirmationPopup()}
        </div>
    );
};

export default MeltingReceipt;