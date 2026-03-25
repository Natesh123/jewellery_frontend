import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
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
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  searchCompanies,
  filterCompaniesByState,
  filterCompaniesByTurnover
} from '../../api/services/companyService';

import { uploadConfigUrl } from '../../api/apiUrl';

const { Option } = Select;
const { Title } = Typography;

const turnoverOptions = [
  { label: 'Above 5 Crore', value: 'above_5_crore' },
  { label: 'Below 5 Crore', value: 'below_5_crore' },
  { label: 'Below 1 Crore', value: 'below_1_crore' }
];

function generateCompanyCode(name, existingCompanies = []) {
  if (!name) return '';
  
  // Get first two letters of company name
  const letters = name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Find all existing numbers for this prefix
  const existingNumbers = existingCompanies
    .filter(company => company.company_code?.startsWith(letters))
    .map(company => {
      const numPart = company.company_code.substring(2);
      return parseInt(numPart, 10);
    })
    .filter(number => !isNaN(number));

  // Calculate next number (start with 1 if no existing numbers)
  const nextNumber = existingNumbers.length > 0 
    ? Math.max(...existingNumbers) + 1 
    : 1;

  // Format with leading zeros (6 digits total)
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  
  return `${letters}${paddedNumber}`;
}

const Company_creation = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [companyCode, setCompanyCode] = useState('');
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    turnover: ''
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchCompanies();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search,
        state: filters.state,
        turnover: filters.turnover
      };
      
      const response = await getCompanies(params);
      
      setData(response.companies);
      setFilteredData(response.companies);
      setPagination({
        ...pagination,
        total: response.total
      });
    } catch (error) {
      message.error('Failed to fetch companies');
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...data];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(company => 
        company.company_name.toLowerCase().includes(searchTerm) ||
        company.company_code.toLowerCase().includes(searchTerm) ||
        company.gst_no.toLowerCase().includes(searchTerm) ||
        company.email.toLowerCase().includes(searchTerm));
    }
    
    // Apply state filter
    if (filters.state) {
      result = result.filter(company => company.state === filters.state);
    }
    
    // Apply turnover filter
    if (filters.turnover) {
      result = result.filter(company => company.turnover === filters.turnover);
    }
    
    setFilteredData(result);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, data]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination({ ...pagination, current: 1 });
  };

  const handleStateFilter = (value) => {
    setFilters(prev => ({ ...prev, state: value }));
    setPagination({ ...pagination, current: 1 });
  };

  const handleTurnoverFilter = (value) => {
    setFilters(prev => ({ ...prev, turnover: value }));
    setPagination({ ...pagination, current: 1 });
  };

  const resetFilters = () => {
    setFilters({ search: '', state: '', turnover: '' });
    setPagination({ ...pagination, current: 1 });
  };

  const onCompanyNameChange = (e) => {
    const name = e.target.value;
    const newCode = generateCompanyCode(name, data);
    form.setFieldsValue({ company_code: newCode });
    setCompanyCode(newCode);
  };

  const onStateChange = (value) => {
    const stateObj = statesList.find(s => s.name === value);
    form.setFieldsValue({ state_code: stateObj ? stateObj.code : '' });
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingRecord(null);
    form.resetFields();
    setCompanyCode('');
    setFileList([]);
  };

  const showEditModal = async (record) => {
    setLoading(true);
    try {
      const company = await getCompanyById(record.id);
      setIsModalVisible(true);
      setEditingRecord(company);
      form.setFieldsValue(company);
      setCompanyCode(company.company_code);
      
      if (company.documents && company.documents.length > 0) {
        setFileList(company.documents.map((doc, index) => ({
          uid: doc.id || `-${index}`,
          name: doc.name || `document-${index}`,
          status: 'done',
          url: doc.url,
          id: doc.id
        })));
      } else {
        setFileList([]);
      }
    } catch (error) {
      message.error('Failed to load company details');
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
    setCompanyCode('');
    setFileList([]);
  };

  const handleUpload = (file) => {
    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'uploading',
      originFileObj: file
    };
    setFileList([...fileList, newFile]);
    return false;
  };

  const handleRemove = async (file) => {
    if (file.id) {
      const newFileList = fileList.filter(f => f.uid !== file.uid);
      setFileList(newFileList);
      return true;
    } else {
      const newFileList = fileList.filter(f => f.uid !== file.uid);
      setFileList(newFileList);
      return true;
    }
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
    setLoading(true);
    try {
      const companyData = {
        ...values,
        documents: fileList.filter(file => !file.id),
        documentsToRemove: fileList
          .filter(file => file.id && !fileList.some(f => f.id === file.id))
          .map(file => file.id)
      };

      if (editingRecord) {
        await updateCompany(editingRecord.id, companyData);
        Swal.fire({
          icon: 'success',
          title: 'Company Updated',
          text: 'The company details were successfully updated.',
          confirmButtonColor: '#3085d6',
        });
      } else {
        await createCompany(companyData);
        Swal.fire({
          icon: 'success',
          title: 'Company Created',
          text: 'New company has been added successfully.',
          confirmButtonColor: '#3085d6',
        });
      }

      fetchCompanies();
      handleCancel();
    } catch (error) {
      console.error('Error saving company:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.message || 'An error occurred while saving the company.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the company.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await deleteCompany(id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Company has been deleted successfully.',
          confirmButtonColor: '#3085d6',
        });
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'An error occurred while deleting the company.',
          confirmButtonColor: '#d33',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      fixed: 'left',
      width: 180,
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Code',
      dataIndex: 'company_code',
      key: 'company_code',
      width: 100,
      render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
    },
    {
      title: 'GST No',
      dataIndex: 'gst_no',
      key: 'gst_no',
      width: 150
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 140,
      render: (text) => <Tag color={roots.teal[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
    },
    {
      title: 'Phone',
      dataIndex: 'phoneno',
      key: 'phoneno',
      width: 130
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Turnover',
      dataIndex: 'turnover',
      key: 'turnover',
      width: 150,
      render: (value) => {
        const option = turnoverOptions.find(opt => opt.value === value);
        const color = value === 'above_5_crore' ? roots.status.success.main : 
                      value === 'below_5_crore' ? roots.status.warning.main : 
                      roots.status.info.main;
        return <Tag color={color} style={{ color: roots.text.inverse }}>{option?.label || value}</Tag>;
      }
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
          <Popconfirm 
            title="Are you sure you want to delete this company?" 
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ style: { backgroundColor: roots.status.error.main } }}
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />}
              style={{ color: roots.status.error.main }}
            />
          </Popconfirm>
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
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Filters */}
      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search companies..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Filter by State"
              value={filters.state}
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
              placeholder="Filter by Turnover"
              value={filters.turnover}
              onChange={handleTurnoverFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {turnoverOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
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
                {pagination.total} companies found
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
              Add New Company
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Spin spinning={loading}>
        <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} companies`
            }}
            scroll={{ x: 1500 }}
            rowKey="id"
            size="middle"
            onChange={handleTableChange}
          />
        </Card>
      </Spin>

      {/* Modal */}
      <Modal
        title={editingRecord ? "Edit Company" : "Add New Company"}
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
            initialValues={{ turnover: 'below_5_crore' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Company Name"
                  name="company_name"
                  rules={[{ required: true, message: 'Please input company name!' }]}
                >
                  <Input onChange={onCompanyNameChange} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Company Code"
                  name="company_code"
                  rules={[{ required: true, message: 'Company code required!' }]}
                >
                  <Input readOnly value={companyCode} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="GST No"
                  name="gst_no"
                  rules={[
                    { required: true, message: 'Please input GST No!' },
                    { pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
                      message: 'Invalid GST format!' }
                  ]}
                >
                  <Input placeholder="22ABCDE1234F1Z5" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Phone No"
                  name="phoneno"
                  rules={[
                    { required: true, message: 'Please input Phone No!' },
                    { pattern: /^[0-9]{10}$/, message: 'Invalid phone number!' }
                  ]}
                >
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Address Line 1"
                  name="address1"
                  rules={[{ required: true, message: 'Please input Address 1!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Address Line 2"
                  name="address2"
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
                  rules={[{ required: true, message: 'Please input Area!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="City"
                  name="city"
                  rules={[{ required: true, message: 'Please input City!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Pincode"
                  name="pincode"
                  rules={[
                    { required: true, message: 'Please input Pincode!' },
                    { pattern: /^[0-9]{6}$/, message: 'Invalid pincode!' }
                  ]}
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
                  rules={[{ required: true, message: 'Please input District!' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="State"
                  name="state"
                  rules={[{ required: true, message: 'Please select State!' }]}
                >
                  <Select onChange={onStateChange} showSearch>
                    {statesList.map(s => (
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
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please input Email!' },
                    { type: 'email', message: 'Invalid email format!' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Turnover (Previous Year)"
                  name="turnover"
                  rules={[{ required: true, message: 'Please select Turnover!' }]}
                >
                  <Select>
                    {turnoverOptions.map(opt => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="upload-section">
              <div className="upload-section-title">Company Documents</div>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Upload Documents</Button>
              </Upload>
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
                  {editingRecord ? 'Update Company' : 'Add Company'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        title="Document Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="Preview" style={{ width: '100%' }} src={`${uploadConfigUrl}${previewImage}`} />
      </Modal>
    </div>
  );
};

export default Company_creation;