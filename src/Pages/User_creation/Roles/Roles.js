import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Popconfirm, 
  message,
  Select,
  Typography,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { roots } from '../../../colorConstant';
import { 
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  getRoleById
} from '../../../api/services/roleService';

import Swal from 'sweetalert2';

const { Option } = Select;
const { Title } = Typography;

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchRoles();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    applyFilters();
  }, [filters, roles]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      
      const response = await getRoles(params);
      setRoles(response.roles || []);
      setFilteredRoles(response.roles || []);
      setPagination({
        ...pagination,
        total: response.total || 0
      });
    } catch (error) {
      message.error('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...roles];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm) ||
        role.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(role => role.status === filters.status);
    }

    setFilteredRoles(filtered);
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleStatusFilter = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '' });
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingRole(null);
    form.resetFields();
  };

  const showEditModal = async (role) => {
    try {
      setLoading(true);
      const response = await getRoleById(role.id);
      
      setIsModalVisible(true);
      setEditingRole(response);
      form.setFieldsValue(response);
    } catch (error) {
      message.error('Failed to load role details');
      console.error('Error loading role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRole(null);
    form.resetFields();
  };

const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete the role.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  });

  if (result.isConfirmed) {
    try {
      setLoading(true);
      await deleteRole(id);
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Role has been deleted successfully.',
        confirmButtonColor: '#3085d6',
      });
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete role. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  }
};


const onFinish = async (values) => {
  try {
    setLoading(true);

    if (editingRole) {
      await updateRole(editingRole.id, values);
      Swal.fire({
        icon: 'success',
        title: 'Role Updated',
        text: 'Role updated successfully.',
        confirmButtonColor: '#3085d6',
      });
    } else {
      await createRole(values);
      Swal.fire({
        icon: 'success',
        title: 'Role Created',
        text: 'Role created successfully.',
        confirmButtonColor: '#3085d6',
      });
    }

    handleCancel();
    fetchRoles();
  } catch (error) {
    console.error('Error saving role:', error);
    Swal.fire({
      icon: 'error',
      title: 'Save Failed',
      text: error.response?.data?.message || 'Failed to save role.',
      confirmButtonColor: '#d33',
    });
  } finally {
    setLoading(false);
  }
};


  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? roots.teal[500] : roots.status.error.main}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Created By',
      dataIndex: 'created_by',
      key: 'created_by',
      ellipsis: true
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
            style={{ color: roots.teal[600] }}
          />
          {/* <Popconfirm 
            title="Are you sure you want to delete this role?" 
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              icon={<DeleteOutlined />}
              style={{ color: roots.status.error.main }}
            />
          </Popconfirm> */}
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
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <Spin spinning={loading}>
        {/* Filters */}
        <Card className="filter-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search roles..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={handleSearch}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by Status"
                value={filters.status}
                onChange={handleStatusFilter}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
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
                  {filteredRoles.length} roles found
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
                Add New Role
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
          <Table
            columns={columns}
            dataSource={filteredRoles}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`
            }}
            onChange={handleTableChange}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={editingRole ? "Edit Role" : "Add New Role"}
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          destroyOnClose
        >
          <Spin spinning={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <Form.Item
                name="name"
                label="Role Name"
                rules={[{ required: true, message: 'Please input role name!' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please input role description!' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginTop: '32px', textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    style={{ 
                      background: roots.gradient.gold, 
                      border: 'none',
                      boxShadow: roots.shadow.gold
                    }}
                  >
                    {editingRole ? 'Update Role' : 'Add Role'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Spin>
        </Modal>
      </Spin>
    </div>
  );
};

export default Roles;