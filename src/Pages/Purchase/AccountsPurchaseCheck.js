import React, { useState, useEffect, useRef } from 'react';
import {
    VideoCameraOutlined
} from '@ant-design/icons';
import {
    Form,
    Input,
    Button,
    Select,
    Table,
    Space,
    Popconfirm,
    message,
    Modal,
    Card,
    Row,
    Col,
    Typography,
    Tag,
    Upload,
    Avatar,
    Divider,
    Radio,
    InputNumber,
    Image,
    Statistic,
    Spin, Switch, Checkbox,
    Tabs,
    Alert
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    UploadOutlined,
    CameraOutlined,
    BankOutlined,
    MoneyCollectOutlined,
    DownloadOutlined,
    BarcodeOutlined,
    ShoppingOutlined,
    CloseOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import Webcam from "react-webcam";
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// API Services
import {
    createPurchase,
    getPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    verifyAadhar,
    sendAadharOtp,
    getQuatationCodeById,
    getAllPurchasesAccounts,
    updatePurchaseAccountsStatus
} from '../../api/services/purchaseService';

import { getCustomers, getCustomerById } from '../../api/services/customerServices';
import { getQuotations, getQuotationById } from '../../api/services/quatationService';
import { getPledgeQuotations, getPledgeQuotationById, getAllQuotationsForPurchase } from '../../api/services/pledgeQuotationService';
import { getProducts } from '../../api/services/productService';
import { getMetals } from '../../api/services/metalService';
import { getSubProducts } from '../../api/services/subProductServices';
import { getProductById } from '../../api/services/productService';
import { getSubProductById } from '../../api/services/subProductServices';
import { getMetalById } from '../../api/services/metalService';

import { uploadConfigUrl } from '../../api/apiUrl';
import { downloadPDF, generateDetailedPurchasePDF, generateRegionalPurchasePDF } from '../../utils/pdfGenerator';

import { DatePicker } from 'antd';
import { createMeltingPurchase } from '../../api/services/MeltingPurchaseService';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const referenceOptions = [
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'sales_executive', label: 'Sales Executive' },
    { value: 'manager', label: 'Manager' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'other', label: 'Other' }
];
const AccountsPurchaseCheck = () => {
    const [form] = Form.useForm();
    const [customerForm] = Form.useForm();
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [filteredQuotations, setFilteredQuotations] = useState([]);
    const [metals, setMetals] = useState([]);
    const [products, setAllProducts] = useState([]);
    const [subProducts, setAllSubProducts] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
    const [isQuotationModalVisible, setIsQuotationModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [aadharVerifying, setAadharVerifying] = useState(false);
    const [aadharVerificationError, setAadharVerificationError] = useState('');
    const [fileListBill, setFileListBill] = useState([]);
    const [fileListOrnament, setFileListOrnament] = useState([]);
    const [previewImage, setPreviewImage] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [currentSubProducts, setCurrentSubProducts] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showWebcam, setShowWebcam] = useState(false);
    const [capturedImage, setCapturedImage] = useState('');
    const [capturedImage1, setCapturedImage1] = useState('');
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pledgeStatus, setPledgeStatus] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [qrData, setQrData] = useState('');
    const [purchaseProducts, setPurchaseProducts] = useState([]);
    const [otherReference, setOtherReference] = useState(false);
    const [customerBankDetails, setCustomerBankDetails] = useState(null);
    const [bankDetailsAvailable, setBankDetailsAvailable] = useState(false);
    const [paymentValidationError, setPaymentValidationError] = useState('');
    const [receiptId, setReceiptId] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [dateRange, setDateRange] = useState([]);

    const navigate = useNavigate();
    const [details, setDetails] = useState({
        metalName: 'Loading...',
        productName: 'Loading...',
        subProductName: 'Loading...'
    });
    const naviagation = useNavigate();
    const [scannedData, setScannedData] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [lastKeyTime, setLastKeyTime] = useState(Date.now());
    const [isScanning, setIsScanning] = useState(false);

    const handleSubmit = async () => {
        if (purchases.length === 0) {
            await Swal.fire({
                title: 'No Selection',
                text: 'Please select at least one purchase to submit',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
        await Swal.fire({
            title: 'Collected',
            text: 'Your purchase collected from regional ',
            icon: 'success',
            confirmButtonText: 'OK'
        });

    };


    const handleExportPDF = async () => {
        try {
            setExportLoading(true);

            // Prepare filters for export
            const exportFilters = {
                search: purchaseFilters.search,
                metal: purchaseFilters.metal,
                status: purchaseFilters.status,
                startDate: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '',
                endDate: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : ''
            };

            // Show loading message
            message.loading({ content: 'Preparing PDF export...', key: 'pdf-export', duration: 0 });

            // Use existing data or fetch all data for export
            let exportData = filteredPurchases;

            // If we have date filters, we might need to fetch all matching data
            if (dateRange.length > 0) {
                // You might want to implement a separate API call here to get all data matching the filters
                // For now, we'll use the current filtered data
                exportData = filteredPurchases;
            }

            if (exportData.length === 0) {
                message.destroy('pdf-export');
                message.warning('No data found for the selected filters');
                return;
            }

            // Generate PDF
            const pdfDoc = generateRegionalPurchasePDF("REGIONAL PURCHASE COLLECTED REPORT", exportData, exportFilters, metals);

            // Create filename with date range
            const dateSuffix = exportFilters.startDate && exportFilters.endDate
                ? `${exportFilters.startDate}-to-${exportFilters.endDate}`
                : 'all-dates';

            const filename = `regional-purchases-${dateSuffix}.pdf`;

            // Download PDF
            downloadPDF(pdfDoc, filename);

            message.destroy('pdf-export');
            message.success('PDF exported successfully!');

        } catch (error) {
            console.error('Error exporting PDF:', error);
            message.destroy('pdf-export');
            message.error('Failed to export PDF');
        } finally {
            setExportLoading(false);
        }
    };
    const handleExportReceipt = async (purchase) => {
        try {
            setExportLoading(true);

            // Fetch customer details if not already available
            let customer = customers.find(c => c.id === purchase.customer_id);
            if (!customer && purchase.customer_id) {
                // You might need to fetch customer details here
                console.log('Customer details not available');
            }

            const pdfDoc = generateDetailedPurchasePDF(purchase, customer);
            const filename = `purchase-receipt-${purchase.purchase_id}.pdf`;

            downloadPDF(pdfDoc, filename);
            message.success('Receipt exported successfully!');

        } catch (error) {
            console.error('Error exporting receipt:', error);
            message.error('Failed to export receipt');
        } finally {
            setExportLoading(false);
        }
    };

    // Add this useEffect for barcode scanner detection
    useEffect(() => {
        const handleKeyPress = (e) => {
            const currentTime = Date.now();

            // Reset if time gap is too long (scanners are fast, humans are slow)
            if (currentTime - lastKeyTime > 100) {
                setBarcodeInput("");
            }

            if (e.key === "Enter") {
                // Complete barcode scanned
                handleQRScan(barcodeInput);
                // alert(barcodeInput)
                // console.log(barcodeInput)
                setBarcodeInput(barcodeInput);
            } else {
                // Accumulate the scanned characters
                setBarcodeInput((prev) => prev + e.key);
            }

            setLastKeyTime(currentTime);
        };

        window.addEventListener("keypress", handleKeyPress);
        return () => window.removeEventListener("keypress", handleKeyPress);
    }, [lastKeyTime, barcodeInput]);

    // Add this function to handle QR code scanning
    // Replace your current handleQRScan function with this:
    const handleQRScan = (data) => {
        console.log("QR Scanned Data:", data);

        if (!data || data.trim() === '') {
            Swal.fire({
                icon: 'error',
                title: 'Scan Failed',
                text: 'No data found in QR code',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        let purchaseId = null;

        try {
            // Try to parse as JSON first
            const purchaseData = JSON.parse(data);
            purchaseId = purchaseData.id || purchaseData.purchase_id || purchaseData.quotation_id;
            console.log("Parsed JSON - Purchase ID:", purchaseId);
        } catch (error) {
            // If not JSON, treat as direct ID
            console.log("Not JSON, treating as direct ID");
            purchaseId = data.trim();
        }

        if (!purchaseId) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid QR Code',
                text: 'No valid purchase ID found in QR code',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        console.log("Looking for purchase with ID:", purchaseId);
        console.log("Available purchases:", purchases.map(p => ({
            id: p.id,
            purchase_id: p.purchase_id,
            quotation_id: p.quotation_id
        })));

        // Find the purchase using multiple possible ID fields
        const purchase = purchases.find(p =>
            p.id === purchaseId ||
            p.purchase_id === purchaseId ||
            p.quotation_id === purchaseId ||
            p.id?.toString() === purchaseId.toString() ||
            p.purchase_id?.toString() === purchaseId.toString() ||
            p.quotation_id?.toString() === purchaseId.toString()
        );

        if (purchase) {
            console.log("Found purchase:", purchase);
            updateRegionalStatus(purchase, 1);
        } else {
            console.log("Purchase not found. Searched ID:", purchaseId);
            Swal.fire({
                icon: 'error',
                title: 'Purchase Not Found',
                text: `Purchase ${purchaseId} not found in current list`,
                timer: 2000,
                showConfirmButton: false
            });
        }
    };
    // Custom SweetAlert configuration
    const showAutoCloseAlert = (icon, title, text) => {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            position: 'top-end',
            toast: true,
            background: '#f8f9fa',
            customClass: {
                popup: 'sweetalert-popup'
            }
        });
    };

    // Then use it like this in your functions:
    // showAutoCloseAlert('success', 'Success', 'Operation completed successfully');
    // Update the updateRegionalStatus function
    const updateRegionalStatus = async (purchase, status) => {
        console.log("Updating regional status for:", purchase);

        try {
            // Update in your local state first for immediate UI update
            setPurchases(prevPurchases =>
                prevPurchases.map(p =>
                    p.id === purchase.id ? { ...p, collected_status: status } : p
                )
            );

            // Update on the server
            const response = await updatePurchaseAccountsStatus(purchase.id, {
                collected_status: status
            });

            if (response) {
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Purchase ${purchase.purchase_id || purchase.quotation_id} collected from regional`,
                    timer: 2000,
                    showConfirmButton: false
                });
                console.log(`Updated ID ${purchase.purchase_id || purchase.quotation_id} →`, status);

            } else {
                throw new Error(response.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating regional status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update status',
                timer: 2000,
                showConfirmButton: false
            });

            // Revert UI change if server update failed
            setPurchases(prevPurchases =>
                prevPurchases.map(p =>
                    p.id === purchase.id ? { ...p, collected_status: purchase.collected_status } : p
                )
            );
        }
    };

    // Update the regionalStatusSwitch component to use the update function
    // Update the regionalStatusSwitch component
    const regionalStatusSwitch = (record) => (

        <Spin spinning={loading}>
            <Checkbox
                checked={record.collected_status === "1"}
                onChange={(e) => {
                    const newStatus = e.target.checked ? "1" : "0";
                    updateRegionalStatus(record, newStatus);
                }}
            >
                Sent
            </Checkbox>
        </Spin>
    );




    const [partialPayment, setPartialPayment] = useState({
        cashAmount: 0,
        bankAmount: 0,
        bankDetails: ''
    });

    const [weightErrors, setWeightErrors] = useState({});
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
    const webcamRef = useRef(null);

    const [filters, setFilters] = useState({
        search: '',
        state: ''
    });

    const [quotationFilters, setQuotationFilters] = useState({
        search: '',
        status: 'active'
    });

    const [purchaseFilters, setPurchaseFilters] = useState({
        search: '',
        metal: '',
        dateRange: []
    });
    useEffect(() => {
        console.log("Purchases updated:", purchases.map(p => ({
            id: p.id,
            purchase_id: p.purchase_id,
            quotation_id: p.quotation_id,
            collected_status: p.collected_status
        })));
    }, [purchases]);
    // Load initial data
    useEffect(() => {
        fetchInitialData();
        fetchProductData();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            checkCustomerBankDetails();
        }
    }, [selectedCustomer]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);

            // Fetch customers
            // const customersResponse = await getCustomers();
            // setCustomers(customersResponse.customers || []);
            // setFilteredCustomers(customersResponse.customers || []);

            // Fetch quotations
            // const quotationsResponse = await getAllQuotationsForPurchase();

            // setQuotations(quotationsResponse.quotations || []);
            // setFilteredQuotations(quotationsResponse.quotations || []);

            // Fetch purchases
            const purchasesResponse = await getAllPurchasesAccounts()
            setPurchases(purchasesResponse.purchases || []);
            setFilteredPurchases(purchasesResponse.purchases || []);

        } catch (error) {
            message.error('Failed to load initial data');
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductData = async () => {
        try {
            setLoading(true);

            // Fetch metals
            const metalsResponse = await getMetals();
            setMetals(metalsResponse.metals || []);

            // Fetch products
            const productsResponse = await getProducts(1,1000);
            setAllProducts(productsResponse.products || []);

            // Fetch subproducts
            const subProductsResponse = await getSubProducts();
            setAllSubProducts(subProductsResponse.subProducts || []);

        } catch (error) {
            message.error('Failed to load product data');
            console.error('Error loading product data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkCustomerBankDetails = async () => {
        try {
            const response = await getCustomerById(selectedCustomer.id);
            const customer = response.customer;

            if (customer.bank_account_number && customer.bank_name) {
                setCustomerBankDetails({
                    bankName: customer.bank_name,
                    accountNumber: customer.bank_account_number,
                    ifscCode: customer.bank_ifsc_code
                });
                setBankDetailsAvailable(true);
            } else {
                setBankDetailsAvailable(false);
            }
        } catch (error) {
            console.error('Error fetching customer bank details:', error);
            setBankDetailsAvailable(false);
        }
    };



    const ProductDetailsCell = ({ product }) => {
        const [subProductName, setSubProductName] = useState('Loading...');
        const [metalName, setMetalName] = useState('Loading...');
        const [productName, setProductName] = useState('Loading...');
        const [modalVisible, setModalVisible] = useState(false);
        const [productDetails, setProductDetails] = useState(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const fetchProductDetails = async () => {
                try {
                    if (product?.sub_product) {
                        setSubProductName(product.sub_product || 'N/A');

                        // Fetch metal and product names only when needed (when modal opens)
                        // We'll fetch them when the modal is about to open
                    } else {
                        setSubProductName('N/A');
                    }
                } catch (error) {
                    console.error('Error setting sub-product details:', error);
                    setSubProductName('Error');
                }
            };

            fetchProductDetails();
        }, [product]);

        const fetchAdditionalDetails = async () => {
            try {
                setLoading(true);

                let metalName = 'N/A';
                let productName = 'N/A';

                // Fetch metal name
                if (product?.metal) {
                    const metalRes = await getMetalById(product.metal);
                    // setMetalName(metalRes?.metalname || 'N/A');
                    metalName = metalRes?.metalname || 'N/A';
                }

                // Fetch product name
                if (product?.product) {
                    const productRes = await getProductById(product.product);
                    // setProductName(productRes?.product_name || 'N/A');
                    productName = productRes?.product_name || 'N/A';
                }

                return { metalName, productName }

            } catch (error) {
                console.error('Error fetching additional details:', error);
                // setMetalName('Error');
                // setProductName('Error');
                return { metal: "Error", productNm: "Error" };
            } finally {
                setLoading(false);
            }
        };

        const handleCellClick = async () => {
            if (product) {
                // Fetch additional details when user clicks to open modal
                const { metalName, productName } = await fetchAdditionalDetails();

                setProductDetails({
                    ...product,
                    subProductName: subProductName,
                    metalName: metalName,
                    productName: productName
                });
                setModalVisible(true);
            }
        };

        const renderProductDetailsModal = () => {
            if (!productDetails) return null;

            const tableData = [
                { field: 'Metal', value: productDetails.metalName },
                { field: 'Product', value: productDetails.productName },
                { field: 'Sub Product', value: productDetails.subProductName },
                { field: 'Purity (%)', value: productDetails.purity || 'N/A' },
                { field: 'Gross Weight (g)', value: productDetails.gross_weight || '0.000' },
                { field: 'Dust Weight (g)', value: productDetails.dust_weight || '0.000' },
                { field: 'Stone Weight (g)', value: productDetails.stone_weight || '0.000' },
                { field: 'Net Weight (g)', value: productDetails.net_weight || '0.000' },
                { field: 'MCX Rate (₹/g)', value: `₹${productDetails.mcx_rate || '0.00'}` },
                { field: 'Margin %', value: `${productDetails.margin_percent || '0.00'}%` },

                { field: 'Final Weight (g)', value: productDetails.final_weight || '0.000' },
                { field: 'Rate (₹/g)', value: `₹${productDetails.rate || '0.00'}` },
                { field: 'Amount (₹)', value: `₹${productDetails.amount || '0.00'}` }
            ];

            return (
                <Modal
                    title="Product Details"
                    visible={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setModalVisible(false)}>
                            Close
                        </Button>
                    ]}
                    width={700}
                >
                    <Spin spinning={loading}>
                        <Table
                            dataSource={tableData}
                            pagination={false}
                            scroll={{ x: 600 }}
                            size="small"
                            columns={[
                                {
                                    title: 'Field',
                                    dataIndex: 'field',
                                    key: 'field',
                                    width: 180,
                                    render: (text) => (
                                        <Text strong>{text}</Text>
                                    )
                                },
                                {
                                    title: 'Value',
                                    dataIndex: 'value',
                                    key: 'value',
                                    render: (text) => text
                                }
                            ]}
                        />
                    </Spin>
                </Modal>
            );
        };

        return (
            <>
                <div
                    onClick={handleCellClick}
                    style={{
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <div>
                        <Text strong>{subProductName}</Text>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Click to view full details
                    </div>
                </div>
                {renderProductDetailsModal()}
            </>
        );
    };
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState('');
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recording, setRecording] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    // Add this useEffect to automatically start camera when modal opens
    useEffect(() => {
        if (isModalVisible) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [isModalVisible]);

    // Function to start camera
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Auto-start recording when camera starts
            startRecording(mediaStream);

        } catch (error) {
            console.error('Error accessing camera:', error);
            message.error('Cannot access camera. Please check permissions.');
        }
    };
    const stopCamera = () => {
        return new Promise((resolve) => {
            if (mediaRecorder && recording) {
                // Store the recorded chunks
                const recordedChunks = [];

                // Set up the data available handler
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };

                // Set up the stop handler
                mediaRecorder.onstop = () => {
                    // Create a blob from the recorded chunks
                    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
                    const videoURL = URL.createObjectURL(blob);
                    setRecordedVideo(videoURL);

                    // Auto-download the video
                    const downloadLink = document.createElement('a');
                    downloadLink.href = videoURL;
                    downloadLink.download = `ornament-video-${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    // Clean up
                    setTimeout(() => URL.revokeObjectURL(videoURL), 100);

                    setRecording(false);
                    message.success('Video downloaded successfully!');
                    resolve();
                };

                // Stop the recording
                mediaRecorder.stop();
            } else {
                resolve();
            }

            // Clean up the stream
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                setStream(null);
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        });
    };

    const startRecording = (mediaStream) => {
        const recorder = new MediaRecorder(mediaStream);
        const chunks = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const videoURL = URL.createObjectURL(blob);
            setRecordedVideo(videoURL);

            // Convert video blob to file for upload
            const videoFile = new File([blob], 'ornament-video.mp4', { type: 'video/mp4' });

            setFileListOrnament([{
                uid: '-3',
                name: 'ornament-video.mp4',
                status: 'done',
                url: videoURL,
                originFileObj: videoFile,
                type: 'video'
            }]);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
        setShowVideoRecorder(true);
    };


    const captureImageWhileRecording = () => {
        if (videoRef.current && stream) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataURL = canvas.toDataURL('image/jpeg');
            setCapturedImage1(imageDataURL);
            fetch(imageDataURL)
                .then(res => res.blob())
                .then(blob => {
                    const imageFile = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
                    setFileListOrnament(prev => {
                        const filteredList = prev.filter(file => !file.uid.includes('capture-'));
                        return [...filteredList, {
                            uid: `capture-${Date.now()}`,
                            name: 'captured-image.jpg',
                            status: 'done',
                            url: imageDataURL,
                            originFileObj: imageFile,
                            type: 'image'
                        }];
                    });
                });

            message.success('Image captured successfully!');
        }
    };

    // Function to stop recording
    const stopRecording = () => {
        if (mediaRecorder && recording) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };

    // Update your handleCancel function to stop camera
    const handleCancel1 = () => {
        setIsModalVisible(false);
        form.resetFields();
        setFileListBill([]);
        setFileListOrnament([]);
        setShowWebcam(false);
        setPurchaseProducts([]);
        setOtpSent(false);
        setOtpVerified(false);
        setSelectedCustomer(null);
        setSelectedQuotation(null);
        setPaymentMethod('');
        setPaymentValidationError('');
        setCapturedImage(null); // Reset the captured image
        stopCamera(); // Stop camera when modal closes
    };

    // Update your uploadProps function to handle both images and videos
    const uploadProps1 = (fileList, setFileList) => ({
        onRemove: (file) => handleRemove(file, fileList, setFileList),
        beforeUpload: (file) => {
            if (file.type.includes('video')) {
                const videoFile = {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    url: URL.createObjectURL(file),
                    originFileObj: file,
                    type: 'video'
                };
                setFileList([videoFile]);
                return false;
            }
            return handleUpload(file, fileList, setFileList);
        },
        fileList,
        listType: "picture-card",
        onPreview: (file) => {
            if (file.type === 'video') {
                setPreviewImage(file.url);
                setPreviewVisible(true);
            } else {
                handlePreview(file);
            }
        },
        accept: "image/*,video/*",
        maxCount: 5 // Allow multiple files
    });





    // Apply filters
    useEffect(() => {
        applyCustomerFilters();
    }, [filters, customers]);

    useEffect(() => {
        applyQuotationFilters();
    }, [quotationFilters, quotations]);

    useEffect(() => {
        applyPurchaseFilters();
    }, [purchaseFilters, purchases]);

    const applyCustomerFilters = () => {
        let filtered = [...customers];

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.customer_name?.toLowerCase().includes(searchTerm) ||
                item.customer_id?.toLowerCase().includes(searchTerm) ||
                item.aadhar_no?.includes(searchTerm) ||
                item.pan_no?.includes(searchTerm)
            );
        }

        if (filters.state) {
            filtered = filtered.filter(item =>
                item.state?.toLowerCase() === filters.state.toLowerCase()
            );
        }

        setFilteredCustomers(filtered);
    };

    const applyQuotationFilters = () => {
        let filtered = [...quotations];

        if (quotationFilters.search) {
            const searchTerm = quotationFilters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.customer_name?.toLowerCase().includes(searchTerm) ||
                item.customer_id?.toLowerCase().includes(searchTerm) ||
                item.quotation_id?.toLowerCase().includes(searchTerm)
            );
        }

        if (quotationFilters.status) {
            filtered = filtered.filter(item =>
                item.status?.toLowerCase() === quotationFilters.status.toLowerCase()
            );
        }

        setFilteredQuotations(filtered);
    };

    const applyPurchaseFilters = () => {
        let filtered = [...purchases];

        if (purchaseFilters.search) {
            const searchTerm = purchaseFilters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.customer_name?.toLowerCase().includes(searchTerm) ||
                item.customer_id?.toLowerCase().includes(searchTerm) ||
                item.purchase_id?.toLowerCase().includes(searchTerm)
            );
        }

        if (purchaseFilters.metal) {
            filtered = filtered.filter(item =>
                item.metal?.toLowerCase() === purchaseFilters.metal.toLowerCase()
            );
        }

        if (purchaseFilters.dateRange && purchaseFilters.dateRange.length === 2) {
            filtered = filtered.filter(item => {
                const purchaseDate = new Date(item.date);
                return purchaseDate >= purchaseFilters.dateRange[0] &&
                    purchaseDate <= purchaseFilters.dateRange[1];
            });
        }

        setFilteredPurchases(filtered);
    };

    const validateWeights = (product) => {
        const errors = {};
        const gross = parseFloat(product.gross_weight) || 0;
        const dust = parseFloat(product.dust_weight) || 0;
        const stone = parseFloat(product.stone_weight) || 0;

        if (dust + stone > gross) {
            errors.weight = 'Dust + Stone weight cannot exceed Gross weight';
        }

        return errors;
    };

    const addProduct = () => {
        const newProduct = {
            key: uuidv4(),
            metal: metals.length > 0 ? metals[0].id : '',
            product: products.length > 0 ? products[0].id : '',
            sub_product: '',
            gross_weight: 0,
            dust_weight: 0,
            stone_weight: 0,
            net_weight: 0,
            mcx_rate: 0,
            margin_percent: getDefaultMargin(),
            margin_weight: 0,
            final_weight: 0,
            rate: 0,
            amount: 0
        };
        setPurchaseProducts([...purchaseProducts, newProduct]);

        if (products.length > 0) {
            const filteredSubProducts = subProducts.filter(sp =>
                sp.product_id === products[0].id
            );
            setCurrentSubProducts(filteredSubProducts);
        }
    };

    const removeProduct = (key) => {
        setPurchaseProducts(purchaseProducts.filter(product => product.key !== key));
    };

    const updateProduct = (key, field, value) => {
        setPurchaseProducts(purchaseProducts.map(product => {
            if (product.key === key) {
                const updatedProduct = { ...product, [field]: value };

                if (['gross_weight', 'dust_weight', 'stone_weight'].includes(field)) {
                    const errors = validateWeights(updatedProduct);
                    setWeightErrors(prev => ({
                        ...prev,
                        [key]: errors
                    }));

                    if (errors.weight) {
                        return product;
                    }
                }

                if (field === 'product') {
                    updatedProduct.sub_product = '';
                    const selectedProd = products.find(p => p.id === value);
                    if (selectedProd) {
                        const filteredSubProducts = subProducts.filter(sp =>
                            sp.product_id === selectedProd.id
                        );
                        setCurrentSubProducts(filteredSubProducts);
                    }
                }

                if (['gross_weight', 'dust_weight', 'stone_weight', 'mcx_rate', 'margin_percent'].includes(field)) {
                    return calculateProductValues(updatedProduct);
                }

                return updatedProduct;
            }
            return product;
        }));
    };

    const validatePayment = () => {
        const totalAmount = purchaseProducts.reduce((sum, product) =>
            sum + parseFloat(product.amount || 0), 0);

        if (paymentMethod.includes('partial')) {
            const cash = parseFloat(partialPayment.cashAmount) || 0;
            const bank = parseFloat(partialPayment.bankAmount) || 0;
            const partialTotal = cash + bank;

            if (Math.abs(partialTotal - totalAmount) > 0.01) {
                setPaymentValidationError('Partial payment amounts must exactly equal the total amount');
                return false;
            }

            if (paymentMethod === 'partial_bank' && !partialPayment.bankDetails) {
                setPaymentValidationError('Please provide bank transfer details');
                return false;
            }
        }

        if (paymentMethod === 'bank_transfer' && !bankDetailsAvailable) {
            setPaymentValidationError('Customer does not have bank details. Please add bank details or choose another payment method.');
            return false;
        }

        const hasWeightErrors = Object.values(weightErrors).some(err => err && err.weight);
        if (hasWeightErrors) {
            setPaymentValidationError('Please correct weight errors before proceeding');
            return false;
        }

        setPaymentValidationError('');
        return true;
    };

    const calculateProductValues = (product) => {
        const grossWeight = parseFloat(product.gross_weight) || 0;
        const dustWeight = parseFloat(product.dust_weight) || 0;
        const stoneWeight = parseFloat(product.stone_weight) || 0;
        const marginPercent = parseFloat(product.margin_percent) || 0;
        const mcxRate = parseFloat(product.mcx_rate) || 0;

        const netWeight = grossWeight - dustWeight - stoneWeight;
        const marginWeight = (netWeight * marginPercent) / 100;
        const finalWeight = netWeight - marginWeight;
        const rate = mcxRate;
        const amount = finalWeight * rate;

        return {
            ...product,
            net_weight: netWeight.toFixed(3),
            margin_weight: marginWeight.toFixed(3),
            final_weight: finalWeight.toFixed(3),
            rate: rate.toFixed(2),
            amount: amount.toFixed(2)
        };
    };

    const getDefaultMargin = () => {
        switch (userRole) {
            case 'superadmin': return 0.5;
            case 'manager': return 2;
            case 'sales_executive': return 3;
            default: return 3;
        }
    };

    const getMarginRange = () => {
        switch (userRole) {
            case 'superadmin': return { min: 0.5, max: 3 };
            case 'manager': return { min: 2, max: 3 };
            case 'sales_executive': return { min: 3, max: 3 };
            default: return { min: 3, max: 3 };
        }
    };

    const handleCustomerSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
    };

    const handleStateFilter = (value) => {
        setFilters(prev => ({ ...prev, state: value }));
    };

    const handleQuotationSearch = (value) => {
        setQuotationFilters(prev => ({ ...prev, search: value }));
    };

    // const handleQuotationStatusFilter = (value) => {
    //   setQuotationFilters(prev => ({ ...prev, status: value }));
    // };

    const resetCustomerFilters = () => {
        setFilters({ search: '', state: '' });
    };

    const resetQuotationFilters = () => {
        setQuotationFilters({ search: '', status: '' });
    };

    const resetPurchaseFilters = () => {
        setPurchaseFilters({
            search: '',
            metal: '',
            dateRange: []
        });
    };

    const showCustomerModal = () => {
        setIsCustomerModalVisible(true);
    };

    const showQuotationModal = () => {
        setIsQuotationModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setFileListBill([]);
        setFileListOrnament([]);
        setShowWebcam(false);
        setPurchaseProducts([]);
        setOtpSent(false);
        setOtpVerified(false);
        setSelectedCustomer(null);
        setSelectedQuotation(null);
        setPaymentMethod('');
        setPaymentValidationError('');
        setCapturedImage(null);

        // Proper cleanup for camera and recording
        stopCamera();
        setShowVideoRecorder(false);
        setRecordedVideo('');
        setMediaRecorder(null);
        setRecording(false);

        // Revoke object URLs to prevent downloads
        if (recordedVideo) {
            URL.revokeObjectURL(recordedVideo);
        }

        // Clean up any captured image URLs
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage);
        }

        // Clean up file list URLs
        fileListOrnament.forEach(file => {
            if (file.url && file.url.startsWith('blob:')) {
                URL.revokeObjectURL(file.url);
            }
        });

        fileListBill.forEach(file => {
            if (file.url && file.url.startsWith('blob:')) {
                URL.revokeObjectURL(file.url);
            }
        });
    };

    const handleCustomerCancel = () => {
        setIsCustomerModalVisible(false);
    };

    const handleQuotationCancel = () => {
        setIsQuotationModalVisible(false);
    };

    const selectCustomer = (record) => {
        setSelectedCustomer(record);
        setIsCustomerModalVisible(false);
        setIsModalVisible(true);
        form.resetFields();
        form.setFieldsValue({
            customer_id: record.customer_id,
            customer_name: record.customer_name,
            aadhar_no: record.aadhar_no,
            pan_no: record.pan_no
        });
        setPurchaseProducts([]);
    };

    const selectQuotation = async (record) => {
        try {
            setLoading(true);
            console.log(record)
            let response;
            if (record.pledge_id == null) {
                setPledgeStatus(false)
                response = await getQuotationById(record.id);
            } else {
                setPledgeStatus(true)
                response = await getPledgeQuotationById(record.id);
            }

            const quotation = response;

            setSelectedQuotation(quotation);
            setIsQuotationModalVisible(false);
            setIsModalVisible(true);

            const customer = customers.find(c => c.customer_id === quotation.customer_id);
            if (customer) {
                setSelectedCustomer(customer);
            }

            let productsData = [];
            try {
                productsData = typeof quotation.products === 'string' ?
                    JSON.parse(quotation.products) :
                    quotation.products;
            } catch (error) {
                console.error('Error parsing products:', error);
                productsData = [];
            }

            form.resetFields();
            form.setFieldsValue({
                customer_id: quotation.customer_id,
                customer_name: quotation.customer_name,
                aadhar_no: quotation.aadhar_no || customer?.aadhar_no || '',
                pan_no: quotation.pan_no || customer?.pan_no || '',
                reference: quotation.reference || 'advertisement',
                other_reference: quotation.other_reference || '',
                reference_person: quotation.reference_person || null,
                remarks: quotation.remarks || ''
            });

            setOtherReference(quotation.reference === 'other');

            const newProducts = productsData.map(product => {
                const defaultMargin = getDefaultMargin();
                const netWeight = (product.gross_weight || 0) - (product.dust_weight || 0) - (product.stone_weight || 0);
                const marginWeight = (netWeight * (product.margin_percent || defaultMargin)) / 100;
                const finalWeight = netWeight - marginWeight;
                const amount = finalWeight * (product.mcx_rate || product.rate || 0);

                return {
                    key: uuidv4(),
                    metal: product.metal,
                    product: product.product,
                    sub_product: product.sub_product,
                    gross_weight: product.gross_weight || 0,
                    dust_weight: product.dust_weight || 0,
                    stone_weight: product.stone_weight || 0,
                    net_weight: netWeight,
                    mcx_rate: product.mcx_rate || product.rate || 0,
                    margin_percent: product.margin_percent || defaultMargin,
                    margin_weight: marginWeight,
                    final_weight: finalWeight,
                    rate: product.rate || product.mcx_rate || 0,
                    amount: amount
                };
            });

            if (newProducts.length === 0) {
                const defaultProduct = {
                    key: uuidv4(),
                    metal: quotation.metal,
                    product: quotation.product,
                    sub_product: quotation.sub_product,
                    gross_weight: quotation.gross_weight || 0,
                    dust_weight: 0,
                    stone_weight: 0,
                    net_weight: quotation.net_weight || 0,
                    mcx_rate: quotation.rate || 0,
                    margin_percent: getDefaultMargin(),
                    margin_weight: 0,
                    final_weight: quotation.net_weight || 0,
                    rate: quotation.rate || 0,
                    amount: quotation.total_amount || 0
                };
                newProducts.push(calculateProductValues(defaultProduct));
            }

            setPurchaseProducts(newProducts);

            if (quotation.bill_copy) {
                setFileListBill([{
                    uid: '-1',
                    name: 'bill.jpg',
                    status: 'done',
                    url: quotation.bill_copy
                }]);
            } else {
                setFileListBill([]);
            }

            if (quotation.ornament_photo) {
                setFileListOrnament([{
                    uid: '-2',
                    name: 'ornament.jpg',
                    status: 'done',
                    url: quotation.ornament_photo
                }]);
            } else {
                setFileListOrnament([]);
            }

            if (quotation.margin_approval_requested) {
                message.info(`This quotation has a margin approval status: ${quotation.margin_approval_status}`);
            }
        } catch (error) {
            message.error('Failed to load quotation details');
            console.error('Error loading quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedCustomer(null);
        setSelectedQuotation(null);
        setIsModalVisible(false);
        setPurchaseProducts([]);
    };

    const handleAadharOtp = async () => {
        const aadharNo = form.getFieldValue('aadhar_no');
        if (!aadharNo || aadharNo.length !== 12) {
            message.error('Please enter a valid 12-digit Aadhar number');
            return;
        }

        try {
            setAadharVerifying(true);
            const response = await sendAadharOtp({ aadhar_no: aadharNo });
            setOtpSent(true);
            message.success(`OTP sent to registered mobile (Demo OTP: ${response.data.otp})`);
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setAadharVerifying(false);
        }
    };

    const verifyAadharOtp = async () => {
        const enteredOtp = form.getFieldValue('aadhar_otp');
        const aadharNo = form.getFieldValue('aadhar_no');

        if (!enteredOtp || enteredOtp.length !== 6) {
            message.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            const response = await verifyAadhar({
                aadhar_no: aadharNo,
                otp: enteredOtp
            });

            if (response.success) {
                setOtpVerified(true);
                message.success('Aadhar verification successful!');
                setAadharVerificationError('');
            } else {
                setOtpVerified(false);
                setAadharVerificationError(response.message || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            setOtpVerified(false);
            setAadharVerificationError(error.response?.data?.message || 'Verification failed. Please try again.');
        }
    };

    const handleUpload = (file, fileList, setFileList) => {
        const newFile = {
            uid: file.uid,
            name: file.name,
            status: 'done',
            url: URL.createObjectURL(file),
            originFileObj: file
        };
        setFileList([newFile]);
        return false;
    };

    const handleRemove = (file, fileList, setFileList) => {
        const newFileList = fileList.filter(f => f.uid !== file.uid);
        setFileList(newFileList);
    };

    const handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewVisible(true);
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleProductChange = (value, productKey) => {
        const selectedProd = products.find(p => p.id === value);

        if (productKey) {
            updateProduct(productKey, 'product', value);
            updateProduct(productKey, 'sub_product', '');

            if (selectedProd) {
                const filteredSubProducts = subProducts.filter(sp =>
                    sp.product_id === selectedProd.id
                );
                setCurrentSubProducts(filteredSubProducts);
            }
        } else {
            setSelectedProduct(value);
            if (selectedProd) {
                const filteredSubProducts = subProducts.filter(sp =>
                    sp.product_id === selectedProd.id
                );
                setCurrentSubProducts(filteredSubProducts);
            }
        }
    };

    const captureImage = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        // setCapturedImage(imageSrc);
        setFileListOrnament([{
            uid: '-1',
            name: 'ornament.jpg',
            status: 'done',
            url: imageSrc
        }]);
        setShowWebcam(false);
    };

    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
        setPaymentValidationError('');
    };

    const handlePartialPaymentChange = (field, value) => {
        setPartialPayment(prev => ({
            ...prev,
            [field]: value
        }));
        setPaymentValidationError('');
    };

    const handleFinalSubmit = async () => {
        if (!validatePayment()) {
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            const values = form.getFieldsValue();

            // Prepare purchase data with customer_id and quotation_id
            const purchaseData = {
                ...values,
                customer_id: selectedCustomer?.id || null, // Ensure customer_id is included
                quotation_id: selectedQuotation?.quotation_id || null, // Include quotation_id if available
                products: purchaseProducts,
                payment_method: paymentMethod,
                pledge_status: pledgeStatus,
                payment_details: paymentMethod.includes('partial') ? partialPayment : 'Full',
                reference: otherReference ? values.other_reference : values.reference,
                total_amount: purchaseProducts.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0).toFixed(2)
            };

            // Append the purchase data to formData
            formData.append('data', JSON.stringify(purchaseData));

            // Append bill copy if available
            if (fileListBill[0]?.originFileObj) {
                formData.append('bill_copy', fileListBill[0].originFileObj);
            }

            // Append ornament photo if available
            if (fileListOrnament[0]?.originFileObj) {
                formData.append('ornament_photo', fileListOrnament[0].originFileObj);
            } else if (capturedImage) {
                const blob = await fetch(capturedImage).then(r => r.blob());
                formData.append('ornament_photo', blob, 'ornament.jpg');

            }
            if (capturedImage1) {
                const blob = await fetch(capturedImage1).then(r => r.blob());
                formData.append('user_capture', blob, 'user_capture.jpg');
            }

            // Call the API to create the purchase
            const response = await createPurchase(formData);

            if (response.success) {
                const newPurchase = response.data;
                stopRecording()
                setPurchases([...purchases, newPurchase]);
                setBarcode(newPurchase.barcode);
                setQrData(newPurchase.qr_code_path);
                setReceiptId(response.data.id); // store for later use
                handleCancel();
                setShowPaymentModal(false);
                //     Swal.fire({
                //   icon: 'success',
                //   title: 'Purchase Recorded',
                //   text: 'Purchase has been recorded successfully',
                //   confirmButtonColor: roots.teal[500],
                //   willClose: () => {
                //     naviagation(`/receipt/${response.data.id}`);
                //   }
                // });
            } else {
                throw new Error(response.message || 'Failed to record purchase');
            }

        } catch (error) {
            console.error('Error recording purchase:', error);
            Swal.fire({
                icon: 'error',
                title: 'Purchase Failed',
                text: error.response?.data?.message || 'Failed to record purchase. Please try again.',
                confirmButtonColor: roots.status.error.main
            });
        } finally {
            setLoading(false);
        }
    };

    const onFinish = (values) => {
        if (purchaseProducts.length === 0) {
            message.error('Please add at least one product');
            return;
        }

        const totalAmount = purchaseProducts.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0);

        // Set default payment method based on amount
        if (totalAmount <= 50000) {
            setPaymentMethod('cash');
        } else {
            setPaymentMethod('bank_transfer');
        }

        setShowPaymentModal(true);
    };

    const uploadProps = (fileList, setFileList) => ({
        onRemove: (file) => handleRemove(file, fileList, setFileList),
        beforeUpload: (file) => handleUpload(file, fileList, setFileList),
        fileList,
        listType: "picture-card",
        onPreview: handlePreview,
        accept: "image/*",
        maxCount: 1
    });

    const handleEditPurchase = async (record) => {
        try {
            setLoading(true);
            const response = await getPurchaseById(record.id);
            const purchase = response.data;

            // Find customer either directly from purchase or via quotation
            let customer = null;

            // First try to find by customer_id
            if (purchase.customer_id) {
                customer = customers.find(c => c.id === purchase.customer_id);
            }
            // If no customer_id, try to find via quotation_id
            else if (purchase.quotation_id) {
                const quotationResponse = await getQuatationCodeById(purchase.quotation_id);
                const quotation = quotationResponse.data;

                if (quotation && quotation.customer_name) {
                    customer = customers.find(c => c.customer_name === quotation.customer_name);
                }
            }

            if (customer) {
                setSelectedCustomer(customer);
                setIsModalVisible(true);

                form.setFieldsValue({
                    ...purchase,
                    customer_id: customer.id || null,
                    customer_name: customer.customer_name,
                    aadhar_no: customer.aadhar_no || purchase.aadhar_no || '',
                    pan_no: customer.pan_no || purchase.pan_no || ''
                });

                // Parse products if they're a string
                const products = typeof purchase.products === 'string'
                    ? JSON.parse(purchase.products)
                    : purchase.products || [];

                setPurchaseProducts(products);

                // Handle bill copy
                if (purchase.bill_copy) {
                    setFileListBill([{
                        uid: '-1',
                        name: 'bill.jpg',
                        status: 'done',
                        url: purchase.bill_copy
                    }]);
                } else {
                    setFileListBill([]);
                }

                // Handle ornament photo
                if (purchase.ornament_photo) {
                    setFileListOrnament([{
                        uid: '-2',
                        name: 'ornament.jpg',
                        status: 'done',
                        url: purchase.ornament_photo
                    }]);
                } else {
                    setFileListOrnament([]);
                }

                // Handle reference
                if (purchase.reference && purchase.reference !== 'standard') {
                    setOtherReference(true);
                    form.setFieldsValue({
                        other_reference: purchase.reference
                    });
                } else {
                    setOtherReference(false);
                }
            } else {
                message.error('Customer not found for this purchase');
                setIsModalVisible(false);
            }
        } catch (error) {
            message.error('Failed to load purchase details');
            console.error('Error loading purchase:', error);
            setIsModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePurchase = async (purchaseId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the purchase record.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: roots.status.error.main,
            cancelButtonColor: roots.teal[500]
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                await deletePurchase(purchaseId);

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Purchase has been deleted successfully.',
                    confirmButtonColor: roots.teal[500]
                });

                const response = await getPurchases();
                setPurchases(response.data || []);
                fetchInitialData();

            } catch (error) {
                console.error('Error deleting purchase:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: error.response?.data?.message || 'Failed to delete purchase. Please try again.',
                    confirmButtonColor: roots.status.error.main
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const getTotalPurchases = () => {
        return filteredPurchases.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const renderProductForm = (product) => {
        const marginRange = getMarginRange();
        const errors = weightErrors[product.key] || {};

        return (
            <Card
                key={product.key}
                style={{ marginBottom: 16, borderLeft: `4px solid ${roots.gold[400]}` }}
                title={`Product ${purchaseProducts.findIndex(p => p.key === product.key) + 1}`}
                extra={
                    purchaseProducts.length > 1 && (
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => removeProduct(product.key)}
                            danger
                        />
                    )
                }
            >
                {errors.weight && (
                    <div style={{ color: 'red', marginBottom: '16px' }}>
                        {errors.weight}
                    </div>
                )}
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="Metal"
                            rules={[{ required: true, message: 'Please select metal!' }]}
                        >
                            <Select
                                value={product.metal}
                                onChange={(value) => updateProduct(product.key, 'metal', value)}
                            >
                                {metals.map(metal => (
                                    <Option key={metal.id} value={metal.id}>
                                        {metal.metalname}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Product"
                            rules={[{ required: true, message: 'Please select product!' }]}
                        >
                            <Select
                                value={product.product}
                                onChange={(value) => handleProductChange(value, product.key)}
                            >
                                {products.map(prod => (
                                    <Option key={prod.id} value={prod.id}>
                                        {prod.product_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Sub Product"
                            rules={[{ required: true, message: 'Please select sub product!' }]}
                        >
                            <Select
                                value={product.sub_product}
                                onChange={(value) => updateProduct(product.key, 'sub_product', value)}
                                disabled={!product.product}
                            >
                                {currentSubProducts.map(subProd => (
                                    <Option key={subProd.id} value={subProd.id}>
                                        {subProd.sub_product_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={6}>
                        <Form.Item
                            label="Gross Weight (g)"
                            rules={[{ required: true, message: 'Please input gross weight!' }]}
                        >
                            <InputNumber
                                value={product.gross_weight}
                                onChange={(value) => updateProduct(product.key, 'gross_weight', value)}
                                min={0}
                                step={0.001}
                                precision={3}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            label="Dust Weight (g)"
                            rules={[{ required: true, message: 'Please input dust weight!' }]}
                        >
                            <InputNumber
                                value={product.dust_weight}
                                onChange={(value) => updateProduct(product.key, 'dust_weight', value)}
                                min={0}
                                step={0.001}
                                precision={3}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            label="Stone Weight (g)"
                            rules={[{ required: true, message: 'Please input stone weight!' }]}
                        >
                            <InputNumber
                                value={product.stone_weight}
                                onChange={(value) => updateProduct(product.key, 'stone_weight', value)}
                                min={0}
                                step={0.001}
                                precision={3}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            label="Net Weight (g)"
                        >
                            <InputNumber
                                value={product.net_weight}
                                disabled
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="MCX Rate (₹/g)"
                            rules={[{ required: true, message: 'Please input MCX rate!' }]}
                        >
                            <InputNumber
                                value={product.mcx_rate}
                                onChange={(value) => updateProduct(product.key, 'mcx_rate', value)}
                                min={0}
                                step={1}
                                precision={2}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Margin %"
                            rules={[{ required: true, message: 'Please input margin %!' }]}
                        >
                            <InputNumber
                                value={product.margin_percent}
                                onChange={(value) => updateProduct(product.key, 'margin_percent', value)}
                                min={marginRange.min}
                                max={marginRange.max}
                                step={0.1}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Rate (₹/g)"
                        >
                            <InputNumber
                                value={product.rate}
                                disabled
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="Margin Weight (g)"
                        >
                            <InputNumber
                                value={product.margin_weight}
                                disabled
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Final Weight (g)"
                        >
                            <InputNumber
                                value={product.final_weight}
                                disabled
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Amount (₹)"
                        >
                            <InputNumber
                                value={product.amount}
                                disabled
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderPaymentModal = () => {
        const totalAmount = purchaseProducts.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0);
        const partialTotal = parseFloat(partialPayment.cashAmount || 0) + parseFloat(partialPayment.bankAmount || 0);

        return (
            <Modal
                title="Select Payment Method"
                visible={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                footer={null}
                width={600}
            >
                {paymentValidationError && (
                    <Alert
                        message={paymentValidationError}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Tabs defaultActiveKey={paymentMethod}>
                        <TabPane tab="Full Payment" key="full">
                            <Radio.Group
                                onChange={handlePaymentMethodChange}
                                value={paymentMethod}
                                style={{ marginBottom: 24 }}
                            >
                                <Radio value="cash" style={{ display: 'block', marginBottom: 16 }}>
                                    <Space>
                                        <MoneyCollectOutlined style={{ fontSize: 24 }} />
                                        <span>Cash Payment (below ₹50,000)</span>
                                    </Space>
                                </Radio>
                                <Radio
                                    value="bank_transfer"
                                    style={{ display: 'block' }}
                                    disabled={!bankDetailsAvailable}
                                >
                                    <Space>
                                        <BankOutlined style={{ fontSize: 24 }} />
                                        <span>Bank Transfer (above ₹50,000)</span>
                                    </Space>
                                </Radio>
                            </Radio.Group>

                            {paymentMethod === 'bank_transfer' && !bankDetailsAvailable && (
                                <Alert
                                    message={
                                        <span>
                                            <InfoCircleOutlined /> Customer does not have bank details.
                                            {selectedCustomer && (
                                                <Button
                                                    type="link"
                                                    onClick={() => naviagation(`/customers/edit/${selectedCustomer.customer_id}`)}
                                                >
                                                    Add Bank Details
                                                </Button>
                                            )}
                                        </span>
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            {paymentMethod === 'bank_transfer' && bankDetailsAvailable && customerBankDetails && (
                                <Card
                                    title="Customer Bank Details"
                                    size="small"
                                    style={{ marginBottom: 16, textAlign: 'left' }}
                                >
                                    <p><strong>Bank Name:</strong> {customerBankDetails.bankName}</p>
                                    <p><strong>Account Number:</strong> {customerBankDetails.accountNumber}</p>
                                    <p><strong>IFSC Code:</strong> {customerBankDetails.ifscCode}</p>
                                </Card>
                            )}
                        </TabPane>

                        <TabPane tab="Partial Payment" key="partial">
                            <Radio.Group
                                onChange={handlePaymentMethodChange}
                                value={paymentMethod}
                                style={{ marginBottom: 24 }}
                            >
                                <Radio value="partial_cash" style={{ display: 'block', marginBottom: 16 }}>
                                    <Space>
                                        <MoneyCollectOutlined style={{ fontSize: 24 }} />
                                        <span>Partial Cash</span>
                                    </Space>
                                </Radio>
                                <Radio
                                    value="partial_bank"
                                    style={{ display: 'block', marginBottom: 16 }}
                                    disabled={!bankDetailsAvailable}
                                >
                                    <Space>
                                        <BankOutlined style={{ fontSize: 24 }} />
                                        <span>Partial Bank Transfer</span>
                                    </Space>
                                </Radio>
                                <Radio
                                    value="partial_both"
                                    style={{ display: 'block' }}
                                    disabled={!bankDetailsAvailable}
                                >
                                    <Space>
                                        <BankOutlined style={{ fontSize: 24 }} />
                                        <MoneyCollectOutlined style={{ fontSize: 24 }} />
                                        <span>Both (Cash + Bank)</span>
                                    </Space>
                                </Radio>
                            </Radio.Group>

                            {(paymentMethod === 'partial_cash' || paymentMethod === 'partial_both') && (
                                <div className="partial-payment-form">
                                    <Form.Item label="Cash Amount (₹)" required>
                                        <InputNumber
                                            value={partialPayment.cashAmount}
                                            onChange={(value) => handlePartialPaymentChange('cashAmount', value)}
                                            min={0}
                                            max={totalAmount}
                                            step={100}
                                            precision={2}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>
                            )}

                            {(paymentMethod === 'partial_bank' || paymentMethod === 'partial_both') && (
                                <div className="partial-payment-form">
                                    <Form.Item label="Bank Transfer Amount (₹)" required>
                                        <InputNumber
                                            value={partialPayment.bankAmount}
                                            onChange={(value) => handlePartialPaymentChange('bankAmount', value)}
                                            min={0}
                                            max={totalAmount}
                                            step={100}
                                            precision={2}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label="Bank Transfer Details"
                                        required
                                        rules={[{ required: true, message: 'Please provide bank details' }]}
                                    >
                                        <Input.TextArea
                                            value={partialPayment.bankDetails}
                                            onChange={(e) => handlePartialPaymentChange('bankDetails', e.target.value)}
                                            rows={3}
                                            placeholder="Enter bank name, account number, reference number, etc."
                                        />
                                    </Form.Item>
                                </div>
                            )}

                            <div style={{ margin: '16px 0', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
                                <Text strong>Total Amount: ₹{totalAmount.toFixed(2)}</Text>
                                {paymentMethod.includes('partial') && (
                                    <div style={{ marginTop: '8px' }}>
                                        <Text>
                                            Cash: ₹{partialPayment.cashAmount || 0} + Bank: ₹{partialPayment.bankAmount || 0} =
                                            ₹{partialTotal.toFixed(2)}
                                        </Text>
                                        {Math.abs(partialTotal - totalAmount) > 0.01 && (
                                            <Text type="danger" style={{ display: 'block', marginTop: 8 }}>
                                                Partial payment total must equal the full amount
                                            </Text>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabPane>
                    </Tabs>

                    <Button
                        type="primary"
                        onClick={handleFinalSubmit}
                        style={{ width: '100%' }}
                        loading={loading}
                    >
                        Complete Purchase
                    </Button>
                </div>
            </Modal>
        );
    };

    const purchaseColumns = [
        {
            title: 'Purchase ID',
            dataIndex: 'purchase_id',
            key: 'purchase_id',
            width: 120,
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Quatation ID',
            dataIndex: 'quotation_id',
            key: 'quotation_id',
            width: 120,
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        // {
        //   title: 'Barcode',
        //   dataIndex: 'barcode',
        //   key: 'barcode',
        //   width: 150,
        //   render: (text) => (
        //     <div style={{ display: 'flex', alignItems: 'center' }}>
        //       <BarcodeOutlined style={{ marginRight: 8, color: roots.gold[500] }} />
        //       {text}
        //     </div>
        //   )
        // },
        {
            title: 'QR Code',
            dataIndex: 'qr_data',
            key: 'qr_data',
            width: 100,
            render: (_, record) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {record.qr_code_path && (
                        <img
                            src={`${uploadConfigUrl}${record.qr_code_path}`}
                            alt="QR Code"
                            style={{ width: 60, height: 60 }}
                        />
                    )}
                </div>
            )
        },

        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
            render: (text) => {
                if (!text) return '-';
                const date = new Date(text);
                return date.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        },
        {
            title: 'Customer',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 150,
            render: (text, record) => (
                <div>
                    <div>{text}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.customer_id}</Text>
                </div>
            )
        },
        {
            title: 'Product Details',
            key: 'product_details',
            width: 200,
            render: (_, record) => {
                const firstProduct = record.products?.[0] || {};
                return <ProductDetailsCell product={firstProduct} />;
            }
        },
        {
            title: 'Weight (g)',
            key: 'weight',
            width: 120,
            render: (_, record) => {
                const firstProduct = record.products && record.products.length > 0 ? record.products[0] : {};
                return (
                    <div>
                        <div>Gross: {firstProduct.gross_weight || '0.000'}</div>
                        <div>Net: {firstProduct.net_weight || '0.000'}</div>
                    </div>
                );
            }
        },
        {
            title: 'Rate & Amount',
            key: 'rate_amount',
            width: 150,
            render: (_, record) => {
                const firstProduct = record.products && record.products.length > 0 ? record.products[0] : {};
                return (
                    <div>
                        <div>Rate: ₹{firstProduct.rate || '0.00'}/g</div>
                        <div>Amount: ₹{record.total_amount || '0.00'}</div>
                    </div>
                );
            }
        },
        {
            title: 'Finance Amount',
            key: 'rate_amount',
            width: 150,
            render: (_, record) => {
                const approved = Number(record.accounts_amount) || 0;
                const total = Number(record.total_amount) || 0;

                return (
                    <div>
                        <div>Finance Amount: ₹{approved}/g</div>
                        <div>Amount: ₹{(total - approved).toFixed(2)}</div>
                    </div>
                );
            }
        },

        {
            title: 'Payment',
            key: 'payment',
            width: 120,
            render: (_, record) => {
                let paymentText = '';
                let tagColor = '';

                if (record.payment_method === 'cash') {
                    paymentText = 'Cash';
                    tagColor = 'green';
                } else if (record.payment_method === 'bank_transfer') {
                    paymentText = 'Bank Transfer';
                    tagColor = 'geekblue';
                } else if (record.payment_method.includes('partial')) {
                    paymentText = 'Partial Payment';
                    tagColor = 'orange';
                }

                return (
                    <Tag color={tagColor}>
                        {paymentText}
                    </Tag>
                );
            }
        },
        {
            title: 'Pledge Status',
            key: 'pledge_status',
            width: 120,
            render: (_, record) => {
                let paymentText = '';
                let tagColor = '';

                if (record.pledge_status === '1') {
                    paymentText = 'Pledge';
                    tagColor = 'green';
                } else {
                    paymentText = 'Customer Pledge';
                    tagColor = 'orange';
                }

                return (
                    <Tag color={tagColor}>
                        {paymentText}
                    </Tag>
                );
            }
        },
        {
            title: 'Collected Status',
            key: 'collected_status',
            width: 200,
            render: (_, record) => regionalStatusSwitch(record)
        },
        {
            title: 'Action',
            key: 'melting_status',
            width: 160,
            render: (_, record) => {
                if (record.collected_status === '1') {
                    if (!record.melting_status || record.melting_status === 0) {
                        return (
                            <Button
                                type="primary"
                                onClick={() => {
                                    Swal.fire({
                                        title: "Send to Head Office?",
                                        text: "Do you want to send this purchase for melting?",
                                        icon: "question",
                                        showCancelButton: true,
                                        confirmButtonText: "Yes, Send it",
                                        cancelButtonText: "No, Cancel",
                                    }).then(async (result) => {
                                        if (result.isConfirmed) {
                                            await createMeltingPurchase({ id: record.id });
                                            await fetchInitialData();
                                            Swal.fire("Success!", "Purchase sent to head office for melting.", "success");
                                        }
                                    });
                                }}
                            >
                                Send to Melting
                            </Button>
                        );
                    } else {
                        return (
                            <Button type="default" disabled>
                                Sent to Head Office
                            </Button>
                        );
                    }
                } else {
                    // ✅ Added return here
                    return (
                        <Button type="default" disabled>
                            Product not collected
                        </Button>
                    );
                }
            },
        }


    ];

    const customerColumns = [
        {
            title: 'Customer ID',
            dataIndex: 'customer_id',
            key: 'customer_id',
            width: 120,
            render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
        },
        {
            title: 'Photo',
            dataIndex: 'customer_photo',
            key: 'customer_photo',
            width: 80,
            render: (_, record) => (
                <Avatar
                    src={`${uploadConfigUrl}${record.customer_photo}`}
                    size="large"
                    icon={<CameraOutlined />}
                    style={{ backgroundColor: roots.gold[400] }}
                />
            )
        },
        {
            title: 'Customer Name',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 150,
            render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
        },
        {
            title: 'Aadhar No',
            dataIndex: 'aadhar_no',
            key: 'aadhar_no',
            width: 140
        },
        {
            title: 'PAN No',
            dataIndex: 'pan_no',
            key: 'pan_no',
            width: 120
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 80,
            render: (_, record) => (
                <Button
                    type="primary"
                    onClick={() => selectCustomer(record)}
                >
                    Select
                </Button>
            )
        }
    ];

    const quotationColumns = [
        {
            title: 'Quotation ID',
            dataIndex: 'quotation_id',
            key: 'quotation_id',
            width: 150,
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 100,
            sorter: (a, b) => new Date(a.date) - new Date(b.date)
        },
        {
            title: 'Customer',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 150,
            render: (text, record) => (
                <div>
                    <div>{text}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.customer_id}</Text>
                </div>
            )
        },
        {
            title: 'Product Details',
            key: 'product_details',
            width: 200,
            render: (_, record) => (
                <div>
                    <div><Text strong>{record.metal}</Text></div>
                    <div>{record.product} - {record.sub_product}</div>
                </div>
            )
        },
        {
            title: 'Amount (₹)',
            dataIndex: 'total_amount',
            key: 'total_amount',
            width: 120,
            render: (text) => `₹${text}`
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_, record) => (
                <Tag color={record.status === 'active' ? 'green' : 'orange'}>
                    {record.status === 'active' ? 'Active' : 'Expired'}
                </Tag>
            )
        },
        {
            title: 'Pledge Status',
            key: 'pledge_id',
            width: 120,
            render: (_, record) => (
                record?.pledge_id ? (
                    <Tag color="blue">Pledge</Tag>
                ) : (
                    <Tag color="orange">Customer Pledge</Tag>
                )
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="primary"
                    onClick={() => selectQuotation(record)}
                >
                    Select
                </Button>
            )
        }
    ];

    const customStyles = `
      .ant-table-thead > tr > th {
        background: ${roots.gold[400]} !important;
        color: ${roots.text.primary} !important;
        border-bottom: 2px solid ${roots.gold[500]} !important;
        font-weight: 600;
      }
      .ant-table-tbody > tr:hover > td {
        background-color: ${roots.ebony[50]} !important;
      }
      .ant-modal-header {
        background: ${roots.gradient.gold} !important;
        border-bottom: 2px solid ${roots.gold[500]} !important;
      }
      .ant-modal-title {
        color: ${roots.text.inverse} !important;
        padding: 10px;
        font-weight: 600;
      }
      .filter-card {
        box-shadow: ${roots.shadow.md};
        border: ${roots.border.light};
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .add-button {
        background: ${roots.gradient.gold} !important;
        border: none !important;
        color: ${roots.text.inverse} !important;
        font-weight: 600;
        box-shadow: ${roots.shadow.gold};
        transition: ${roots.transition.normal};
      }
      .add-button:hover {
        transform: translateY(-2px);
        box-shadow: ${roots.shadow.xl}, ${roots.shadow.gold};
      }
      .upload-section {
        margin: 16px 0;
        border: 1px dashed ${roots.ebony[200]};
        padding: 16px;
        border-radius: 8px;
      }
      .upload-section-title {
        margin-bottom: 8px;
        font-weight: 500;
        color: ${roots.text.secondary};
      }
      .customer-card {
        border: 1px solid ${roots.ebony[200]};
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        background: ${roots.ebony[50]};
      }
      .webcam-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 16px;
      }
      .webcam-buttons {
        margin-top: 16px;
      }
      .stats-card {
        border-left: 4px solid ${roots.gold[500]};
        border-radius: 4px;
      }
      .purchase-table {
        margin-top: 24px;
      }
      .barcode-container {
        display: flex;
        justify-content: center;
        margin: 20px 0;
        padding: 15px;
        background: white;
        border-radius: 8px;
        box-shadow: ${roots.shadow.sm};
      }
      .partial-payment-form {
        margin-top: 16px;
        padding: 16px;
        background: ${roots.ebony[50]};
        border-radius: 8px;
      }
    `;

    return (
        <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            {/* Customer/Quotation Selection */}
            {selectedCustomer ? (
                <Card className="customer-card">
                    <Row gutter={16} align="middle">
                        <Col flex="80px">
                            <Avatar
                                src={selectedCustomer.customer_photo}
                                size={64}
                                icon={<CameraOutlined />}
                                style={{ backgroundColor: roots.gold[400] }}
                            />
                        </Col>
                        <Col flex="auto">
                            <Title level={4} style={{ marginBottom: 0 }}>{selectedCustomer.customer_name}</Title>
                            <Text type="secondary">ID: {selectedCustomer.customer_id}</Text>
                            <div>
                                <Text strong style={{ marginRight: 16 }}>Aadhar: {selectedCustomer.aadhar_no}</Text>
                                <Text strong>PAN: {selectedCustomer.pan_no}</Text>
                            </div>
                            <div>
                                <Text>{selectedCustomer.address_1}, {selectedCustomer.city}, {selectedCustomer.state}</Text>
                            </div>
                        </Col>
                        <Col>
                            <Button
                                type="link"
                                onClick={clearSelection}
                                style={{ color: roots.status.error.main }}
                            >
                                Change
                            </Button>
                        </Col>
                    </Row>
                </Card>
            ) : (
                <Space style={{ marginBottom: 16 }}>

                </Space>
            )}

            {/* Purchase Filters */}
            {/* Enhanced Purchase Filters */}
            <Card className="filter-card">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={5}>
                        <Input
                            placeholder="Search purchases..."
                            prefix={<SearchOutlined />}
                            value={purchaseFilters.search}
                            onChange={(e) => setPurchaseFilters({ ...purchaseFilters, search: e.target.value })}
                            allowClear
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
                            {metals.map(metal => (
                                <Option key={metal.id} value={metal.id}>{metal.metalname}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            placeholder="Regional Status"
                            value={purchaseFilters.status}
                            onChange={(value) => setPurchaseFilters({ ...purchaseFilters, status: value })}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="1">Sent</Option>
                            <Option value="0">Not Sent</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates)}
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            placeholder={['Start Date', 'End Date']}
                        />
                    </Col>
                    <Col xs={24} sm={24} md={5}>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    setPurchaseFilters({
                                        search: '',
                                        metal: '',
                                        status: '',
                                        dateRange: []
                                    });
                                    setDateRange([]);
                                }}
                                style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                            >
                                Reset
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                type="primary"
                                onClick={handleExportPDF}
                                loading={exportLoading}
                                style={{
                                    background: roots.green[500],
                                    borderColor: roots.green[500],
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                Export PDF
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* Active filters summary */}
                {(purchaseFilters.search || purchaseFilters.metal || purchaseFilters.status || dateRange.length > 0) && (
                    <div style={{ marginTop: 16, padding: 8, background: '#f0f8ff', borderRadius: 4 }}>
                        <Text strong>Active Filters: </Text>
                        {purchaseFilters.search && <Tag color="blue">Search: {purchaseFilters.search}</Tag>}
                        {purchaseFilters.metal && (
                            <Tag color="green">
                                Metal: {metals.find(m => m.id === purchaseFilters.metal)?.metalname || purchaseFilters.metal}
                            </Tag>
                        )}
                        {purchaseFilters.status && (
                            <Tag color="orange">
                                Status: {purchaseFilters.status === "1" ? "Sent" : "Not Sent"}
                            </Tag>
                        )}
                        {dateRange.length > 0 && (
                            <Tag color="purple">
                                Date: {dateRange[0].format('YYYY-MM-DD')} to {dateRange[1].format('YYYY-MM-DD')}
                            </Tag>
                        )}
                    </div>
                )}
            </Card>

            {/* Purchases Table */}
            <Spin spinning={loading}>
                <Table
                    columns={purchaseColumns}
                    dataSource={filteredPurchases}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                    scroll={{ x: 1500 }}
                    rowKey="purchase_id"
                    size="middle"
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={6}>
                                    {/* <Text strong>Total</Text> */}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                    {/* <Text strong>₹{getTotalPurchases().toFixed(2)}</Text> */}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </Spin>

            <Button
                onClick={handleSubmit}
                style={{
                    background: roots.green[500],
                    borderColor: roots.green[500],
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
                disabled={purchases.length === 0}
            >
                Submit
            </Button>

            {/* Purchase Modal */}
            <Modal
                title={`Purchase - ${selectedCustomer?.customer_name || ''}`}
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={1000}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    {/* Customer Info */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Customer ID"
                                name="customer_id"
                            >
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Customer Name"
                                name="customer_name"
                            >
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <div className="upload-section">
                            <div className="upload-section-title">Live Capture</div>

                            {isModalVisible && (
                                <div className="webcam-container">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        style={{ width: '100%', maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />

                                    <div className="webcam-buttons" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                        <Button
                                            onClick={captureImageWhileRecording}
                                            type="primary"
                                            icon={<CameraOutlined />}
                                        >
                                            Capture Image
                                        </Button>

                                        {/* {recording ? (
              <Button onClick={stopRecording} type="primary" danger>
                Stop Recording
              </Button>
            ) : (
              <Button onClick={() => startRecording(stream)} type="primary">
                Start Recording
              </Button>
            )} */}
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <Text type="secondary">
                                            {recording ?
                                                'Recording in progress... Click "Capture Image" to take photos' :
                                                'Camera is ready. Start recording to begin.'}
                                        </Text>
                                    </div>
                                </div>
                            )}

                            {/* Show captured images */}
                            {capturedImage1 && (
                                <div style={{ marginTop: '16px' }}>
                                    <Text strong>Captured Image:</Text>
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Image
                                            src={capturedImage1}
                                            width={100}
                                            style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                        <Button
                                            type="link"
                                            danger
                                            onClick={() => {
                                                setCapturedImage(null);
                                                // Also remove from file list
                                                setFileListOrnament(prev => prev.filter(file => !file.uid.includes('capture-')));
                                            }}
                                            icon={<DeleteOutlined />}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Upload additional files */}
                            {/* <div style={{ marginTop: '16px' }}>
                  <Upload {...uploadProps(fileListOrnament, setFileListOrnament)}>
                    {fileListOrnament.length >= 5 ? null : (
                      <div>
                        <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                        <div style={{ marginTop: '8px' }}>Upload Additional Files</div>
                      </div>
                    )}
                  </Upload>
                </div> */}
                        </div>

                        <Modal
                            visible={previewVisible}
                            title="Preview"
                            footer={null}
                            onCancel={() => setPreviewVisible(false)}
                            width={previewImage?.includes('blob') || previewImage?.type === 'video' ? 600 : 400}
                        >
                            {previewImage?.includes('blob') || (previewImage && typeof previewImage === 'object' && previewImage.type === 'video') ? (
                                <video controls autoPlay style={{ width: '100%' }}>
                                    <source src={typeof previewImage === 'object' ? previewImage.url : previewImage} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <img
                                    alt="preview"
                                    style={{ width: '100%' }}
                                    src={typeof previewImage === 'object' ? previewImage.url : `${uploadConfigUrl}${previewImage}`}
                                />
                            )}
                        </Modal>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Aadhar Number"
                                name="aadhar_no"
                                rules={[
                                    { required: true, message: 'Please input Aadhar number!' },
                                    { len: 12, message: 'Aadhar must be 12 digits!' }
                                ]}
                            >
                                <Input
                                    maxLength={12}
                                    disabled={otpVerified}
                                    suffix={
                                        !otpVerified && (
                                            <Button
                                                type="link"
                                                onClick={handleAadharOtp}
                                                loading={aadharVerifying}
                                                disabled={otpSent}
                                            >
                                                {otpSent ? 'OTP Sent' : 'Get OTP'}
                                            </Button>
                                        )
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="PAN Number"
                                name="pan_no"
                                rules={[
                                    { required: true, message: 'Please input PAN number!' }
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    {otpSent && !otpVerified && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Aadhar OTP"
                                    name="aadhar_otp"
                                    rules={[{ required: true, message: 'Please input OTP!' }]}
                                    validateStatus={aadharVerificationError ? 'error' : ''}
                                    help={aadharVerificationError}
                                >
                                    <Input maxLength={6} />
                                </Form.Item>
                            </Col>
                            <Col span={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Button
                                    type="primary"
                                    onClick={verifyAadharOtp}
                                    style={{ marginBottom: 24 }}
                                >
                                    Verify OTP
                                </Button>
                            </Col>
                        </Row>
                    )}

                    {otpVerified && (
                        <div style={{ marginBottom: 16 }}>
                            <Tag color="green">Aadhar Verified</Tag>
                        </div>
                    )}

                    {/* Product Forms */}
                    <Divider orientation="left">Products</Divider>

                    {purchaseProducts.map(renderProductForm)}

                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={addProduct}
                        >
                            Add Product
                        </Button>
                    </div>

                    {/* Total Amount */}
                    <Card style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Title level={4}>
                            Total Amount: ₹{purchaseProducts.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0).toFixed(2)}
                        </Title>
                    </Card>

                    {/* Documentation */}
                    <Divider orientation="left">Documentation</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Reference"
                                name="reference"
                                rules={[{ required: true, message: 'Please select reference!' }]}
                            >
                                <Select
                                    onChange={(value) => setOtherReference(value === 'other')}
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {referenceOptions.map(option => (
                                        <Option key={option.value} value={option.value}>{option.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        {otherReference && (
                            <Col span={12}>
                                <Form.Item
                                    label="Other Reference"
                                    name="other_reference"
                                    rules={[{ required: true, message: 'Please specify reference!' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    {/* File Uploads */}
                    <div className="upload-section">
                        <div className="upload-section-title">Bill Copy</div>
                        <Upload {...uploadProps(fileListBill, setFileListBill)}>
                            {fileListBill.length >= 1 ? null : (
                                <div>
                                    <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                                    <div style={{ marginTop: 8 }}>Upload Bill Copy</div>
                                </div>
                            )}
                        </Upload>
                    </div>

                    <div className="upload-section">
                        <div className="upload-section-title">Ornament Photo</div>
                        {showWebcam ? (
                            <div className="webcam-container">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        facingMode: "environment"
                                    }}
                                />
                                <div className="webcam-buttons">
                                    <Button onClick={captureImage} type="primary" style={{ marginRight: 8 }}>
                                        Capture Photo
                                    </Button>
                                    <Button onClick={() => setShowWebcam(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Button
                                    onClick={() => setShowWebcam(true)}
                                    icon={<CameraOutlined />}
                                    style={{ marginBottom: 8 }}
                                >
                                    Take Photo
                                </Button>
                                <Upload {...uploadProps(fileListOrnament, setFileListOrnament)}>
                                    {fileListOrnament.length >= 1 ? null : (
                                        <div>
                                            <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                                            <div style={{ marginTop: 8 }}>Upload Ornament Photo</div>
                                        </div>
                                    )}
                                </Upload>
                                {/* {capturedImage && (
                    <Image
                      src={capturedImage}
                      width={100}
                      style={{ marginTop: 8 }}
                    />
                  )} */}
                            </>
                        )}
                    </div>

                    <Form.Item
                        label="Remarks"
                        name="remarks"
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '32px', textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{
                                    background: roots.gradient.gold,
                                    border: 'none',
                                    boxShadow: roots.shadow.gold
                                }}
                            >
                                Proceed to Payment
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {renderPaymentModal()}

            {/* Customer Selection Modal */}
            <Modal
                title="Select Customer"
                visible={isCustomerModalVisible}
                onCancel={handleCustomerCancel}
                footer={null}
                width={1000}
            >
                <Card className="filter-card" style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={8} md={6}>
                            <Input
                                placeholder="Search customers..."
                                prefix={<SearchOutlined />}
                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={8} md={5}>
                            <Select
                                placeholder="Filter by State"
                                onChange={handleStateFilter}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {statesList.map(state => (
                                    <Option key={state} value={state}>{state}</Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={24} md={8}>
                            <Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={resetCustomerFilters}
                                    style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                                >
                                    Reset Filters
                                </Button>
                                <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>
                                    {filteredCustomers.length} customers found
                                </Tag>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                <Table
                    columns={customerColumns}
                    dataSource={filteredCustomers}
                    pagination={{
                        pageSize: 5,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                    scroll={{ x: 1000 }}
                    rowKey="customer_id"
                    size="middle"
                />
            </Modal>

            <Modal
                visible={previewVisible}
                title="Image Preview"
                footer={null}
                onCancel={() => setPreviewVisible(false)}
            >
                <img alt="preview" style={{ width: '100%' }} src={`${uploadConfigUrl}${previewImage}`} />
            </Modal>
        </div>
    );
};

export default AccountsPurchaseCheck;