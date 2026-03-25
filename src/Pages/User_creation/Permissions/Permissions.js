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
  Tree,
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
import { sidebarItems } from '../../../config/sidebarItems';
import Swal from 'sweetalert2';
import {

  createRolePermission,
  updateRolePermission,
  deleteRolePermission,
  getAllRolePermissions
} from '../../../api/services/permissionService';

import { getRoles } from '../../../api/services/roleService';

const { Option } = Select;
const { Title } = Typography;
const { TreeNode } = Tree;

// Convert sidebar items to permission tree structure
const convertSidebarToPermissions = (items) => {
  return items.map(item => {
    const baseKey = item.path.replace(/\//g, ':').replace(/^:/, '');

    if (item.children) {
      return {
        key: baseKey,
        title: item.label,
        children: item.children.map(child => ({
          key: `${baseKey}:${child.path.replace(/\//g, ':').replace(/^:/, '')}`,
          title: child.label
        }))
      };
    }

    return {
      key: baseKey,
      title: item.label
    };
  });
};

const menuItems = convertSidebarToPermissions(sidebarItems);

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    role: ''
  });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setRolesLoading(true);

      const [rolesResponse, permissionsResponse] = await Promise.all([
        getRoles(1, 100),
        getAllRolePermissions()
      ]);

      // Debug the raw API responses
      console.log('Roles response:', rolesResponse);
      console.log('Permissions response:', permissionsResponse);

      const rolesData = rolesResponse?.roles || [];
      setRoles(rolesData);
      setRolesLoading(false);

      const permissionsData = permissionsResponse?.permissions || [];
      const enrichedPermissions = permissionsData.map(permission => {
        // Ensure we have a proper permission object
        if (!permission || typeof permission !== 'object') {
          console.warn('Invalid permission record:', permission);
          return {
            id: Date.now(), // temporary ID
            role_id: null,
            roleName: 'Invalid Record',
            permissions: [],
            created_at: new Date().toISOString()
          };
        }

        return {
          id: permission.id || Date.now(),
          role_id: permission.role_id || null,
          roleName: rolesData.find(role => role.id === permission.role_id)?.name || 'Unknown Role',
          permissions: Array.isArray(permission.permissions) ? permission.permissions : [],
          created_at: permission.created_at || new Date().toISOString()
        };
      });

      console.log('Enriched permissions:', enrichedPermissions);
      setPermissions(enrichedPermissions);
      setFilteredPermissions(enrichedPermissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles and permissions from backend
  useEffect(() => {


    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, permissions]);

  const applyFilters = () => {
    let filtered = [...permissions];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(perm =>
        perm.roleName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.role) {
      filtered = filtered.filter(perm => perm.roleId.toString() === filters.role);
    }

    setFilteredPermissions(filtered);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleRoleFilter = (value) => {
    setFilters(prev => ({ ...prev, role: value }));
  };

  const resetFilters = () => {
    setFilters({ search: '', role: '' });
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingPermission(null);
    form.resetFields();
    setSelectedKeys([]);
    setCheckedKeys([]);
    setExpandedKeys(menuItems.map(item => item.key));
    setAutoExpandParent(true);
  };

  const showEditModal = (permission) => {
    setIsModalVisible(true);
    setEditingPermission(permission);
    form.setFieldsValue({
      roleId: permission.role_id,
    });
    setCheckedKeys(Array.isArray(permission.permissions) ? permission.permissions : []);
    setExpandedKeys(menuItems.map(item => item.key));
    setAutoExpandParent(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingPermission(null);
    form.resetFields();
    setSelectedKeys([]);
    setCheckedKeys([]);
    setExpandedKeys([]);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This permission will be permanently deleted.',
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
        await deleteRolePermission(id);

        const updatedPermissions = permissions.filter(perm => perm.id !== id);
        setPermissions(updatedPermissions);
        setFilteredPermissions(updatedPermissions);

        await Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Permission has been deleted successfully.',
          confirmButtonColor: '#3085d6'
        });
      } catch (error) {
        console.error('Error deleting permission:', error);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'An error occurred while deleting the permission.',
          confirmButtonColor: '#d33'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const onCheck = (checkedKeys) => {
    setCheckedKeys(checkedKeys);
  };

  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  const onSelect = (selectedKeys) => {
    setSelectedKeys(selectedKeys);
  };
  useEffect(() => {
    console.log('Current permissions data:', permissions);
    console.log('Filtered permissions data:', filteredPermissions);
  }, [permissions, filteredPermissions]);

  const onFinish = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const permissionData = {
        roleId: values.roleId,
        permissions: Array.isArray(checkedKeys) ? checkedKeys : []
      };

      if (editingPermission) {
        // Update existing permission
        const response = await updateRolePermission(editingPermission.id, permissionData);

        const updatedPermissions = permissions.map(perm =>
          perm.id === editingPermission.id ? response.data : perm
        );
        fetchData(); // Refresh permissions

        await Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: 'Permission updated successfully.',
          confirmButtonColor: '#3085d6'
        });
      } else {
        // Create new permission
        const response = await createRolePermission(permissionData);
        const newPermission = response.data;

        setPermissions([...permissions, newPermission]);
        setFilteredPermissions([...permissions, newPermission]);

        await Swal.fire({
          icon: 'success',
          title: 'Created',
          text: 'Permission created successfully.',
          confirmButtonColor: '#3085d6'
        });
      }
      window.location.reload();

      handleCancel();
    } catch (error) {
      console.error('Error saving permission:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.message || 'Failed to save permission.',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };


  const renderTreeNodes = (data) =>
    data.map((item) => {
      if (item.children) {
        return (
          <TreeNode
            title={item.title}
            key={item.key}
            disableCheckbox={true}
          >
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={item.title} key={item.key} />;
    });

  const columns = [
    {
      title: 'Role',
      dataIndex: 'roleName',
      key: 'roleName',
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>,
      sorter: (a, b) => a.roleName.localeCompare(b.roleName)
    },
    {
      title: 'Permissions Count',
      key: 'permissionsCount',
      render: (_, record) => {
        if (!record || typeof record !== 'object') {
          console.warn('Invalid record in table:', record);
          return <Tag color="error">Invalid</Tag>;
        }
        const count = Array.isArray(record.permissions) ? record.permissions.length : 0;
        return (
          <Tag color={roots.teal[500]} style={{ color: roots.text.inverse }}>
            {count}
          </Tag>
        );
      },
      sorter: (a, b) => {
        const aPerms = Array.isArray(a?.permissions) ? a.permissions.length : 0;
        const bPerms = Array.isArray(b?.permissions) ? b.permissions.length : 0;
        return aPerms - bPerms;
      }
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
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
            tooltip="Edit Permission"
          />
          <Popconfirm
            title="Are you sure you want to delete this permission?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >

            {localStorage.getItem("userRole") === "super admin" && (
              <Button
                type="text"
                icon={<DeleteOutlined />}
                style={{ color: roots.status.error.main }}
                tooltip="Delete Permission"
              />
            )}

            {/* <Button
              type="text"
              icon={<DeleteOutlined />}
              style={{ color: roots.status.error.main }}
              tooltip="Delete Permission"
            /> */}
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
    .permission-tree {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid ${roots.ebony[200]};
      border-radius: 8px;
      max-height: 400px;
      overflow-y: auto;
    }
    .ant-tree-checkbox-checked .ant-tree-checkbox-inner {
      background-color: ${roots.teal[500]};
      border-color: ${roots.teal[500]};
    }
    .ant-tree-checkbox-wrapper:hover .ant-tree-checkbox-inner,
    .ant-tree-checkbox:hover .ant-tree-checkbox-inner,
    .ant-tree-checkbox-input:focus + .ant-tree-checkbox-inner {
      border-color: ${roots.teal[500]};
    }
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search permissions..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Role"
              value={filters.role}
              onChange={handleRoleFilter}
              allowClear
              style={{ width: '100%' }}
              loading={rolesLoading}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id.toString()}>{role.name}</Option>
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
                {filteredPermissions.length} permissions found
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
              Add New Permission
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredPermissions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} permissions`
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingPermission ? "Edit Permission" : "Add New Permission"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="roleId"
            label="Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select
              placeholder="Select Role"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              disabled={!!editingPermission}
              loading={rolesLoading}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Permissions"
            required
            rules={[{
              validator: (_, value) =>
                checkedKeys.length > 0
                  ? Promise.resolve()
                  : Promise.reject('Please select at least one permission!')
            }]}
          >
            <div className="permission-tree">
              <Tree
                checkable
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                onCheck={onCheck}
                checkedKeys={checkedKeys}
                onSelect={onSelect}
                selectedKeys={selectedKeys}
              >
                {renderTreeNodes(menuItems)}
              </Tree>
            </div>
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
                {editingPermission ? 'Update Permission' : 'Add Permission'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Permissions;