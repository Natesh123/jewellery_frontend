import React, { useState, useEffect, useRef } from 'react';
import { 
  Form, Input, Button, Select, Table, Space, Popconfirm, 
  message, Modal, Card, Row, Col, Typography, Tag,
  Upload, Avatar, Descriptions, Divider, Spin, Tabs 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, ReloadOutlined, UploadOutlined,
  CameraOutlined, BankOutlined, UserOutlined 
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import { 
  createBankAccount, getBankAccountsByCustomer,
  updateBankAccount, deleteBankAccount, setPrimaryBankAccount,
  getBankAccountById, getAllBankAccounts
} from '../../api/services/customerBankService';
import { getCustomers } from '../../api/services/customerServices';
import { uploadConfigUrl } from '../../api/apiUrl';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CustomerBankCreation = () => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [allBankAccounts, setAllBankAccounts] = useState([]);
  const [filteredAllBankAccounts, setFilteredAllBankAccounts] = useState([]);
  const [filteredBankAccounts, setFilteredBankAccounts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    hasBankAccount: ''
  });
  const [bankFilters, setBankFilters] = useState({
    search: '',
    bankName: ''
  });
  const [allBankFilters, setAllBankFilters] = useState({
    search: '',
    bankName: '',
    customerName: ''
  });
  const [activeTab, setActiveTab] = useState('customer');

  // Camera capture states
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState('bank_documents');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Bank options
  const bankOptions = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
    'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
    'Canara Bank', 'Union Bank of India', 'IndusInd Bank'
  ];

  // Fetch data
  useEffect(() => {
    fetchCustomers();
    allfetchBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchBankAccounts(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  // Apply filters
  useEffect(() => {
    applyCustomerFilters();
  }, [filters, customers]);

  useEffect(() => {
    applyBankFilters();
  }, [bankFilters, bankAccounts, selectedCustomer]);

  useEffect(() => {
    applyAllBankFilters();
  }, [allBankFilters, allBankAccounts]);

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
          const file = new File([blob], `bank-document-${timestamp}.jpg`, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Create file object for upload
          const capturedFile = {
            uid: `capture-${timestamp}`,
            name: `bank-document-${timestamp}.jpg`,
            status: 'done',
            originFileObj: file,
            preview: URL.createObjectURL(blob)
          };

          // Add to file list (max 5 files)
          if (fileList.length < 5) {
            setFileList(prev => [...prev, capturedFile]);
            message.success('Document captured successfully!');
          } else {
            message.warning('Maximum 5 documents allowed');
          }

          closeCameraModal();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const openCameraModal = () => {
    if (fileList.length >= 5) {
      message.warning('Maximum 5 documents allowed. Please remove some documents to capture new ones.');
      return;
    }
    setIsCameraModalVisible(true);
  };

  const closeCameraModal = () => {
    stopCamera();
    setIsCameraModalVisible(false);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers();
      setCustomers(response.customers);
      setFilteredCustomers(response.customers);
    } catch (error) {
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async (customerId) => {
    try {
      setLoading(true);
      const response = await getBankAccountsByCustomer(customerId);
      setBankAccounts(response.data);
      setFilteredBankAccounts(response.data);
    } catch (error) {
      message.error('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const allfetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await getAllBankAccounts();
      setAllBankAccounts(response.bankAccounts);
      setFilteredAllBankAccounts(response.bankAccounts);
    } catch (error) {
      message.error('Failed to fetch all bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const applyCustomerFilters = () => {
    let filtered = [...customers];
    const { search, state, hasBankAccount } = filters;

    if (search) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.aadhar_no?.includes(searchTerm) ||
        item.pan_no?.includes(searchTerm)
      );
    }

    if (state) {
      filtered = filtered.filter(item => 
        item.state?.toLowerCase() === state.toLowerCase()
      );
    }

    if (hasBankAccount !== '') {
      filtered = filtered.filter(item => 
        item.has_bank_account === (hasBankAccount === 'true')
      );
    }

    setFilteredCustomers(filtered);
  };

  const applyBankFilters = () => {
    let filtered = [...bankAccounts];
    const { search, bankName } = bankFilters;

    if (selectedCustomer) {
      filtered = filtered.filter(item => item.customer_id === selectedCustomer.id);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.bank_name?.toLowerCase().includes(searchTerm) ||
        item.account_number?.includes(searchTerm) ||
        item.ifsc_code?.includes(searchTerm) ||
        item.branch_name?.toLowerCase().includes(searchTerm)
      );
    }

    if (bankName) {
      filtered = filtered.filter(item => item.bank_name === bankName);
    }

    setFilteredBankAccounts(filtered);
  };

  const applyAllBankFilters = () => {
    let filtered = [...allBankAccounts];
    const { search, bankName, customerName } = allBankFilters;

    if (search) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.bank_name?.toLowerCase().includes(searchTerm) ||
        item.account_number?.includes(searchTerm) ||
        item.ifsc_code?.includes(searchTerm) ||
        item.branch_name?.toLowerCase().includes(searchTerm) ||
        item.customer_name?.toLowerCase().includes(searchTerm)
      );
    }

    if (bankName) {
      filtered = filtered.filter(item => item.bank_name === bankName);
    }

    if (customerName) {
      filtered = filtered.filter(item => 
        item.customer_name?.toLowerCase().includes(customerName.toLowerCase())
      );
    }

    setFilteredAllBankAccounts(filtered);
  };

  // Filter handlers
  const handleCustomerSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleStateFilter = (value) => {
    setFilters(prev => ({ ...prev, state: value }));
  };

  const handleBankAccountFilter = (value) => {
    setFilters(prev => ({ ...prev, hasBankAccount: value }));
  };

  const resetCustomerFilters = () => {
    setFilters({
      search: '',
      state: '',
      hasBankAccount: ''
    });
  };

  const handleBankSearch = (value) => {
    setBankFilters(prev => ({ ...prev, search: value }));
  };

  const handleBankNameFilter = (value) => {
    setBankFilters(prev => ({ ...prev, bankName: value }));
  };

  const resetBankFilters = () => {
    setBankFilters({
      search: '',
      bankName: ''
    });
  };

  const handleAllBankSearch = (value) => {
    setAllBankFilters(prev => ({ ...prev, search: value }));
  };

  const handleAllBankNameFilter = (value) => {
    setAllBankFilters(prev => ({ ...prev, bankName: value }));
  };

  const handleCustomerNameFilter = (value) => {
    setAllBankFilters(prev => ({ ...prev, customerName: value }));
  };

  const resetAllBankFilters = () => {
    setAllBankFilters({
      search: '',
      bankName: '',
      customerName: ''
    });
  };

  // Modal handlers
  const showModal = () => {
    if (!selectedCustomer) {
      message.warning('Please select a customer first');
      return;
    }
    setIsModalVisible(true);
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      customer_id: selectedCustomer.customer_id,
      customer_name: selectedCustomer.customer_name,
      is_primary: bankAccounts.length === 0
    });
    setFileList([]);
  };

  const showEditModal = async (record) => {
    try {
      setLoading(true);
      const response = await getBankAccountById(record.id);
      const bankAccount = response.data;
      
      setIsModalVisible(true);
      setEditingRecord(bankAccount);
      form.setFieldsValue(bankAccount);
      
      if (bankAccount.documents) {
        setFileList(bankAccount.documents.map(doc => ({
          uid: doc.id,
          name: doc.name,
          status: 'done',
          url: doc.url
        })));
      }
    } catch (error) {
      message.error('Failed to load bank account details');
    } finally {
      setLoading(false);
    }
  };

  const showCustomerModal = () => {
    setIsCustomerModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
    setFileList([]);
  };

  const handleCustomerCancel = () => {
    setIsCustomerModalVisible(false);
  };

  const selectCustomer = (record) => {
    setSelectedCustomer(record);
    setIsCustomerModalVisible(false);
    setActiveTab('customer');
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
  };

  // File handling
  const handleUpload = (file) => {
    if (fileList.length >= 5) {
      message.warning('Maximum 5 documents allowed');
      return false;
    }

    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file
    };
    setFileList(prev => [...prev, newFile]);
    return false;
  };

  const handleRemove = (file) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid));
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

  // Form submission
  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      const bankData = {
        ...values,
        documents: fileList
          .filter(file => file.originFileObj)
          .map(file => file.originFileObj),
        documentsToRemove: fileList
          .filter(file => file.url && !file.originFileObj)
          .map(file => file.uid)
      };

      if (editingRecord) {
        await updateBankAccount(editingRecord.id, bankData);
        message.success('Bank account updated successfully');
      } else {
        await createBankAccount(selectedCustomer.id, bankData);
        message.success('Bank account added successfully');
      }
      
      fetchBankAccounts(selectedCustomer.id);
      allfetchBankAccounts();
      handleCancel();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      setLoading(true);
      await setPrimaryBankAccount(id);
      message.success('Primary bank account updated');
      fetchBankAccounts(selectedCustomer.id);
      allfetchBankAccounts();
    } catch (error) {
      message.error('Failed to set primary account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteBankAccount(id);
      message.success('Bank account deleted successfully');
      fetchBankAccounts(selectedCustomer.id);
      allfetchBankAccounts();
    } catch (error) {
      message.error('Failed to delete bank account');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
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
          src={record.customer_photo ? `${uploadConfigUrl}${record.customer_photo}` : null}
          size="large"
          icon={!record.customer_photo && <UserOutlined />}
          style={{
            backgroundColor: record.customer_photo ? 'transparent' : roots.gold[400],
            color: roots.text.inverse,
            border: `1px solid ${roots.gold[300]}`
          }}
          onError={() => true}
        >
          {!record.customer_photo && record?.customer_name?.charAt(0)?.toUpperCase()}
        </Avatar>
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
      title: 'Bank Account',
      dataIndex: 'has_bank_account',
      key: 'has_bank_account',
      width: 120,
      render: (hasAccount) => (
        <Tag color={hasAccount ? 'green' : 'orange'}>
          {hasAccount ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => selectCustomer(record)}
          disabled={record.id === selectedCustomer?.id}
        >
          {record.id === selectedCustomer?.id ? 'Selected' : 'Select'}
        </Button>
      )
    }
  ];

  const bankColumns = [
    {
      title: 'Bank Name',
      dataIndex: 'bank_name',
      key: 'bank_name',
      width: 180,
      render: (text, record) => (
        <Space>
          <strong style={{ color: roots.text.primary }}>{text}</strong>
          {record.is_primary && <Tag color="green">Primary</Tag>}
        </Space>
      )
    },
    {
      title: 'Account Number',
      dataIndex: 'account_number',
      key: 'account_number',
      width: 150,
      render: (text) => <Text copyable>{text}</Text>
    },
    {
      title: 'IFSC Code',
      dataIndex: 'ifsc_code',
      key: 'ifsc_code',
      width: 120,
      render: (text) => <Tag color={roots.teal[500]}>{text}</Tag>
    },
    {
      title: 'Branch',
      dataIndex: 'branch_name',
      key: 'branch_name',
      width: 180
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
            style={{ color: roots.teal[600] }}
          />
          {!record.is_primary && (
            <>
              <Button 
                type="text" 
                onClick={() => handleSetPrimary(record.id)}
                style={{ color: roots.gold[600] }}
              >
                Set Primary
              </Button>
              <Popconfirm 
                title="Are you sure you want to delete this account?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />}
                  style={{ color: roots.status.error.main }}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const allBankColumns = [
    {
      title: 'Customer Name',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Bank Name',
      dataIndex: 'bank_name',
      key: 'bank_name',
      width: 180,
      render: (text, record) => (
        <Space>
          <strong style={{ color: roots.text.primary }}>{text}</strong>
          {record.is_primary && <Tag color="green">Primary</Tag>}
        </Space>
      )
    },
    {
      title: 'Account Number',
      dataIndex: 'account_number',
      key: 'account_number',
      width: 150,
      render: (text) => <Text copyable>{text}</Text>
    },
    {
      title: 'IFSC Code',
      dataIndex: 'ifsc_code',
      key: 'ifsc_code',
      width: 120,
      render: (text) => <Tag color={roots.teal[500]}>{text}</Tag>
    },
    {
      title: 'Branch',
      dataIndex: 'branch_name',
      key: 'branch_name',
      width: 180
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => {
              setSelectedCustomer({ id: record.customer_id });
              showEditModal(record);
            }}
            style={{ color: roots.teal[600] }}
          />
          {!record.is_primary && (
            <>
              <Button 
                type="text" 
                onClick={() => handleSetPrimary(record.id)}
                style={{ color: roots.gold[600] }}
              >
                Set Primary
              </Button>
              <Popconfirm 
                title="Are you sure you want to delete this account?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />}
                  style={{ color: roots.status.error.main }}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const uploadProps = {
    onRemove: handleRemove,
    beforeUpload: handleUpload,
    fileList,
    listType: "picture-card",
    onPreview: handlePreview,
    accept: "image/*,.pdf",
    multiple: true
  };

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
    .ant-tabs-tab-active {
      font-weight: 600 !important;
    }
    .ant-tabs-ink-bar {
      background: ${roots.gold[500]} !important;
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
    .document-count {
      margin-top: 8px;
      text-align: center;
      color: ${roots.text.secondary};
      font-size: 12px;
    }
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Spin spinning={loading}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === 'all' ? (
              <Button 
                type="primary" 
                icon={<BankOutlined />} 
                onClick={showCustomerModal}
                className="add-button"
              >
                Select Customer to Add Account
              </Button>
            ) : null
          }
        >
          <TabPane tab="Customer Bank Accounts" key="customer">
            {/* Customer Selection */}
            {selectedCustomer ? (
              <Card className="customer-card">
                <Row gutter={16} align="middle">
                  <Col flex="80px">
                    <Avatar 
                      src={`${uploadConfigUrl}${selectedCustomer.customer_photo}`} 
                      size={64} 
                      icon={!selectedCustomer.customer_photo && <UserOutlined />}
                      style={{ 
                        backgroundColor: selectedCustomer.customer_photo ? 'transparent' : roots.gold[400],
                        color: roots.text.inverse
                      }}
                    />
                  </Col>
                  <Col flex="auto">
                    <Title level={4} style={{ marginBottom: 0 }}>
                      {selectedCustomer.customer_name}
                    </Title>
                    <Text type="secondary">ID: {selectedCustomer.customer_id}</Text>
                    <div>
                      <Text strong style={{ marginRight: 16 }}>
                        Aadhar: {selectedCustomer.aadhar_no}
                      </Text>
                      <Text strong>PAN: {selectedCustomer.pan_no}</Text>
                    </div>
                    <div>
                      <Text>
                        {selectedCustomer.address_1}, {selectedCustomer.city}, {selectedCustomer.state}
                      </Text>
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

            {/* Bank Account Management */}
            <Card className="filter-card">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={8} md={6}>
                  <Input
                    placeholder="Search bank accounts..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => handleBankSearch(e.target.value)}
                    allowClear
                    disabled={!selectedCustomer}
                  />
                </Col>
                <Col xs={24} sm={8} md={5}>
                  <Select
                    placeholder="Filter by Bank"
                    onChange={handleBankNameFilter}
                    allowClear
                    style={{ width: '100%' }}
                    disabled={!selectedCustomer}
                  >
                    {bankOptions.map(bank => (
                      <Option key={bank} value={bank}>{bank}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Space>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={resetBankFilters}
                      style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                      disabled={!selectedCustomer}
                    >
                      Reset Filters
                    </Button>
                    <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>
                      {filteredBankAccounts.length || 0} accounts found
                    </Tag>
                  </Space>
                </Col>
                <Col>
                  <Button 
                    type="primary" 
                    icon={<BankOutlined />} 
                    size="large"
                    onClick={showModal}
                    className="add-button"
                    disabled={!selectedCustomer}
                  >
                    Add Bank Account
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Bank Accounts Table */}
            <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
              <Table
                columns={bankColumns}
                dataSource={filteredBankAccounts}
                pagination={{ 
                  pageSize: 10, 
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} accounts`
                }}
                scroll={{ x: 1200 }}
                rowKey="id"
                size="middle"
                locale={{
                  emptyText: selectedCustomer ? 'No bank accounts found' : 'Please select a customer to view bank accounts'
                }}
              />
            </Card>
          </TabPane>

          <TabPane tab="All Bank Accounts" key="all">
            {/* All Bank Accounts Management */}
            <Card className="filter-card">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={8} md={6}>
                  <Input
                    placeholder="Search all accounts..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => handleAllBankSearch(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={8} md={5}>
                  <Select
                    placeholder="Filter by Bank"
                    onChange={handleAllBankNameFilter}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {bankOptions.map(bank => (
                      <Option key={bank} value={bank}>{bank}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={8} md={5}>
                  <Input
                    placeholder="Filter by Customer"
                    onChange={(e) => handleCustomerNameFilter(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Space>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={resetAllBankFilters}
                      style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                    >
                      Reset Filters
                    </Button>
                    <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>
                      {filteredAllBankAccounts.length || 0} accounts found
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* All Bank Accounts Table */}
            <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
              <Table
                columns={allBankColumns}
                dataSource={filteredAllBankAccounts}
                pagination={{ 
                  pageSize: 10, 
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} accounts`
                }}
                scroll={{ x: 1500 }}
                rowKey="id"
                size="middle"
                locale={{
                  emptyText: 'No bank accounts found'
                }}
              />
            </Card>
          </TabPane>
        </Tabs>

        {/* Bank Account Modal */}
        <Modal
          title={editingRecord ? "Edit Bank Account" : "Add New Bank Account"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={700}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ account_type: 'Savings', is_primary: bankAccounts.length === 0 }}
          >
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
                  label="Bank Name"
                  name="bank_name"
                  rules={[{ required: true, message: 'Please select bank name!' }]}
                >
                  <Select showSearch>
                    {bankOptions.map(bank => (
                      <Option key={bank} value={bank}>{bank}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Account Number"
                  name="account_number"
                  rules={[
                    { required: true, message: 'Please input account number!' },
                    { pattern: /^[0-9]{9,18}$/, message: 'Invalid account number!' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="IFSC Code"
                  name="ifsc_code"
                  rules={[
                    { required: true, message: 'Please input IFSC code!' },
                    { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format!' }
                  ]}
                >
                  <Input placeholder="ABCD0123456" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Branch Name"
                  name="branch_name"
                  rules={[{ required: true, message: 'Please input branch name!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Account Type"
                  name="account_type"
                  rules={[{ required: true, message: 'Please select account type!' }]}
                >
                  <Select>
                    <Option value="Savings">Savings</Option>
                    <Option value="Current">Current</Option>
                    <Option value="Fixed Deposit">Fixed Deposit</Option>
                    <Option value="Recurring Deposit">Recurring Deposit</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Primary Account?"
                  name="is_primary"
                  valuePropName="checked"
                >
                  <Select disabled={bankAccounts.length === 0}>
                    <Option value={true}>Yes</Option>
                    <Option value={false}>No</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Bank Documents Upload Section with Camera Capture */}
            <div className="upload-section">
              <div className="upload-section-title">Bank Documents</div>
              <Upload {...uploadProps}>
                {fileList.length >= 5 ? null : (
                  <div>
                    <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                    <div style={{ marginTop: 8 }}>Upload Documents</div>
                  </div>
                )}
              </Upload>
              <div className="document-count">
                {fileList.length}/5 documents uploaded
              </div>
              <div className="upload-actions">
                <Button 
                  icon={<CameraOutlined />} 
                  onClick={openCameraModal}
                  type="primary"
                  disabled={fileList.length >= 5}
                >
                  Capture Document
                </Button>
                <Button 
                  icon={<UploadOutlined />}
                  onClick={() => document.querySelector('.ant-upload input[type="file"]')?.click()}
                >
                  Upload Files
                </Button>
              </div>
            </div>

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
                  {editingRecord ? 'Update Account' : 'Add Account'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Camera Capture Modal for Bank Documents */}
        <Modal
          title="Capture Bank Document"
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
            Position the document clearly in the frame and click the capture button
          </div>
        </Modal>

        {/* Customer Selection Modal */}
        <Modal
          title="Select Customer"
          open={isCustomerModalVisible}
          onCancel={handleCustomerCancel}
          footer={null}
          width={1000}
          destroyOnClose
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
                    <Option key={state.name} value={state.name}>{state.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={8} md={5}>
                <Select
                  placeholder="Filter by Bank Account"
                  onChange={handleBankAccountFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="true">Has Bank Account</Option>
                  <Option value="false">No Bank Account</Option>
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
            rowKey="id"
            size="middle"
          />
        </Modal>

        {/* Document Preview Modal */}
        <Modal
          visible={previewVisible}
          title="Document Preview"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </Spin>
    </div>
  );
};

export default CustomerBankCreation;