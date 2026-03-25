import React, { useState, useEffect } from 'react';
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

import { uploadConfigUrl } from '../../api/apiUrl';

import Swal from 'sweetalert2';


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
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  searchBranches,
  filterBranchesByState,
  filterBranchesByCompany,
  getCompanies
} from '../../api/services/branchService';

const { Option } = Select;
const { Title } = Typography;

function generateBranchId(companyCode, branchName) {
  // Take first 2 letters of company code and first 2 letters of branch name
  const companyPart = companyCode.substring(0, 2).toUpperCase();
  const branchPart = branchName.substring(0, 2).toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${companyPart}${branchPart}-${randomNum}`;
}

const Branches = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [branchId, setBranchId] = useState('');
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    company: ''
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchCompanies();
    fetchBranches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, data]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await getCompanies();
      setCompanies(response.companies || []);
    } catch (error) {
      message.error('Failed to fetch companies');
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (params = {}) => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const response = await getBranches(current, pageSize, params);
      setData(response.branches || []);
      setFilteredData(response.branches || []);
      setPagination({
        ...pagination,
        total: response.total || 0
      });
    } catch (error) {
      message.error('Failed to fetch branches');
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleStateFilter = (value) => {
    setFilters(prev => ({ ...prev, state: value }));
  };

  const handleCompanyFilter = (value) => {
    setFilters(prev => ({ ...prev, company: value }));
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      
      if (filters.search) {
        const response = await searchBranches(filters.search);
        setFilteredData(response.data || []);
        return;
      }

      if (filters.state) {
        const response = await filterBranchesByState(filters.state);
        setFilteredData(response.data || []);
        return;
      }

      if (filters.company) {
        const response = await filterBranchesByCompany(filters.company);
        setFilteredData(response.data || []);
        return;
      }

      // No filters applied, show all data
      setFilteredData(data);
    } catch (error) {
      message.error('Failed to apply filters');
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ search: '', state: '', company: '' });
    fetchBranches();
  };

  const onCompanyChange = (value) => {
    const selectedCompany = companies.find(c => c.id === value);
    if (selectedCompany) {
      form.setFieldsValue({ company_name: selectedCompany.company_name });
      
      // Generate branch ID when company is selected and branch name exists
      const branchName = form.getFieldValue('branch_name');
      if (branchName) {
        const newBranchId = generateBranchId(selectedCompany.company_code, branchName);
        form.setFieldsValue({ branch_id: newBranchId });
        setBranchId(newBranchId);
      }
    }
  };

  const onBranchNameChange = (e) => {
    const branchName = e.target.value;
    const companyId = form.getFieldValue('company');
    
    if (companyId && branchName) {
      const selectedCompany = companies.find(c => c.id === companyId);
      if (selectedCompany) {
        const newBranchId = generateBranchId(selectedCompany.company_code, branchName);
        form.setFieldsValue({ branch_id: newBranchId });
        setBranchId(newBranchId);
      }
    }
  };

  const onStateChange = (value) => {
    const stateObj = statesList.find(s => s.name === value);
    form.setFieldsValue({ state_code: stateObj ? stateObj.code : '' });
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingRecord(null);
    form.resetFields();
    setBranchId('');
    setFileList([]);
  };

  const showEditModal = async (record) => {
    try {
      setLoading(true);
      const response = await getBranchById(record.id);
      const branchData = response;
      
      setIsModalVisible(true);
      setEditingRecord(branchData);
      
      form.setFieldsValue({ 
        ...branchData,
        company: branchData.company_id
      });
      setBranchId(branchData.branch_id);
      
      // Set file list if there are existing documents
      if (branchData.documents && branchData.documents.length > 0) {
        setFileList(branchData.documents.map((doc, index) => ({
          uid: doc.id || `-${index}`,
          name: doc.name || `document-${index}`,
          status: 'done',
          url: doc.url
        })));
      }
    } catch (error) {
      message.error('Failed to load branch details');
      console.error('Error loading branch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
    setBranchId('');
    setFileList([]);
  };

  const handleUpload = (file) => {
    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file
    };
    setFileList([...fileList, newFile]);
    return false; // Prevent default upload behavior
  };

  const handleRemove = (file) => {
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

const onFinish = async (values) => {
  try {
    setLoading(true);

    const selectedCompany = companies.find(c => c.id === values.company);

    const branchData = {
      ...values,
      company_id: values.company,
      company_name: selectedCompany?.company_name || '',
      branch_id: branchId,
      documents: fileList
    };

    if (editingRecord) {
      // Prepare data for update
      const updateData = {
        ...branchData,
        documentsToRemove: editingRecord.documents
          ?.filter(doc => !fileList.some(f => f.uid === doc.id))
          ?.map(doc => doc.id) || []
      };

      await updateBranch(editingRecord.id, updateData);
      Swal.fire({
        icon: 'success',
        title: 'Branch Updated',
        text: 'The branch has been updated successfully.',
        confirmButtonColor: '#3085d6'
      });
    } else {
      await createBranch(branchData);
      Swal.fire({
        icon: 'success',
        title: 'Branch Created',
        text: 'New branch has been created successfully.',
        confirmButtonColor: '#3085d6'
      });
    }

    handleCancel();
    fetchBranches();
  } catch (error) {
    console.error('Error saving branch:', error);
    Swal.fire({
      icon: 'error',
      title: 'Save Failed',
      text: error.response?.data?.message || 'An error occurred while saving the branch.',
      confirmButtonColor: '#d33'
    });
  } finally {
    setLoading(false);
  }
};


const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This action will permanently delete the branch.',
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
      await deleteBranch(id);
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Branch has been deleted successfully.',
        confirmButtonColor: '#3085d6'
      });
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'An error occurred while deleting the branch.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  }
};


  const handleTableChange = (pagination) => {
    setPagination(pagination);
    fetchBranches({
      page: pagination.current,
      limit: pagination.pageSize
    });
  };

  const columns = [
    {
      title: 'Branch Name',
      dataIndex: 'branch_name',
      key: 'branch_name',
      fixed: 'left',
      width: 180,
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Branch ID',
      dataIndex: 'branch_id',
      key: 'branch_id',
      width: 120,
      render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 180,
      render: (text) => <Tag color={roots.teal[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
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
            title="Are you sure you want to delete this branch?" 
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
      
      <Spin spinning={loading}>
        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="Search branches..."
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
                placeholder="Filter by Company"
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
                  {filteredData.length} branches found
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
                Add New Branch
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
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} branches`
            }}
            onChange={handleTableChange}
            scroll={{ x: 1500 }}
            rowKey="id"
            size="middle"
            loading={loading}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={editingRecord ? "Edit Branch" : "Add New Branch"}
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
                    label="Company"
                    name="company"
                    rules={[{ required: true, message: 'Please select Company!' }]}
                  >
                    <Select 
                      placeholder="Select Company"
                      onChange={onCompanyChange}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      loading={loading}
                    >
                      {companies.map(company => (
                        <Option key={company.id} value={company.id}>{company.company_name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Company Name"
                    name="company_name"
                  >
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Branch Name"
                    name="branch_name"
                    rules={[{ required: true, message: 'Please input Branch name!' }]}
                  >
                    <Input onChange={onBranchNameChange} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Branch ID"
                    name="branch_id"
                  >
                    <Input readOnly />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
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

              <div className="upload-section">
                <div className="upload-section-title">Branch Documents</div>
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
                    {editingRecord ? 'Update Branch' : 'Add Branch'}
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
      </Spin>
    </div>
  );
};

export default Branches;