import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Spin,
  Tag
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { createState, getAllState } from '../../api/services/AccountsService';

const State = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Fetch states
  const fetchStates = async (search = '') => {
    try {
      setLoading(true);
      const response = await getAllState({ search });
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

  useEffect(() => {
    fetchStates();
  }, []);

  // Handle create state
  const handleCreate = async (values) => {
    try {
      setLoading(true);
      const response = await createState(values);
      
      if (response.success) {
        message.success('State created successfully');
        setCreateModalVisible(false);
        form.resetFields();
        fetchStates(); // Refresh the list
      } else {
        message.error(response.message || 'Failed to create state');
      }
    } catch (error) {
      console.error('Error creating state:', error);
      message.error(error.response?.data?.message || 'Failed to create state');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchStates(value);
  };

  // View state details
  const handleView = (record) => {
    setSelectedState(record);
    setViewModalVisible(true);
  };

  // Reset form when modal closes
  const handleCreateModalClose = () => {
    setCreateModalVisible(false);
    form.resetFields();
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'State Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'State Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      sorter: (a, b) => a.code - b.code,
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    // {
    //   title: 'Created Date',
    //   dataIndex: 'created_at',
    //   key: 'created_at',
    //   width: 120,
    //   render: (date) => {
    //     if (!date) return 'N/A';
    //     const dateObj = new Date(date);
    //     return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toISOString().split('T')[0];
    //   },
    // },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="State Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create State
          </Button>
        }
      >
        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by state name or code"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        {/* States Table */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={states}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} states`,
            }}
          />
        </Spin>
      </Card>

      {/* Create State Modal */}
      <Modal
        title="Create New State"
        open={createModalVisible}
        onCancel={handleCreateModalClose}
        footer={null}
        width={500}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* State Name */}
            <Form.Item
              label="State Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter state name' },
                { min: 2, message: 'State name must be at least 2 characters' },
                { max: 50, message: 'State name cannot exceed 50 characters' }
              ]}
            >
              <Input 
                placeholder="Enter state name" 
                maxLength={50}
                showCount
              />
            </Form.Item>

            {/* State Code */}
            <Form.Item
              label="State Code"
              name="code"
              rules={[
                { required: true, message: 'Please enter state code' },
                { type: 'number', min: 1, max: 99, message: 'State code must be between 1 and 99' }
              ]}
            >
              <InputNumber
                placeholder="Enter state code (1-99)"
                min={1}
                max={99}
                style={{ width: '100%' }}
                controls={false}
              />
            </Form.Item>
          </div>

          {/* Form Buttons */}
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleCreateModalClose}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<PlusOutlined />}
              >
                Create State
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* View State Modal */}
      <Modal
        title="State Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        {selectedState && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
            <div><strong>ID:</strong></div>
            <div>{selectedState.id}</div>

            <div><strong>State Name:</strong></div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedState.name}</div>

            <div><strong>State Code:</strong></div>
            <div>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                {selectedState.code}
              </Tag>
            </div>

            {selectedState.created_at && (
              <>
                <div><strong>Created Date:</strong></div>
                <div>
                  {(() => {
                    const dateObj = new Date(selectedState.created_at);
                    return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
                  })()}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default State;