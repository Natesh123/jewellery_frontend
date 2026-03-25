import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Button, Select, Table, Space, Popconfirm,
  Modal, Card, Row, Col, Typography, Tag, Upload, DatePicker,
  Divider, Spin, message, Avatar, Image
} from 'antd';
import Webcam from "react-webcam";
import {
  PlusOutlined, SearchOutlined, EditOutlined,
  DeleteOutlined, ReloadOutlined, UploadOutlined,
  UserOutlined, IdcardOutlined, HomeOutlined,
  ContactsOutlined, PaperClipOutlined, EyeOutlined, CameraOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { getRoles } from '../../api/services/roleService';
import { getCompanies } from '../../api/services/companyService';
import { getBranchByCompanyId } from '../../api/services/branchService';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserCount
} from '../../api/services/userService';
import Swal from 'sweetalert2';
import moment from 'moment';
import { API_BASE_URL } from '../../api/apiConfig/apiClient';

const { Option } = Select;
const { Text } = Typography;

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const UserCreation = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [fileList, setFileList] = useState({
    profile_photo: [],
    resume: [],
    degree_certificate: []
  });
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    company: '',
    branch: ''
  });
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Camera capture states
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState(null); // 'profile_photo' or 'degree_certificate'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState('');

  useEffect(() => {
    fetchData();
    fetchInitialData();
  }, [pagination.current, pagination.pageSize]);

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
            case 'profile_photo':
              setFileList(prev => ({
                ...prev,
                profile_photo: [capturedFile]
              }));
              setCapturedImage(URL.createObjectURL(blob));
              message.success('Profile photo captured successfully!');
              break;
            case 'degree_certificate':
              setFileList(prev => ({
                ...prev,
                degree_certificate: [capturedFile]
              }));
              message.success('Degree certificate captured successfully!');
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

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesRes, companiesRes] = await Promise.all([
        getRoles(1, 100),
        getCompanies(1, 100)
      ]);
      setRoles(rolesRes.roles || []);
      setCompanies(companiesRes.companies || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getUsers(pagination.current, pagination.pageSize);

      // Access the users array from the response data
      const usersData = response.users || [];

      setUsers(usersData);
      setFilteredUsers(usersData);
      setPagination({
        ...pagination,
        total: response.pagination.total || 0
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (companyId) => {
    try {
      const branchesRes = await getBranchByCompanyId(companyId);

      // Handle different response structures
      let branchesData = [];

      if (branchesRes?.data) {
        // If response has data property
        if (Array.isArray(branchesRes.data)) {
          branchesData = branchesRes.data;
        } else {
          branchesData = [branchesRes.data];
        }
      } else if (Array.isArray(branchesRes)) {
        branchesData = branchesRes;
      }

      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
      message.error('Failed to load branches');
      setBranches([]);
    }
  };

  const handleSearch = (value) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleRoleFilter = (value) => {
    const newFilters = { ...filters, role: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleStatusFilter = (value) => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleCompanyFilter = (value) => {
    const newFilters = { ...filters, company: value, branch: '' };
    setFilters(newFilters);
    applyFilters(newFilters);
    if (value) {
      fetchBranches(value);
    } else {
      setBranches([]);
    }
  };

  const handleBranchFilter = (value) => {
    const newFilters = { ...filters, branch: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (currentFilters) => {
    let filtered = [...users];

    if (currentFilters.search) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        user.email?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        user.user_code?.toLowerCase().includes(currentFilters.search.toLowerCase())
      );
    }

    if (currentFilters.role) {
      filtered = filtered.filter(user => user.role_id === currentFilters.role);
    }

    if (currentFilters.status) {
      filtered = filtered.filter(user => user.status === currentFilters.status);
    }

    if (currentFilters.company) {
      filtered = filtered.filter(user => user.company_id === currentFilters.company);
    }

    if (currentFilters.branch) {
      filtered = filtered.filter(user => user.branch_id === currentFilters.branch);
    }

    setFilteredUsers(filtered);
  };

  const resetFilters = () => {
    setFilters({ search: '', role: '', status: '', company: '', branch: '' });
    setFilteredUsers(users);
  };

  const generateUserCode = async (companyCode, branchCode) => {
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let results = "";
      for (let i = 0; i < 4; i++) {
        results += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const userCount = users.length;
      const paddedCount = String(userCount + 1).padStart(4, '0');
      return `${branchCode}${paddedCount}${results}`;
    } catch (error) {
      console.error('Error generating user code:', error);
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${branchCode}${rand}`;
    }
  };

  const onUserDetailsChange = async () => {
    const firstName = form.getFieldValue('first_name') || '';
    const lastName = form.getFieldValue('last_name') || '';
    const companyId = form.getFieldValue('company_id');
    const branchId = form.getFieldValue('branch_id');

    if (companyId && branchId) {
      const company = companies.find(c => c.id === companyId);
      const branch = branches.find(b => b.id === branchId);
      if (company && branch) {
        const newCode = await generateUserCode(company.company_code, branch.branch_id);
        form.setFieldsValue({ user_code: newCode });
        setUserCode(newCode);
      }
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingUser(null);
    form.resetFields();
    setUserCode('');
    setFileList({
      profile_photo: [],
      resume: [],
      degree_certificate: []
    });
    setCapturedImage('');
  };

  const showEditModal = async (user) => {
    try {
      user.status = user.is_active === 1 ? "Active" : "Inactive"
      setLoading(true);
      setIsModalVisible(true);
      setEditingUser(user);
      console.log(user)
      // Initialize form values
      const initialValues = {
        ...user,
        company_id: user.company_id,
        branch_id: user.branch_id,
        joining_date: user.joining_date ? moment(user.joining_date) : null
      };

      form.setFieldsValue(initialValues);
      setUserCode(user.user_code);

      // Set file list for existing documents
      const files = {
        profile_photo: [],
        resume: [],
        degree_certificate: []
      };

      if (user.profile_photo) {
        try {
          const parsed = JSON.parse(user.profile_photo);
          files.profile_photo = [{
            uid: '-profile',
            name: parsed.name,
            status: 'done',
            url: `${API_BASE_URL}${parsed.url}`,
            type: 'profile_photo'
          }];
          setCapturedImage(`${API_BASE_URL}${parsed.url}`);
        } catch (e) {
          console.error('Error parsing profile photo:', e);
        }
      }

      if (user.resume) {
        try {
          const parsed = JSON.parse(user.resume);
          files.resume = [{
            uid: '-resume',
            name: parsed.name,
            status: 'done',
            url: `${process.env.REACT_APP_API_BASE_URL}${parsed.url}`,
            type: 'resume'
          }];
        } catch (e) {
          console.error('Error parsing resume:', e);
        }
      }

      if (user.degree_certificate) {
        try {
          const parsed = JSON.parse(user.degree_certificate);
          files.degree_certificate = [{
            uid: '-degree',
            name: parsed.name,
            status: 'done',
            url: `${process.env.REACT_APP_API_BASE_URL}${parsed.url}`,
            type: 'degree_certificate'
          }];
        } catch (e) {
          console.error('Error parsing degree certificate:', e);
        }
      }
      console.log(files)
      setFileList(files);

      if (user.company_id) {
        await fetchBranches(user.company_id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      message.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current branches:', branches);
  }, [branches]);

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
    setUserCode('');
    setFileList({
      profile_photo: [],
      resume: [],
      degree_certificate: []
    });
    setCapturedImage('');
  };

  const handleUpload = (file, fileType) => {
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    const isDocument = file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Validate file types based on upload type
    if (fileType === 'profile_photo' && !isImage) {
      message.error('Profile photo must be an image!');
      return false;
    }

    if (fileType === 'resume' && !(isPDF || isDocument)) {
      message.error('Resume must be a PDF or Word document!');
      return false;
    }

    if (fileType === 'degree_certificate' && !(isPDF || isImage)) {
      message.error('Degree certificate must be a PDF or image!');
      return false;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      message.error('File must be smaller than 5MB!');
      return false;
    }

    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'uploading',
      originFileObj: file,
      type: fileType
    };

    setFileList(prev => ({
      ...prev,
      [fileType]: [newFile]
    }));

    // For profile photo, also update captured image preview
    if (fileType === 'profile_photo') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }

    // Simulate upload progress
    setTimeout(() => {
      setFileList(prev => ({
        ...prev,
        [fileType]: [{ ...newFile, status: 'done' }]
      }));
    }, 1500);

    return false;
  };

  const handleRemove = (file) => {
    setFileList(prev => ({
      ...prev,
      [file.type]: []
    }));
    
    // Clear captured image if it's profile photo
    if (file.type === 'profile_photo') {
      setCapturedImage('');
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewTitle(file.name || file.url?.substring(file.url?.lastIndexOf('/') + 1));
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

      const formData = new FormData();
      formData.append("branches", JSON.stringify(selectedBranches))
      
      // Append all form values
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          // Handle date field
          if (key === 'joining_date' && values[key]) {
            formData.append(key, values[key].format('YYYY-MM-DD'));
          } else {
            formData.append(key, values[key]);
          }
        }
      });

      // Append files from fileList
      Object.entries(fileList).forEach(([type, files]) => {
        if (files.length > 0 && files[0].originFileObj) {
          formData.append(type, files[0].originFileObj);
        } else if (files.length > 0 && files[0].url) {
          // This is an existing file that hasn't been changed
          formData.append(`${type}_url`, files[0].url);
        }
      });

      if (editingUser) {
        await updateUser(editingUser.id, formData);
        Swal.fire({
          icon: 'success',
          title: 'User Updated',
          text: 'The user has been updated successfully.',
          confirmButtonColor: '#3085d6'
        });
      } else {
        await createUser(formData);
        Swal.fire({
          icon: 'success',
          title: 'User Created',
          text: 'New user has been created successfully.',
          confirmButtonColor: '#3085d6'
        });
      }

      handleCancel();
      fetchData();
    } catch (error) {
      console.log('Error saving user:', error.message);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: error?.message || 'An error occurred while saving the user.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete the user.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteUser(id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'User has been deleted successfully.',
          confirmButtonColor: '#3085d6'
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'An error occurred while deleting the user.',
          confirmButtonColor: '#d33'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getUploadProps = (fileType) => ({
    onRemove: () => handleRemove({ type: fileType }),
    beforeUpload: (file) => handleUpload(file, fileType),
    fileList: fileList[fileType],
    listType: "picture-card",
    onPreview: handlePreview,
    multiple: false,
    maxCount: 1,
    accept: fileType === 'profile_photo' ? 'image/*' :
      fileType === 'resume' ? '.pdf,.doc,.docx' :
        '.pdf,.jpg,.jpeg,.png'
  });

  const handleTableChange = (pagination) => {
    setPagination(pagination);
    fetchData({
      page: pagination.current,
      limit: pagination.pageSize
    });
  };

  const columns = [
    {
      title: 'Profile',
      dataIndex: 'profile_photo_url',
      key: 'profile',
      width: 80,
      fixed: 'left',
      render: (profile_photo_url, record) => (
        <Avatar
          src={
            profile_photo_url ? (
              <Image
                src={profile_photo_url}
                alt={`${record.first_name} ${record.last_name}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                preview={{
                  src: profile_photo_url,
                  mask: <EyeOutlined />
                }}
              />
            ) : null
          }
          icon={!profile_photo_url && <UserOutlined />}
          size="large"
          style={{
            backgroundColor: profile_photo_url ? 'transparent' : roots.ebony[400],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )
    },
    {
      title: 'User Code',
      dataIndex: 'user_code',
      key: 'user_code',
      width: 120,
      render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
    },
    {
      title: 'Full Name',
      key: 'full_name',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{`${record.first_name} ${record.last_name}`}</div>
          <Text type="secondary">{record.username}</Text>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.email}</div>
          <Text type="secondary">{record.phone}</Text>
        </div>
      )
    },
    {
      title: 'Company/Branch',
      key: 'company_branch',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.company_name}</div>
          <Text type="secondary">{record.branch_name}</Text>
        </div>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role_name',
      key: 'role',
      width: 150,
      render: (roleName) => (
        <Tag color={roots.teal[700]} style={{ color: roots.text.inverse }}>
          {roleName || 'Unknown'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      render: (isActive) => {
        const color = isActive === 1 ? roots.status.success.main : roots.status.error.main;
        const statusText = isActive === 1 ? 'Active' : 'Inactive';
        return (
          <Tag color={color} style={{ color: roots.text.inverse }}>
            {statusText}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
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
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { backgroundColor: roots.status.error.main, borderColor: roots.status.error.main } }}
          >
            {localStorage.getItem("userRole") === "super admin" && (
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: roots.status.error.main }}
              />
            )}
          </Popconfirm>
        </Space>
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
    .ant-upload-list-item-actions a {
      display: none !important;
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
    .profile-preview {
      text-align: center;
      margin-top: 8px;
    }
    .profile-preview-image {
      max-width: 100px;
      max-height: 100px;
      border-radius: 8px;
      border: 1px solid ${roots.ebony[200]};
    }
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <Spin spinning={loading}>
        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search users..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Filter by role"
                value={filters.role}
                onChange={handleRoleFilter}
                allowClear
                style={{ width: '100%' }}
                loading={loading}
              >
                {roles.map(role => (
                  <Option key={role.id} value={role.id}>{role.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Filter by status"
                value={filters.status}
                onChange={handleStatusFilter}
                allowClear
                style={{ width: '100%' }}
              >
                {statusOptions.map(status => (
                  <Option key={status.value} value={status.value}>{status.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Filter by company"
                value={filters.company}
                onChange={handleCompanyFilter}
                allowClear
                style={{ width: '100%' }}
                loading={loading}
              >
                {companies.map(company => (
                  <Option key={company.id} value={company.id}>{company.company_name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Filter by branch"
                value={filters.branch}
                onChange={handleBranchFilter}
                allowClear
                style={{ width: '100%' }}
                disabled={!filters.company}
                loading={loading}
              >
                {branches.map(branch => (
                  <Option key={branch.id} value={branch.id}>{branch.branch_name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  style={{ borderColor: roots.teal[500], color: roots.teal[600] }}
                >
                  Reset
                </Button>
                <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>
                  {filteredUsers.length} users
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
                Add User
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
            }}
            onChange={handleTableChange}
            scroll={{ x: 1500 }}
            rowKey="id"
            size="middle"
            loading={loading}
          />
        </Card>

        {/* User Modal */}
        <Modal
          title={editingUser ? "Edit User" : "Add New User"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
          destroyOnClose
        >
          <Spin spinning={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="First Name"
                    name="first_name"
                    rules={[{ required: true, message: 'Please input first name!' }]}
                  >
                    <Input onChange={onUserDetailsChange} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Last Name"
                    name="last_name"
                    rules={[{ required: true, message: 'Please input last name!' }]}
                  >
                    <Input onChange={onUserDetailsChange} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please input username!' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="User Code"
                    name="user_code"
                    rules={[{ required: true, message: 'User code required!' }]}
                  >
                    <Input readOnly value={userCode} />
                  </Form.Item>
                </Col>
              </Row>

              {!editingUser && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Password"
                      name="password"
                      rules={[
                        { required: true, message: 'Please input password!' },
                        {
                          pattern:
                            /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/,
                          message:
                            'Password must be at least 6 characters, include an uppercase letter, a number, and a symbol!',
                        },
                      ]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label="Confirm Password"
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Please confirm your password!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error('Passwords do not match!')
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please input email!' },
                      { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[
                      { required: true, message: 'Please input phone number!' },
                      { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
                    ]}
                  >
                    <Input maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Role"
                    name="role_id"
                    rules={[{ required: true, message: 'Please select role!' }]}
                  >
                    <Select>
                      {roles.map(role => (
                        <Option key={role.id} value={role.id}>{role.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Status"
                    name="status"
                    rules={[{ required: true, message: 'Please select status!' }]}
                  >
                    <Select>
                      {statusOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Company"
                    name="company_id"
                    rules={[{ required: true, message: 'Please select company!' }]}
                  >
                    <Select
                      onChange={async (value) => {
                        try {
                          await fetchBranches(value);
                          onUserDetailsChange();
                        } catch (error) {
                          console.error('Error loading branches:', error);
                          message.error('Failed to load branches');
                        }
                      }}
                    >
                      {companies.map(company => (
                        <Option key={company.id} value={company.id}>
                          {company.company_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Branch"
                    name="branch_id"
                    rules={[{ required: true, message: 'Please select branch!' }]}
                  >
                    <Select
                      onChange={onUserDetailsChange}
                      disabled={!form.getFieldValue('company_id')}
                      loading={loading}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {branches.map(branch => (
                        <Option key={branch.id} value={branch.id}>
                          {branch.branch_name} ({branch.branch_id})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={20}>
                  <Form.Item
                    label="Branches "
                    name="additional_branches"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select additional branches"
                      disabled={!form.getFieldValue('company_id') || form.getFieldValue('role_id') !== 7}
                      loading={loading}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={(values) => setSelectedBranches(values)}
                      maxTagCount={3}
                    >
                      {branches.map(branch => (
                        <Option key={branch.id} value={branch.id}>
                          {branch.branch_name} ({branch.branch_id})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>Personal Documents</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Aadhar Number"
                    name="aadhar"
                    rules={[
                      { required: true, message: 'Please input Aadhar number!' },
                      { pattern: /^[0-9]{12}$/, message: 'Please enter a valid 12-digit Aadhar number!' }
                    ]}
                  >
                    <Input prefix={<IdcardOutlined />} maxLength={12} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="PAN Number"
                    name="pan"
                    rules={[
                      { required: true, message: 'Please input PAN number!' },
                      { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Please enter a valid PAN number!' }
                    ]}
                  >
                    <Input prefix={<IdcardOutlined />} maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Permanent Address"
                name="permanent_address"
                rules={[{ required: true, message: 'Please input permanent address!' }]}
              >
                <Input.TextArea rows={3} prefix={<HomeOutlined />} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Reference Name"
                    name="reference_name"
                    rules={[{ required: true, message: 'Please input reference name!' }]}
                  >
                    <Input prefix={<ContactsOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Reference Contact"
                    name="reference_contact"
                    rules={[
                      { required: true, message: 'Please input reference contact!' },
                      { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
                    ]}
                  >
                    <Input prefix={<ContactsOutlined />} maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Joining Date"
                name="joining_date"
                rules={[{ required: true, message: 'Please select joining date!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Divider orientation="left" plain>Upload Documents</Divider>

              {/* Profile Photo Upload Section with Camera Capture */}
              <div className="upload-section">
                <div className="upload-section-title">Profile Photo</div>
                <Upload {...getUploadProps('profile_photo')}>
                  {fileList.profile_photo.length === 0 && (
                    <div>
                      <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                      <div style={{ marginTop: 8 }}>Upload Profile Photo</div>
                    </div>
                  )}
                </Upload>
                <div className="upload-actions">
                  <Button 
                    icon={<CameraOutlined />} 
                    onClick={() => openCameraModal('profile_photo')}
                    type="primary"
                  >
                    Capture Photo
                  </Button>
                  <Button 
                    icon={<UploadOutlined />}
                    onClick={() => document.querySelector('.ant-upload input[type="file"]')?.click()}
                  >
                    Upload File
                  </Button>
                </div>
                {capturedImage && (
                  <div className="profile-preview">
                    <Image
                      src={capturedImage}
                      width={100}
                      className="profile-preview-image"
                      preview={false}
                    />
                  </div>
                )}
              </div>

              {/* Resume Upload Section */}
              <div className="upload-section">
                <div className="upload-section-title">Resume (PDF/DOC)</div>
                <Upload {...getUploadProps('resume')}>
                  {fileList.resume.length === 0 && (
                    <Button icon={<UploadOutlined />}>Upload Resume</Button>
                  )}
                </Upload>
              </div>

              {/* Degree Certificate Upload Section with Camera Capture */}
              <div className="upload-section">
                <div className="upload-section-title">Degree Certificate (PDF/Image)</div>
                <Upload {...getUploadProps('degree_certificate')}>
                  {fileList.degree_certificate.length === 0 && (
                    <div>
                      <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                      <div style={{ marginTop: 8 }}>Upload Degree Certificate</div>
                    </div>
                  )}
                </Upload>
                <div className="upload-actions">
                  <Button 
                    icon={<CameraOutlined />} 
                    onClick={() => openCameraModal('degree_certificate')}
                    type="primary"
                  >
                    Capture Document
                  </Button>
                  <Button 
                    icon={<UploadOutlined />}
                    onClick={() => document.querySelector('.ant-upload input[type="file"]')?.click()}
                  >
                    Upload File
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
                    {editingUser ? 'Update User' : 'Add User'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Spin>
        </Modal>

        {/* Camera Capture Modal */}
        <Modal
          title={`Capture ${currentCaptureType === 'profile_photo' ? 'Profile Photo' : 'Degree Certificate'}`}
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
            Position the {currentCaptureType === 'profile_photo' ? 'face' : 'document'} clearly in the frame and click the capture button
          </div>
        </Modal>

        {/* Document Preview Modal */}
        <Modal
          open={previewVisible}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          {previewImage && (
            previewImage.endsWith('.pdf') ? (
              <iframe
                src={previewImage}
                style={{ width: '100%', height: '500px' }}
                title="Document Preview"
              />
            ) : (
              <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
            )
          )}
        </Modal>
      </Spin>
    </div>
  );
};

export default UserCreation;