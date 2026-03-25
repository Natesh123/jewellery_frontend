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
  Spin
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
  CameraOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  filterCustomersByState,
  filterCustomersByBankAccount,
  generateAadharOTP,
  verifyAadharOTP,
  getStatesList
} from '../../api/services/customerServices';

import { getAllState } from '../../api/services/AccountsService';

import { roots } from '../../colorConstant';

import { statesList } from '../../utils/stateList';
import { uploadConfigUrl } from '../../api/apiUrl';

const { Option } = Select;
const { Title } = Typography;

function generateCustomerId(name) {
  if (!name) return '';
  const code = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
  const rand = Math.floor(10 + Math.random() * 90);
  return `${code}${rand}`;
}

const CustomerCreation = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [aadharVerifying, setAadharVerifying] = useState(false);
  const [aadharVerificationError, setAadharVerificationError] = useState('');
  const [fileListAadhar, setFileListAadhar] = useState([]);
  const [fileListPan, setFileListPan] = useState([]);
  const [fileListCustomer, setFileListCustomer] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    hasBankAccount: ''
  });

  // Camera capture states
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState(null); // 'customer', 'aadhar', 'pan'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchStates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, data]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers();
      setData(response.customers);
      setFilteredData(response.customers);
    } catch (error) {
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      setLoading(true);
      const response = await getAllState();
      if (response.success) {
        setStates(response.data);
      } else {
        message.error('Failed to fetch states');
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      message.error('Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

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

    if (filters.hasBankAccount !== '') {
      filtered = filtered.filter(item =>
        item.has_bank_account === (filters.hasBankAccount === 'true')
      );
    }

    setFilteredData(filtered);
  };

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
          const file = new File([blob], `${currentCaptureType}-capture.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          // Create file object for upload
          const capturedFile = {
            uid: `capture-${Date.now()}`,
            name: `${currentCaptureType}-capture.jpg`,
            status: 'done',
            originFileObj: file,
            preview: URL.createObjectURL(blob)
          };

          // Update the appropriate file list
          switch (currentCaptureType) {
            case 'customer':
              setFileListCustomer([capturedFile]);
              break;
            case 'aadhar':
              setFileListAadhar([capturedFile]);
              break;
            case 'pan':
              setFileListPan([capturedFile]);
              break;
            default:
              break;
          }

          message.success('Image captured successfully!');
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

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleStateFilter = (value) => {
    setFilters(prev => ({ ...prev, state: value }));
  };

  const handleBankAccountFilter = (value) => {
    setFilters(prev => ({ ...prev, hasBankAccount: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      state: '',
      hasBankAccount: ''
    });
  };

  const onCustomerNameChange = (e) => {
    const name = e.target.value;
    const newId = generateCustomerId(name);
    form.setFieldsValue({ customer_id: newId });
    setCustomerId(newId);
  };

  const onStateChange = (value) => {
    const stateObj = states.find(s => s.name === value);
    form.setFieldsValue({ state_code: stateObj ? stateObj.code : '' });
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingRecord(null);
    form.resetFields();
    setCustomerId('');
    setOtpSent(false);
    setOtpVerified(false);
    setAadharVerificationError('');
    setFileListAadhar([]);
    setFileListPan([]);
    setFileListCustomer([]);
  };

  const showEditModal = async (record) => {
    try {
      setLoading(true);
      const customer = await getCustomerById(record.id);

      setIsModalVisible(true);
      setEditingRecord(customer.data);
      form.setFieldsValue({
        ...customer.data,
        has_bank_account: customer.data.has_bank_account ? 'yes' : 'no'
      });
      setCustomerId(customer.data.customer_id);
      setOtpVerified(customer.data.aadhar_verified);

      // Set file lists for existing files
      if (customer.data.aadhar_photo) {
        setFileListAadhar([{
          uid: '-1',
          name: 'aadhar.jpg',
          status: 'done',
          url: customer.data.aadhar_photo
        }]);
      }

      if (customer.data.pan_photo) {
        setFileListPan([{
          uid: '-2',
          name: 'pan.jpg',
          status: 'done',
          url: customer.data.pan_photo
        }]);
      }

      if (customer.data.customer_photo) {
        setFileListCustomer([{
          uid: '-3',
          name: 'customer.jpg',
          status: 'done',
          url: customer.data.customer_photo
        }]);
      }
    } catch (error) {
      message.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
    setCustomerId('');
    setOtpSent(false);
    setOtpVerified(false);
    setAadharVerificationError('');
    setFileListAadhar([]);
    setFileListPan([]);
    setFileListCustomer([]);
  };

  const handleAadharOtp = async () => {
    const aadharNo = form.getFieldValue('aadhar_no');
    if (!aadharNo || aadharNo.length !== 12) {
      message.error('Please enter a valid 12-digit Aadhar number');
      return;
    }

    try {
      setAadharVerifying(true);
      await generateAadharOTP(aadharNo);
      setOtpSent(true);
      message.success('OTP sent to registered mobile');
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
      setAadharVerifying(true);
      const response = await verifyAadharOTP(aadharNo, enteredOtp);

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
    } finally {
      setAadharVerifying(false);
    }
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

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // Prepare customer data
      const customerData = {
        ...values,
        has_bank_account: values.has_bank_account === 'yes',
        aadhar_verified: otpVerified,
        customer_photo: fileListCustomer[0]?.originFileObj || null,
        aadhar_photo: fileListAadhar[0]?.originFileObj || null,
        pan_photo: fileListPan[0]?.originFileObj || null
      };

      if (editingRecord) {
        await updateCustomer(editingRecord.id, customerData);
        message.success('Customer updated successfully');
      } else {
        await createCustomer(customerData);
        message.success('Customer added successfully');
      }

      fetchCustomers();
      handleCancel();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    try {
      setLoading(true);
      await deleteCustomer(key);
      message.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      message.error('Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      title: 'Aadhar No',
      dataIndex: 'aadhar_no',
      key: 'aadhar_no',
      width: 140,
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.aadhar_verified && (
            <Tag color="green" style={{ marginLeft: 4 }}>Verified</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'PAN No',
      dataIndex: 'pan_no',
      key: 'pan_no',
      width: 120
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (text) => <Tag color={roots.gold[500]}>{text}</Tag>
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (text) => <Tag color={roots.teal[500]}>{text}</Tag>
    },
    {
      title: 'Bank Account',
      dataIndex: 'has_bank_account',
      key: 'has_bank_account',
      width: 120,
      render: (_, record) => (
        <Tag color={record.has_bank_account ? 'green' : 'orange'}>
          {record.has_bank_account ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            style={{ color: roots.teal[600] }}
          />
          {/* <Popconfirm
            title="Are you sure you want to delete this customer?"
            onConfirm={() => handleDelete(record.key)}
            okButtonProps={{ style: { backgroundColor: roots.status.error.main } }}
          >
            {localStorage.getItem("userRole") === "super admin" && (
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: roots.status.error.main }}
              />
            )}
          </Popconfirm> */}
        </Space>
      )
    }
  ];

  const uploadProps = (fileList, setFileList, type) => ({
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
    maxCount: 1,
    customRequest: ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    }
  });

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
      margin-bottom: 16px;
      border: 1px dashed ${roots.ebony[200]};
      padding: 16px;
      border-radius: 8px;
    }
    .upload-section-title {
      margin-bottom: 8px;
      font-weight: 500;
      color: ${roots.text.secondary};
    }
    .aadhar-verified {
      color: green;
      font-weight: 500;
    }
    .aadhar-not-verified {
      color: red;
      font-weight: 500;
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
    }
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Spin spinning={loading}>

        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                value={filters.search}
              />
            </Col>
            <Col xs={24} sm={8} md={5}>
              <Select
                placeholder="Filter by State"
                onChange={handleStateFilter}
                allowClear
                style={{ width: '100%' }}
                value={filters.state || undefined}
              >
                {states.map(state => (
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
                value={filters.hasBankAccount || undefined}
              >
                <Option value="true">Has Bank Account</Option>
                <Option value="false">No Bank Account</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                >
                  Reset Filters
                </Button>
                <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>
                  {filteredData.length} customers found
                </Tag>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={showModal}
                className="add-button"
              >
                Add New Customer
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`
            }}
            scroll={{ x: 1300 }}
            rowKey="key"
            size="middle"
            loading={loading}
          />
        </Card>

        {/* Customer Modal */}
        <Modal
          title={editingRecord ? "Edit Customer" : "Add New Customer"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ has_bank_account: 'no' }}
          >
            {/* Customer Photo Section */}
            <div className="upload-section">
              <div className="upload-section-title">Customer Photo</div>
              <Upload {...uploadProps(fileListCustomer, setFileListCustomer, 'customer')}>
                {fileListCustomer.length >= 1 ? null : (
                  <div>
                    <CameraOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                    <div style={{ marginTop: 8 }}>Upload Photo</div>
                  </div>
                )}
              </Upload>
              <div className="upload-actions">
                <Button
                  icon={<CameraOutlined />}
                  onClick={() => openCameraModal('customer')}
                  type="primary"
                >
                  Capture Photo
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Customer Name"
                  name="customer_name"
                  rules={[{ required: true, message: 'Please input customer name!' }]}
                >
                  <Input onChange={onCustomerNameChange} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Customer ID"
                  name="customer_id"
                >
                  <Input readOnly value={customerId} />
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
                    // { required: true, message: 'Please input PAN number!' },
                    { len: 10, message: 'PAN must be 10 characters!' }
                  ]}
                >
                  <Input maxLength={10} />
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
                    loading={aadharVerifying}
                  >
                    Verify OTP
                  </Button>
                </Col>
              </Row>
            )}

            {otpVerified && (
              <div style={{ marginBottom: 16 }}>
                <span className="aadhar-verified">✓ Aadhar Verified</span>
              </div>
            )}

            {/* Aadhar Card Upload Section */}
            <div className="upload-section">
              <div className="upload-section-title">Aadhar Card Upload</div>
              <Upload {...uploadProps(fileListAadhar, setFileListAadhar, 'aadhar')}>
                {fileListAadhar.length >= 1 ? null : (
                  <div>
                    <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                    <div style={{ marginTop: 8 }}>Upload Aadhar</div>
                  </div>
                )}
              </Upload>
              <div className="upload-actions">
                <Button
                  icon={<CameraOutlined />}
                  onClick={() => openCameraModal('aadhar')}
                  type="primary"
                >
                  Capture Aadhar
                </Button>
              </div>
            </div>

            {/* PAN Card Upload Section */}
            <div className="upload-section">
              <div className="upload-section-title">PAN Card Upload</div>
              <Upload {...uploadProps(fileListPan, setFileListPan, 'pan')}>
                {fileListPan.length >= 1 ? null : (
                  <div>
                    <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                    <div style={{ marginTop: 8 }}>Upload PAN</div>
                  </div>
                )}
              </Upload>
              <div className="upload-actions">
                <Button
                  icon={<CameraOutlined />}
                  onClick={() => openCameraModal('pan')}
                  type="primary"
                >
                  Capture PAN
                </Button>
              </div>
            </div>

            {/* Rest of the form fields */}
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Address Line 1"
                  name="address_1"
                  rules={[{ required: true, message: 'Please input address!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Address Line 2"
                  name="address_2"
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="Area"
                  name="area"
                  rules={[{ required: true, message: 'Please input area!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="City"
                  name="city"
                  rules={[{ required: true, message: 'Please input city!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Pincode"
                  name="pincode"
                  rules={[{ required: true, message: 'Please input pincode!' }]}
                >
                  <Input maxLength={6} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="District"
                  name="district"
                  rules={[{ required: true, message: 'Please input district!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="State"
                  name="state"
                  rules={[{ required: true, message: 'Please select state!' }]}
                >
                  <Select onChange={onStateChange} showSearch>
                    {states.map(s => (
                      <Option key={s.name} value={s.name}>{s.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="State Code"
                  name="state_code"
                >
                  <Input readOnly />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Phone Number 1"
                  name="phoneno"
                  rules={[{ required: true, message: 'Please input phone number!' }]}
                >
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Phone Number 2"
                  name="phoneno2"
                >
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Has Bank Account?"
                  name="has_bank_account"
                  rules={[{ required: true, message: 'Please select!' }]}
                >
                  <Select>
                    <Option value="yes">Yes</Option>
                    <Option value="no">No</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Office Address"
                  name="office_address"
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Reference Details"
                  name="reference_details"
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Remarks"
                  name="remarks"
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

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
                  loading={loading}
                >
                  {editingRecord ? 'Update Customer' : 'Add Customer'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Camera Capture Modal */}
        <Modal
          title={`Capture ${currentCaptureType === 'customer' ? 'Customer Photo' : currentCaptureType === 'aadhar' ? 'Aadhar Card' : 'PAN Card'}`}
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
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          visible={previewVisible}
          title="Image Preview"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </Spin>
    </div>
  );
};

export default CustomerCreation;