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
  Descriptions,
  Divider,
  Radio,
  InputNumber,
  Image,
  Badge,
  Statistic,
  Steps,
  Spin,
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
  FilePdfOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  generateQuotationPDF,
  getMCXRates,
  requestMarginApproval,
  approveMarginChange,
  rejectMarginChange,
  getPendingApprovals,
  getApprovalHistory,
} from '../../api/services/quatationService';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import Webcam from "react-webcam";
import pledgeService from '../../api/services/pledgeService';
import {
  getCustomers,
} from '../../api/services/customerServices';
import { getMetals } from '../../api/services/metalService';
import { getProducts, getAllProducts } from '../../api/services/productService';
import { getSubProducts, getAllSubProducts } from '../../api/services/subProductServices';
import Swal from 'sweetalert2';

const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;
const referenceOptions = [
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'sales_executive', label: 'Sales Executive' },
  { value: 'manager', label: 'Manager' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' }
];

const PledgeItems = () => {
  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fileListBill, setFileListBill] = useState([]);
  const [fileListOrnament, setFileListOrnament] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showOtherReference, setShowOtherReference] = useState(false);
  const [showReferencePerson, setShowReferencePerson] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [subProducts, setSubProducts] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamType, setWebcamType] = useState(''); // 'bill' or 'ornament'
  const [capturedImage, setCapturedImage] = useState('');
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [liveGoldRate, setLiveGoldRate] = useState(0.0);
  const [pledgeFilters, setPledgeFilters] = useState({
    search: '',
    metal: '',
    status: '',
    dateRange: []
  });
  const [filteredPledges, setFilteredPledges] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [productDetailsVisible, setProductDetailsVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [productFields, setProductFields] = useState([{
    id: 1,
    metal: '',
    product: '',
    sub_product: ''
  }]);
  const [metalOptions, setMetalOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [subProductOptions, setSubProductOptions] = useState({});
  const [mcxRates, setMcxRates] = useState({});

  // Camera capture states
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState(null); // 'bill' or 'ornament'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const webcamRef = useRef(null);

  const [filters, setFilters] = useState({
    search: '',
    state: ''
  });

  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);

  // Camera capture functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'environment' // Use rear camera if available
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      message.error('Cannot access camera. Please check permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `${currentCaptureType}-capture-${timestamp}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Create file object for upload
          const capturedFile = {
            uid: `capture-${timestamp}`,
            name: `${currentCaptureType}-capture-${timestamp}.jpg`,
            status: 'done',
            originFileObj: file,
            preview: URL.createObjectURL(blob)
          };

          // Update the appropriate file list
          switch (currentCaptureType) {
            case 'bill':
              setFileListBill([capturedFile]);
              message.success('Bill copy captured successfully!');
              break;
            case 'ornament':
              setFileListOrnament([capturedFile]);
              setCapturedImage(URL.createObjectURL(blob));
              message.success('Ornament photo captured successfully!');
              break;
            default:
              break;
          }

          closeCameraModal();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const openCameraModal = (type) => {
    setCurrentCaptureType(type);
    setIsCameraModalVisible(true);
  };

  const closeCameraModal = () => {
    stopCamera();
    setIsCameraModalVisible(false);
    setCurrentCaptureType(null);
  };

  const fetchManagers = async () => {
    try {
      setLoadingManagers(true);
      const response = await pledgeService.getAllUpdateManager();
      console.log('Full API Response:', response);
      setManagers(response);
    } catch (error) {
      console.error('Error fetching managers:', error);
      message.error('Failed to load managers');
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const showProductDetails = (products) => {
    setSelectedProducts(products);
    setProductDetailsVisible(true);
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
    fetchCustomers(pagination.current, pagination.pageSize);
  };

  const fetchCustomers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getCustomers(page, pageSize);

      if (!response) {
        throw new Error('No response received');
      }

      const customersData = response.customers || response.data?.customers || [];
      const paginationData = response.pagination || response.data?.pagination || {};

      setCustomers(customersData);
      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || pageSize,
        total: paginationData.total || 0,
      });

    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error(error.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPledges = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await pledgeService.getAllPledges(page, pageSize);
      const pledgesData = response.data || [];
      const paginationData = {
        current: response.page || page,
        pageSize: response.limit || pageSize,
        total: response.total || 0,
      };

      const transformedPledges = pledgesData.map(pledge => ({
        key: pledge.id,
        pledge_id: pledge.pledge_id,
        date: new Date(pledge.created_at).toLocaleDateString(),
        customer_name: pledge.customer_data?.customer_name,
        customer_id: pledge.customer_id,
        metal: pledge.product_details?.[0]?.metal || 'Multiple',
        purity: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.purity) || 0), 0),
        product: pledge.product_details?.[0]?.product || 'Multiple',
        sub_product: pledge.product_details?.[0]?.sub_product || 'Multiple',
        gross_weight: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0),
        net_weight: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.net_weight) || 0), 0),
        amount: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
        pledge_amount: pledge.pledge_amount,
        approval: pledge.approval,
        bill_copy: pledge.bill,
        ornament_photo: pledge.ornament_photo,
        products: pledge.product_details || [],
        interest_rate: pledge.interest_rate,
        current_interest: pledge.current_interest,
        total_payment: pledge.total_payment,
        remarks: pledge.remarks,
        user_data: pledge.user_data
      }));

      setPledges(transformedPledges);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching pledges:', error);
      message.error('Failed to fetch pledges');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetalOptions = async () => {
    try {
      const response = await getMetals();
      setMetalOptions(response.metals.map(metal => ({
        id: metal.id,
        name: metal.metalname,
        code: metal.metal_code
      })));
    } catch (error) {
      message.error('Failed to fetch metal options');
    }
  };

  const fetchProductOptions = async () => {
    try {
      const response = await getAllProducts();
      setProductOptions(response.products.map(product => ({
        id: product.id,
        name: product.product_name,
        code: product.product_code,
        metalId: product.metal_id
      })));
    } catch (error) {
      message.error('Failed to fetch product options');
    }
  };

  const fetchSubProductOptions = async (productId) => {
    try {
      const response = await getAllSubProducts();
      const subs = response.subProducts.filter(sub => sub.product_id === productId);

      setSubProductOptions(prev => ({
        ...prev,
        [productId]: subs.map(sub => ({
          id: sub.id,
          name: sub.sub_product_name,
          code: sub.sub_product_code
        }))
      }));

      return subs;
    } catch (error) {
      message.error('Failed to fetch sub product options');
      return [];
    }
  };

  const fetchMCXRates = async () => {
    try {
      setLoading(true);
      const response = await getMCXRates();

      if (Array.isArray(response) && response.length > 0) {
        const goldRate = response[0].rate || 0;
        setLiveGoldRate(goldRate);

        const rates = {};
        response.forEach(item => {
          rates[item.metal] = item.rate;
        });

        setMcxRates(rates);
        message.success("MCX rates updated successfully!");

        const currentProducts = form.getFieldValue('products') || [];
        if (currentProducts.length > 0) {
          const updatedProducts = currentProducts.map(product => {
            const metalId = product.metal;
            if (metalId) {
              const metal = metalOptions.find(m => m.id === metalId);
              if (metal && rates[metal.code]) {
                return {
                  ...product,
                  rate: rates[metal.code]
                };
              }
            }
            return product;
          });

          form.setFieldsValue({ products: updatedProducts });
        }
      } else {
        message.error("No rate data available");
        setLiveGoldRate(0);
        setMcxRates({});
      }
    } catch (error) {
      console.error("Error fetching MCX rates:", error);
      message.error("Failed to fetch MCX rates");
      setLiveGoldRate(0);
      setMcxRates({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMCXRates()
    fetchCustomers(1, 10);
    fetchPledges();
    fetchManagers();
    fetchMetalOptions();
    fetchProductOptions();
  }, []);

  useEffect(() => {
    console.log('Current managers state:', managers);
  }, [managers]);

  useEffect(() => {
    applyCustomerFilters();
  }, [filters, customers]);

  useEffect(() => {
    applyPledgeFilters();
  }, [pledgeFilters, pledges]);

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

  const applyPledgeFilters = () => {
    let filtered = [...pledges];

    if (pledgeFilters.search) {
      const searchTerm = pledgeFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.pledge_id?.toLowerCase().includes(searchTerm)
      );
    }

    if (pledgeFilters.metal) {
      filtered = filtered.filter(item =>
        item.metal?.toLowerCase() === pledgeFilters.metal.toLowerCase()
      );
    }

    if (pledgeFilters.status) {
      filtered = filtered.filter(item =>
        item.status?.toLowerCase() === pledgeFilters.status.toLowerCase()
      );
    }

    if (pledgeFilters.dateRange && pledgeFilters.dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const pledgeDate = new Date(item.date);
        return pledgeDate >= pledgeFilters.dateRange[0] &&
          pledgeDate <= pledgeFilters.dateRange[1];
      });
    }

    setFilteredPledges(filtered);
  };

  const handleCustomerSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleStateFilter = (value) => {
    setFilters(prev => ({ ...prev, state: value }));
  };

  const resetCustomerFilters = () => {
    setFilters({ search: '', state: '' });
  };

  const showCustomerModal = () => {
    setIsCustomerModalVisible(true);
  };

  const handleReferenceChange = (value) => {
    setShowOtherReference(value === 'other');
    setShowReferencePerson(value === 'sales_executive' || value === 'manager');
    form.setFieldsValue({
      reference_person: undefined,
      other_reference: undefined
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileListBill([]);
    setFileListOrnament([]);
    setShowWebcam(false);
    setWebcamType('');
    setCurrentStep(0);
    setOtpSent(false);
    setOtpVerified(false);
    setCapturedImage('');
  };

  const handleMetalChange = (value, fieldIndex) => {
    const metal = metalOptions.find(m => m.id === value);
    if (metal && mcxRates[metal.code]) {
      const metalRate = mcxRates[metal.code];

      form.setFieldsValue({
        products: form.getFieldValue('products').map((p, idx) => {
          if (idx === fieldIndex) {
            return {
              ...p,
              rate: metalRate
            };
          }
          return p;
        })
      });
      calculateValues(fieldIndex);
    }
  };

  const handleCustomerCancel = () => {
    setIsCustomerModalVisible(false);
  };

  const selectCustomer = (record) => {
    setSelectedCustomer(record);
    console.log('Selected customer:', record);
    setIsCustomerModalVisible(false);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      customer_id: record.customer_id,
      customer_name: record.customer_name,
      adhar_number: record.aadhar_no,
      pan_number: record.pan_no,
      phone_number: record.phoneno,
      interest_rate: 2,
    });
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setIsModalVisible(false);
    setCurrentStep(0);
    setOtpSent(false);
    setOtpVerified(false);
  };

  const handleUpload = (file, fileList, setFileList) => {
    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
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

  const handleProductChange = async (value, fieldIndex) => {
    const subs = await fetchSubProductOptions(value);

    const currentProducts = form.getFieldValue('products') || [];
    const updatedProducts = currentProducts.map((product, idx) => {
      if (idx === fieldIndex) {
        return {
          ...product,
          product: value,
        };
      }
      return product;
    });

    form.setFieldsValue({ products: updatedProducts });
  };

  const calculateValues = () => {
    const values = form.getFieldsValue();
    const products = values.products || {};
    const interestAmount = parseFloat(values.interest_amount) || 0;
    const pledgeAmount = parseFloat(values.pledge_amount) || 0;



    // let totalPledgeAmount = 0;
    let totalOrnamentAmount = 0;

    Object.keys(products).forEach((key) => {
      const productValues = products[key] || {};
      const grossWeight = productValues.gross_weight || 0;
      const dustWeight = productValues.dust_weight || 0;
      const stoneWeight = productValues.stone_weight || 0;
      const rate = productValues.rate || 0;

      const purity = productValues.purity || 0;

      const netWeight = grossWeight - dustWeight - stoneWeight;
      const amount = (netWeight * rate) * (purity / 100);
      // const pledgeAmount = amount;

      totalOrnamentAmount += amount;
      // totalPledgeAmount += amount;

      products[key] = {
        ...productValues,
        purity: parseFloat(purity).toFixed(2),
        net_weight: netWeight.toFixed(3),
        amount: amount.toFixed(2),
      };
    });

    const totalPayment = pledgeAmount + interestAmount;

    form.setFieldsValue({
      products,
      ornament_amount: totalOrnamentAmount.toFixed(2),
      // pledge_amount: totalPledgeAmount.toFixed(2),
      interest_amount: interestAmount.toFixed(2),
      current_interest: interestAmount.toFixed(2),
      total_payment: totalPayment.toFixed(2),
    });
  };

  const sendOtp = () => {
    setSendingOtp(true);
    setTimeout(() => {
      setSendingOtp(false);
      setOtpSent(true);
      message.success('OTP sent to registered mobile number');
      setCurrentStep(1);
    }, 1500);
  };

  const verifyOtp = () => {
    const otp = form.getFieldValue('otp');
    if (!otp || otp.length !== 6) {
      message.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    setTimeout(() => {
      setVerifyingOtp(false);
      if (otp === '123456') {
        setOtpVerified(true);
        message.success('Aadhar OTP verified successfully');
        setCurrentStep(2);
      } else {
        message.error('Invalid OTP. Please try again.');
      }
    }, 1500);
  };

  const handleFinalSubmit = async () => {
    try {
      const values = await form.validateFields();

      const step1Data = {
        customer_id: selectedCustomer.customer_id,
        adhar_number: values.aadhar_number || selectedCustomer.aadhar_no,
        pan_number: values.pan_number || selectedCustomer.pan_no,
        phone_number: values.phone_number || selectedCustomer.phoneno,
        role_id: localStorage.getItem("userRoleId"),
        created_user: localStorage.getItem("userId")
      };

      if (
        !values.products ||
        (Array.isArray(values.products) && values.products.length === 0) ||
        (typeof values.products === "object" && Object.keys(values.products).length === 0)
      ) {
        console.log("Invalid Products Triggered 🚨");
        Swal.fire({
          icon: "error",
          title: "Invalid Products",
          text: "Please add at least one product before submitting!",
        });
        return;
      }





      const formData = new FormData();
      formData.append('product_details', JSON.stringify(values.products));
      formData.append('interest_rate', values.interest_rate);
      formData.append('pledge_amount', values.pledge_amount);
      formData.append('current_interest', values.current_interest);
      formData.append('total_payment', values.total_payment);
      formData.append('remarks', values.remarks || '');

      if (fileListBill.length > 0 && fileListBill[0].originFileObj) {
        formData.append('bill', fileListBill[0].originFileObj);
      }

      if (fileListOrnament.length > 0 && fileListOrnament[0].originFileObj) {
        formData.append('ornament_photo', fileListOrnament[0].originFileObj);
      }

      const createdPledge = await pledgeService.createPledge(step1Data);
      await pledgeService.updatePledge(createdPledge.id, formData);

      fetchPledges();
      message.success('Pledge created successfully!');
      handleCancel();
    } catch (error) {
      console.error('Error:', error);
      message.error(error.response?.data?.message || 'Failed to create pledge');
    }
  };

  const onFinish = (values) => {
    handleFinalSubmit();
  };

  const uploadProps = (fileList, setFileList) => ({
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      handleUpload(file, fileList, setFileList);
      return false;
    },
    fileList,
    listType: "picture-card",
    onPreview: handlePreview,
    accept: "image/*",
    maxCount: 1
  });

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style>{`
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
        .pledge-table {
          margin-top: 24px;
        }
        .steps-container {
          margin-bottom: 24px;
        }
        .otp-section {
          margin: 16px 0;
          padding: 16px;
          background: ${roots.ebony[50]};
          border-radius: 8px;
        }
        .camera-container {
          position: relative;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }
        .camera-video {
          width: 100%;
          border-radius: 8px;
          background: #000;
        }
        .camera-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid #fff;
          border-radius: 8px;
          pointer-events: none;
        }
        .camera-controls {
          margin-top: 16px;
          text-align: center;
        }
        .capture-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${roots.status.error.main};
          border: 4px solid #fff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .upload-actions {
          margin-top: 8px;
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .ornament-preview {
          text-align: center;
          margin-top: 8px;
        }
        .ornament-preview-image {
          max-width: 100px;
          max-height: 100px;
          border-radius: 8px;
          border: 1px solid ${roots.ebony[200]};
        }
      `}</style>

      {/* Customer Selection */}
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
                Change Customer
              </Button>
            </Col>
          </Row>
        </Card>
      ) : (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCustomerModal}
          className="add-button"
          style={{ marginBottom: 16 }}
        >
          Select Customer
        </Button>
      )}

      {/* Pledge Filters */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Search by customer or pledge ID"
              prefix={<SearchOutlined />}
              value={pledgeFilters.search}
              onChange={(e) => setPledgeFilters(prev => ({ ...prev, search: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by metal"
              style={{ width: '100%' }}
              value={pledgeFilters.metal}
              onChange={(value) => setPledgeFilters(prev => ({ ...prev, metal: value }))}
              allowClear
            >
              {metalOptions.map(metal => (
                <Option key={metal} value={metal}>{metal}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={pledgeFilters.status}
              onChange={(value) => setPledgeFilters(prev => ({ ...prev, status: value }))}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="closed">Closed</Option>
              <Option value="pending_approval">Pending Approval</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
            >
              Reset Filters
            </Button>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Statistic
              title="Total Pledges"
              value={filteredPledges.length}
              prefix={<FilePdfOutlined />}
              valueStyle={{ color: roots.gold[500] }}
            />
          </Col>
        </Row>
      </Card>

      {/* Pledge Table */}
      <div className="pledge-table">
        <Table
          columns={[
            {
              title: 'Pledge ID',
              dataIndex: 'pledge_id',
              key: 'pledge_id',
              width: 150,
              render: (text) => <Tag color="blue">{text}</Tag>
            },
            {
              title: 'Date',
              dataIndex: 'date',
              key: 'date',
              width: 100,
              sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
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
                <div
                  onClick={() => showProductDetails(record.products)}
                  style={{ cursor: 'pointer', padding: '8px' }}
                >
                  {record.products.length === 1 ? (
                    <>
                      <div><Text strong>{record.products[0].metal}</Text></div>
                      <div> {record.products[0].sub_product}</div>
                    </>
                  ) : (
                    <>
                      <div><Text strong>Multiple Metals</Text></div>
                      <div>{record.products.length} items (click to view)</div>
                    </>
                  )}
                </div>
              )
            },
            {
              title: 'Weight (g)',
              key: 'weight',
              width: 120,
              render: (_, record) => (
                <div>
                  <div>Gross: {record.gross_weight.toFixed(3)}</div>
                  <div>Net: {record.net_weight.toFixed(3)}</div>
                </div>
              )
            },
            {
              title: 'Amounts',
              key: 'amounts',
              width: 180,
              render: (_, record) => (
                <div>
                  <div>Amount: ₹{record.amount.toFixed(2)}</div>
                  <div>Pledge: ₹{record.total_payment}</div>
                </div>
              )
            },
            {
              title: 'Status',
              key: 'status',
              width: 120,
              render: (_, record) => {
                let color, text;
                switch (record.approval) {
                  case '1':
                    color = 'blue';
                    text = 'Not Assigned';
                    break;
                  case '2':
                    color = 'orange';
                    text = 'Assigned';
                    break;
                  case '3':
                    color = 'green';
                    text = 'Approved';
                    break;
                  case '4':
                    color = 'red';
                    text = 'Rejected';
                    break;
                  case '5':
                    color = 'gray';
                    text = 'Processing';
                    break;
                  default:
                    color = 'gray';
                    text = 'Processing';
                }
                return <Tag color={color}>{text}</Tag>;
              }
            },
          ]}
          dataSource={filteredPledges}
          scroll={{ x: 1500 }}
          rowKey="key"
          bordered
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              fetchPledges(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              fetchPledges(current, size);
            }
          }}
        />
      </div>

      {/* Customer Selection Modal */}
      <Modal
        title="Select Customer"
        open={isCustomerModalVisible}
        onCancel={handleCustomerCancel}
        footer={null}
        width={1000}
      >
        <Card className="filter-card">
          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="Search by name, ID, Aadhar or PAN"
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Filter by state"
                style={{ width: '100%' }}
                value={filters.state}
                onChange={handleStateFilter}
                allowClear
              >
                {statesList.map(state => (
                  <Option key={state} value={state}>{state}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={resetCustomerFilters}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card>
        <Table
          columns={[
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
              render: (photo) => (
                <Avatar
                  src={photo}
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
          ]}
          dataSource={filteredCustomers}
          scroll={{ x: 800 }}
          rowKey="id"
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
          }}
          onChange={handleTableChange}
        />
      </Modal>

      {/* Pledge Modal */}
      <Modal
        title={`Pledge - ${selectedCustomer?.customer_name || ''}`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div className="steps-container">
          <Steps current={currentStep}>
            <Step title="Customer Info" />
            <Step title="Aadhar Verification" />
            <Step title="Pledge Details" />
          </Steps>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            products: [],
          }}
        >
          {/* Always show customer info at the top */}
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

          {currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Aadhar Number"
                    name="adhar_number"
                    rules={[
                      { required: true, message: 'Please input Aadhar number!' },
                      { len: 12, message: 'Aadhar must be 12 digits!' }
                    ]}
                  >
                    <Input maxLength={12} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="PAN Number"
                    name="pan_number"
                    rules={[
                      { required: true, message: 'Please input PAN number!' }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Phone Number"
                    name="phone_number"
                    rules={[
                      { required: true, message: 'Please input phone number!' },
                      { len: 10, message: 'Phone must be 10 digits!' }
                    ]}
                  >
                    <Input maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={() => setCurrentStep(1)}>
                  Next: Aadhar Verification
                </Button>
              </Form.Item>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="otp-section">
                <Alert
                  message="Aadhar Verification Required"
                  description="Please verify the customer's Aadhar details by sending OTP to their registered mobile number."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {!otpSent ? (
                  <div>
                    <Button
                      type="primary"
                      onClick={sendOtp}
                      loading={sendingOtp}
                    >
                      Send OTP to Registered Mobile
                    </Button>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      OTP will be sent to the mobile number linked with Aadhar
                    </Text>
                  </div>
                ) : (
                  <div>
                    <Form.Item
                      label="Enter OTP"
                      name="otp"
                      rules={[
                        { required: true, message: 'Please enter OTP!' },
                        { len: 6, message: 'OTP must be 6 digits!' }
                      ]}
                    >
                      <Input maxLength={6} />
                    </Form.Item>

                    <Space>
                      <Button
                        type="primary"
                        onClick={verifyOtp}
                        loading={verifyingOtp}
                        disabled={otpVerified}
                      >
                        {otpVerified ? 'Verified' : 'Verify OTP'}
                      </Button>
                      {otpVerified && <CheckOutlined style={{ color: roots.status.success.main, fontSize: 18 }} />}
                    </Space>
                  </div>
                )}
              </div>

              <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(2)}
                    disabled={!otpVerified}
                  >
                    Next: Pledge Details
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Bill Copy Section with Camera Capture */}
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
                <div className="upload-actions">
                  <Button
                    icon={<CameraOutlined />}
                    onClick={() => openCameraModal('bill')}
                    type="primary"
                  >
                    Capture Bill
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => document.querySelector('.ant-upload input[type="file"]')?.click()}
                  >
                    Upload File
                  </Button>
                </div>
              </div>

              {/* Ornament Photo Section with Camera Capture */}
              <div className="upload-section">
                <div className="upload-section-title">Ornament Photo</div>
                <Upload {...uploadProps(fileListOrnament, setFileListOrnament)}>
                  {fileListOrnament.length >= 1 ? null : (
                    <div>
                      <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                      <div style={{ marginTop: 8 }}>Upload Ornament Photo</div>
                    </div>
                  )}
                </Upload>
                <div className="upload-actions">
                  <Button
                    icon={<CameraOutlined />}
                    onClick={() => openCameraModal('ornament')}
                    type="primary"
                  >
                    Capture Ornament
                  </Button>
                  <Button
                    icon={<UploadOutlined />}
                    onClick={() => document.querySelector('.ant-upload input[type="file"]')?.click()}
                  >
                    Upload File
                  </Button>
                </div>
                {capturedImage && (
                  <div className="ornament-preview">
                    <Image
                      src={capturedImage}
                      width={100}
                      className="ornament-preview-image"
                      preview={false}
                    />
                  </div>
                )}
              </div>

              <Divider orientation="left">Product Details</Divider>

              <Form.List name="products">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="product-field" style={{ marginBottom: 16, position: 'relative' }}>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => remove(name)}
                            style={{ position: 'absolute', right: 0, top: 0 }}
                          />
                        )}

                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Metal"
                              name={[name, 'metal']}
                              rules={[{ required: true, message: 'Please select metal!' }]}
                            >
                              <Select
                                onChange={(value) => handleMetalChange(value, name)}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                              >
                                {metalOptions.map(metal => (
                                  <Option key={metal.id} value={metal.id}>{metal.name}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Purity (%)"
                              name={[name, 'purity']}
                              rules={[{ required: true, message: 'Please input purity percentage!' }]}
                            >
                              <InputNumber
                                min={0}
                                max={100}
                                precision={2}
                                style={{ width: '100%' }}
                                onChange={() => calculateValues(name)}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Product"
                              name={[name, 'product']}
                              rules={[{ required: true, message: 'Please select product!' }]}
                            >
                              <Select
                                onChange={(value) => handleProductChange(value, name)}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                              >
                                {productOptions.map(product => (
                                  <Option key={product.id} value={product.id}>{product.name}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Sub Product"
                              name={[name, 'sub_product']}
                              rules={[{ required: true, message: 'Please select sub product!' }]}
                            >
                              <Select
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                              >
                                {subProductOptions[form.getFieldValue(['products', name, 'product'])]?.map(subProduct => (
                                  <Option key={subProduct.name} value={subProduct.name}>
                                    {subProduct.name}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Gross Weight (g)"
                              name={[name, 'gross_weight']}
                              rules={[{ required: true, message: 'Please input gross weight!' }]}
                            >
                              <InputNumber
                                min={0}
                                step={0.001}
                                precision={3}
                                style={{ width: '100%' }}
                                onChange={() => calculateValues(name)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Dust Weight (g)"
                              name={[name, 'dust_weight']}
                              rules={[{ required: true, message: 'Please input dust weight!' }]}
                            >
                              <InputNumber
                                min={0}
                                step={0.001}
                                precision={3}
                                style={{ width: '100%' }}
                                onChange={() => calculateValues(name)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Stone Weight (g)"
                              name={[name, 'stone_weight']}
                              rules={[{ required: true, message: 'Please input stone weight!' }]}
                            >
                              <InputNumber
                                min={0}
                                step={0.001}
                                precision={3}
                                style={{ width: '100%' }}
                                onChange={() => calculateValues(name)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Net Weight (g)"
                              name={[name, 'net_weight']}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Rate (₹/g)"
                              name={[name, 'rate']}
                              rules={[{ required: true, message: 'Please input rate!' }]}
                            >
                              <InputNumber
                                min={0}
                                step={1}
                                precision={2}
                                style={{ width: '100%' }}
                                onChange={() => calculateValues(name)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Amount (₹)"
                              name={[name, 'amount']}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}

                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => {
                          console.log(liveGoldRate)
                          add({
                            metal: '',
                            product: '',
                            sub_product: '',
                            gross_weight: 0,
                            dust_weight: 0,
                            stone_weight: 0,
                            net_weight: 0,
                            rate: liveGoldRate || 0,
                            amount: 0
                          });
                        }}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add Product
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={fetchMCXRates}
                style={{ marginRight: 12, marginBottom: 10 }}
              >
                Refresh Rates
              </Button>

              <Text strong style={{ fontSize: 16, lineHeight: '32px' }}>
                Live Gold Rate: ₹{liveGoldRate != null ? new Intl.NumberFormat('en-IN').format(liveGoldRate) : '—'}
              </Text>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Total Ornament Amount (₹)"
                    name="ornament_amount"
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      formatter={(value) =>
                        `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                      readOnly
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Interest Amount (₹)"
                    name="interest_amount"
                    rules={[{ required: true, message: 'Please input interest amount!' }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      formatter={(value) =>
                        `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                      onChange={() => calculateValues()}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Pledge Amount (₹)" name="pledge_amount"
                    rules={[{ required: true, message: 'Please input pledge amount!' }]}>
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={(value) =>
                        `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                      onChange={() => calculateValues()}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Total Amount (₹)"
                    name="total_payment"
                  // rules={[{ required: true, message: 'Please input interest amount!' }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      formatter={(value) =>
                        `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      parser={(value) => value.replace(/₹\s?|(,*)/g, '')}
                      readOnly
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Remarks"
                name="remarks"
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item style={{ marginTop: '32px', textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Back
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
                    Wait for Approval
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Camera Capture Modal */}
      <Modal
        title={`Capture ${currentCaptureType === 'bill' ? 'Bill Copy' : 'Ornament Photo'}`}
        open={isCameraModalVisible}
        onCancel={closeCameraModal}
        onOk={captureImage}
        okText="Capture"
        cancelText="Cancel"
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => startCamera(), 100);
          } else {
            stopCamera();
          }
        }}
        width={600}
      >
        <div className="camera-container">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            playsInline
          />
          <div className="camera-overlay" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <div className="camera-controls">
          <Button
            type="primary"
            shape="circle"
            size="large"
            className="capture-button"
            onClick={captureImage}
          >
            <CameraOutlined style={{ fontSize: '24px' }} />
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px', color: roots.text.secondary }}>
          Position the {currentCaptureType === 'bill' ? 'bill document' : 'ornament'} clearly in the frame and click the capture button
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

      <Modal
        title="Product Details"
        visible={productDetailsVisible}
        onCancel={() => setProductDetailsVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          columns={[
            {
              title: 'Metal',
              dataIndex: 'metal',
              key: 'metal',
              width: 100,
            },
            {
              title: 'Sub Product',
              dataIndex: 'sub_product',
              key: 'sub_product',
              width: 120,
            },
            {
              title: 'Gross Weight (g)',
              dataIndex: 'gross_weight',
              key: 'gross_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Dust Weight (g)',
              dataIndex: 'dust_weight',
              key: 'dust_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Stone Weight (g)',
              dataIndex: 'stone_weight',
              key: 'stone_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Net Weight (g)',
              dataIndex: 'net_weight',
              key: 'net_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Purity (%)',
              dataIndex: 'purity',
              key: 'purity',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Rate (₹/g)',
              dataIndex: 'rate',
              key: 'rate',
              width: 100,
              render: (value) => `₹${parseFloat(value).toFixed(2)}`,
            },
            {
              title: 'Amount (₹)',
              dataIndex: 'amount',
              key: 'amount',
              width: 120,
              render: (value) => `₹${parseFloat(value).toFixed(2)}`,
            },
          ]}
          dataSource={selectedProducts}
          rowKey={(record) => `${record.metal}-${record.product}-${record.sub_product}`}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default PledgeItems;