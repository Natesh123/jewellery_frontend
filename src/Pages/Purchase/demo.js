import React, { useState, useEffect, useRef } from 'react';
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
  Spin,
  Tabs
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
  CloseOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import Webcam from "react-webcam";
import { v4 as uuidv4 } from 'uuid';
import Barcode from 'react-barcode';
import Swal from 'sweetalert2';

// API Services
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  verifyAadhar,
  sendAadharOtp
} from '../../api/services/purchaseService';

import { getCustomers, getCustomerById } from '../../api/services/customerServices';
import { getQuotations, getQuotationById } from '../../api/services/quatationService';
import { getMetals } from '../../api/services/metalService';
import { getProducts } from '../../api/services/productService';
import { getSubProducts } from '../../api/services/subProductServices';
import { getReferencePersons } from '../../api/services/referenceService';

import {uploadConfigUrl} from '../../api/apiUrl';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Purchase = () => {
  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
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
  const [subProducts, setSubProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);
  const [showOtherReference, setShowOtherReference] = useState(false);
  const [showReferencePerson, setShowReferencePerson] = useState(false);
  const [userRole, setUserRole] = useState('sales_executive'); // Default role
  const webcamRef = useRef(null);

  // Data from APIs
  const [metals, setMetals] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [subProductOptions, setSubProductOptions] = useState({});
  const [referenceOptions, setReferenceOptions] = useState([]);
  const [referencePersons, setReferencePersons] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    state: ''
  });

  const [quotationFilters, setQuotationFilters] = useState({
    search: '',
    status: ''
  });

  const [purchaseFilters, setPurchaseFilters] = useState({
    search: '',
    metal: '',
    dateRange: []
  });

  // Load initial data
  useEffect(() => {
    fetchInitialData();
    fetchReferenceData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch metals
      const metalsResponse = await getMetals();
      setMetals(metalsResponse.data || []);
      
      // Fetch products
      const productsResponse = await getProducts();
      setProductOptions(productsResponse.data || []);
      
      // Fetch subproducts and organize by product
      const subProductsResponse = await getSubProducts();
      const subProductsByProduct = {};
      subProductsResponse.data.forEach(subProduct => {
        if (!subProductsByProduct[subProduct.product_id]) {
          subProductsByProduct[subProduct.product_id] = [];
        }
        subProductsByProduct[subProduct.product_id].push(subProduct);
      });
      setSubProductOptions(subProductsByProduct);
      
      // Fetch customers
      const customersResponse = await getCustomers();
      setCustomers(customersResponse.customers || []);
      setFilteredCustomers(customersResponse.customers || []);
      
      // Fetch quotations
      const quotationsResponse = await getQuotations();
      setQuotations(quotationsResponse.data || []);
      setFilteredQuotations(quotationsResponse.data || []);
      
      // Fetch purchases
      const purchasesResponse = await getPurchases();
      setPurchases(purchasesResponse.data || []);
      setFilteredPurchases(purchasesResponse.data || []);
      
    } catch (error) {
      message.error('Failed to load initial data');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      // Fetch reference options
      const refOptions = [
        { value: 'advertisement', label: 'Advertisement' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'other', label: 'Other' }
      ];
      setReferenceOptions(refOptions);
      
      // Fetch reference persons (staff)
      const refPersonsResponse = await getReferencePersons();
      setReferencePersons(refPersonsResponse.data || []);
      
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const handleReferenceChange = (value) => {
    setShowOtherReference(value === 'other');
    setShowReferencePerson(['sales_executive', 'manager'].includes(value));
    form.setFieldsValue({
      reference_person: undefined,
      other_reference: undefined
    });
  };

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
        item.purchase_id?.toLowerCase().includes(searchTerm) ||
        item.barcode?.toLowerCase().includes(searchTerm)
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

  // Handle product addition dynamically
  const addProduct = () => {
    const newProduct = {
      key: uuidv4(),
      metal: '',
      product: '',
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
    setProducts([...products, newProduct]);
  };

  const removeProduct = (key) => {
    setProducts(products.filter(product => product.key !== key));
  };

  const updateProduct = (key, field, value) => {
    setProducts(products.map(product => {
      if (product.key === key) {
        const updatedProduct = { ...product, [field]: value };
        
        // Recalculate weights and amounts when relevant fields change
        if (['gross_weight', 'dust_weight', 'stone_weight', 'mcx_rate', 'margin_percent'].includes(field)) {
          return calculateProductValues(updatedProduct);
        }
        
        return updatedProduct;
      }
      return product;
    }));
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
    switch(userRole) {
      case 'superadmin': return 0.5;
      case 'manager': return 2;
      case 'sales_executive': return 3;
      default: return 3;
    }
  };

  const getMarginRange = () => {
    switch(userRole) {
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

  const handleQuotationStatusFilter = (value) => {
    setQuotationFilters(prev => ({ ...prev, status: value }));
  };

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
    setProducts([]);
    setOtpSent(false);
    setOtpVerified(false);
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
    setProducts([]);
  };

  const selectQuotation = (record) => {
    setSelectedQuotation(record);
    setIsQuotationModalVisible(false);
    setIsModalVisible(true);
    
    // Find the customer for this quotation
    const customer = customers.find(c => c.customer_id === record.customer_id);
    if (customer) {
      setSelectedCustomer(customer);
    }

    form.resetFields();
    form.setFieldsValue({
      customer_id: record.customer_id,
      customer_name: record.customer_name,
      aadhar_no: customer?.aadhar_no || '',
      pan_no: customer?.pan_no || '',
    });

    // Add quotation as first product
    const product = {
      key: uuidv4(),
      metal: record.metal,
      product: record.product,
      sub_product: record.sub_product,
      gross_weight: record.gross_weight,
      dust_weight: 0,
      stone_weight: 0,
      net_weight: record.net_weight,
      mcx_rate: record.rate,
      margin_percent: getDefaultMargin(),
      margin_weight: 0,
      final_weight: record.net_weight,
      rate: record.rate,
      amount: record.amount
    };
    setProducts([calculateProductValues(product)]);

    if (record.bill_copy) {
      setFileListBill([{
        uid: '-1',
        name: 'bill.jpg',
        status: 'done',
        url: record.bill_copy
      }]);
    }

    if (record.ornament_photo) {
      setFileListOrnament([{
        uid: '-2',
        name: 'ornament.jpg',
        status: 'done',
        url: record.ornament_photo
      }]);
    }
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setSelectedQuotation(null);
    setIsModalVisible(false);
    setProducts([]);
  };

  // Generate barcode
  const generateBarcode = () => {
    return `PUR${1000 + purchases.length + 1}-${uuidv4().substr(0, 6).toUpperCase()}`;
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
    if (productKey) {
      updateProduct(productKey, 'product', value);
      updateProduct(productKey, 'sub_product', '');
    } else {
      setSelectedProduct(value);
      setSubProducts(subProductOptions[value] || []);
    }
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
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
  };

  const handleFinalSubmit = async () => {
    if (!paymentMethod) {
      message.error('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare FormData for file uploads
      const formData = new FormData();
      
      // Add customer and purchase info
      const values = form.getFieldsValue();
      const purchaseData = {
        ...values,
        customer_id: selectedCustomer.customer_id,
        products: products,
        payment_method: paymentMethod,
        reference: values.reference === 'other' ? values.other_reference : values.reference,
        reference_person: values.reference_person,
        barcode: generateBarcode()
      };
      
      // Append JSON data
      formData.append('data', JSON.stringify(purchaseData));
      
      // Append files if they exist
      if (fileListBill[0]?.originFileObj) {
        formData.append('bill_copy', fileListBill[0].originFileObj);
      }
      
      if (fileListOrnament[0]?.originFileObj) {
        formData.append('ornament_photo', fileListOrnament[0].originFileObj);
      } else if (capturedImage) {
        // Convert captured image to blob
        const blob = await fetch(capturedImage).then(r => r.blob());
        formData.append('ornament_photo', blob, 'ornament.jpg');
      }
      
      // Call API to create purchase
      const response = await createPurchase(formData);
      
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Purchase Recorded',
          text: 'Purchase has been recorded successfully',
          confirmButtonColor: roots.teal[500]
        });
        
        // Update local state
        const newPurchase = response.data;
        setPurchases([...purchases, newPurchase]);
        setBarcode(newPurchase.barcode);
        
        // Reset form
        handleCancel();
        setShowPaymentModal(false);
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
    if (products.length === 0) {
      message.error('Please add at least one product');
      return;
    }
    
    const totalAmount = products.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0);
    
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
      const response = await getPurchaseById(record.purchase_id);
      const purchase = response.data;
      
      const customer = customers.find(c => c.customer_id === purchase.customer_id);
      if (customer) {
        setSelectedCustomer(customer);
        setIsModalVisible(true);
        
        form.setFieldsValue({
          ...purchase,
          customer_id: purchase.customer_id,
          customer_name: customer.customer_name,
          aadhar_no: customer.aadhar_no,
          pan_no: customer.pan_no,
          reference: purchase.reference === 'sales_executive' || purchase.reference === 'manager' ? 
            purchase.reference : 'other',
          other_reference: purchase.reference,
          reference_person: purchase.reference_person
        });
        
        // Set products
        setProducts(purchase.products || []);
        
        // Set files
        if (purchase.bill_copy) {
          setFileListBill([{
            uid: '-1',
            name: 'bill.jpg',
            status: 'done',
            url: purchase.bill_copy
          }]);
        }
        
        if (purchase.ornament_photo) {
          setFileListOrnament([{
            uid: '-2',
            name: 'ornament.jpg',
            status: 'done',
            url: purchase.ornament_photo
          }]);
        }
        
        // Set reference states
        setShowOtherReference(purchase.reference === 'other');
        setShowReferencePerson(
          purchase.reference === 'sales_executive' || purchase.reference === 'manager'
        );
      } else {
        message.error('Customer not found for this purchase');
      }
    } catch (error) {
      message.error('Failed to load purchase details');
      console.error('Error loading purchase:', error);
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
        
        // Refresh purchases list
        const response = await getPurchases();
        setPurchases(response.data || []);
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

  // Render product form for each product
  const renderProductForm = (product) => {
    const marginRange = getMarginRange();
    
    return (
      <Card 
        key={product.key} 
        style={{ marginBottom: 16, borderLeft: `4px solid ${roots.gold[400]}` }}
        title={`Product ${products.findIndex(p => p.key === product.key) + 1}`}
        extra={
          products.length > 1 && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => removeProduct(product.key)}
              danger
            />
          )
        }
      >
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
                  <Option key={metal.metal_id} value={metal.name}>{metal.name}</Option>
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
                {productOptions.map(prod => (
                  <Option key={prod.product_id} value={prod.name}>{prod.name}</Option>
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
                {(subProductOptions[product.product] || []).map(subProd => (
                  <Option key={subProd.sub_product_id} value={subProd.name}>{subProd.name}</Option>
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
                disabled={marginRange.min === marginRange.max}
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

  const purchaseColumns = [
    {
      title: 'Purchase ID',
      dataIndex: 'purchase_id',
      key: 'purchase_id',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BarcodeOutlined style={{ marginRight: 8, color: roots.gold[500] }} />
          {text}
        </div>
      )
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
      title: 'Weight (g)',
      key: 'weight',
      width: 120,
      render: (_, record) => (
        <div>
          <div>Gross: {record.gross_weight}</div>
          <div>Net: {record.net_weight}</div>
        </div>
      )
    },
    {
      title: 'Rate & Amount',
      key: 'rate_amount',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Rate: ₹{record.rate}/g</div>
          <div>Amount: ₹{record.amount}</div>
        </div>
      )
    },
    {
      title: 'Payment',
      key: 'payment',
      width: 120,
      render: (_, record) => (
        <Tag color={record.payment_method === 'cash' ? 'green' : 'geekblue'}>
          {record.payment_method === 'cash' ? 'Cash' : 'Bank Transfer'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditPurchase(record)}
          />
          <Popconfirm
            title="Are you sure to delete this purchase?"
            onConfirm={() => handleDeletePurchase(record.purchase_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
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
      render: (_,record) => (
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
      dataIndex: 'amount',
      key: 'amount',
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCustomerModal}
            className="add-button"
          >
            Select Customer
          </Button>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={showQuotationModal}
            className="add-button"
          >
            Select Quotation
          </Button>
        </Space>
      )}

      {/* Purchase Filters */}
      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search purchases..."
              prefix={<SearchOutlined />}
              onChange={(e) => setPurchaseFilters({ ...purchaseFilters, search: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Metal"
              onChange={(value) => setPurchaseFilters({ ...purchaseFilters, metal: value })}
              allowClear
              style={{ width: '100%' }}
            >
              {metals.map(metal => (
                <Option key={metal.metal_id} value={metal.name}>{metal.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={resetPurchaseFilters}
                style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
              >
                Reset Filters
              </Button>
              <Button
                icon={<DownloadOutlined />}
                type="primary"
                style={{ background: roots.green[500], borderColor: roots.green[500] }}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
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
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>₹{getTotalPurchases().toFixed(2)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Spin>

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
          
          {products.map(renderProductForm)}
          
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
              Total Amount: ₹{products.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0).toFixed(2)}
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
                  onChange={handleReferenceChange}
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
            {showReferencePerson && (
              <Col span={12}>
                <Form.Item
                  label="Reference Person"
                  name="reference_person"
                  rules={[{ required: true, message: 'Please select reference person!' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {referencePersons.map(person => (
                      <Option key={person.staff_id} value={person.staff_id}>
                        {person.name} ({person.designation})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            {showOtherReference && (
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
                {capturedImage && (
                  <Image
                    src={capturedImage}
                    width={100}
                    style={{ marginTop: 8 }}
                  />
                )}
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

      {/* Payment Method Modal */}
      <Modal
        title="Select Payment Method"
        visible={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        width={500}
      >
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
                    <span>Cash Payment</span>
                  </Space>
                </Radio>
                <Radio value="bank_transfer" style={{ display: 'block' }}>
                  <Space>
                    <BankOutlined style={{ fontSize: 24 }} />
                    <span>Bank Transfer</span>
                  </Space>
                </Radio>
              </Radio.Group>
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
                <Radio value="partial_bank" style={{ display: 'block', marginBottom: 16 }}>
                  <Space>
                    <BankOutlined style={{ fontSize: 24 }} />
                    <span>Partial Bank Transfer</span>
                  </Space>
                </Radio>
                <Radio value="partial_both" style={{ display: 'block' }}>
                  <Space>
                    <BankOutlined style={{ fontSize: 24 }} />
                    <MoneyCollectOutlined style={{ fontSize: 24 }} />
                    <span>Both (Cash + Bank)</span>
                  </Space>
                </Radio>
              </Radio.Group>
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

      {/* Quotation Selection Modal */}
      <Modal
        title="Select Quotation"
        visible={isQuotationModalVisible}
        onCancel={handleQuotationCancel}
        footer={null}
        width={1000}
      >
        <Card className="filter-card" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="Search quotations..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleQuotationSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by Status"
                onChange={handleQuotationStatusFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="active">Active</Option>
                <Option value="expired">Expired</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetQuotationFilters}
                  style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                >
                  Reset Filters
                </Button>
                <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>
                  {filteredQuotations.length} quotations found
                </Tag>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          columns={quotationColumns}
          dataSource={filteredQuotations}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          scroll={{ x: 1000 }}
          rowKey="quotation_id"
          size="middle"
        />
      </Modal>

      {/* Barcode Display Modal */}
      <Modal
        title="Purchase Barcode"
        visible={!!barcode}
        onCancel={() => setBarcode('')}
        footer={null}
        width={400}
      >
        <div className="barcode-container">
          <Barcode value={barcode} format="CODE128" />
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => message.success('Barcode downloaded successfully!')}
          >
            Download Barcode
          </Button>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default Purchase;