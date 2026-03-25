import React, { useState, useEffect } from 'react';
import dayjs from "dayjs";
import {
  Table,
  Button,
  Card,
  Input,
  Space,
  Modal,
  Form,
  Select,
  message,
  Spin,
  Tag,
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { createReceipt, getAllReceipts } from '../../api/services/AccountsService';
import { getAllAccountHeads } from '../../api/services/AccountsService';

const { Option } = Select;
const { TextArea } = Input;

const AccountReceipt = () => {
  const [receipts, setReceipts] = useState([]);
  const [accountHeads, setAccountHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [form] = Form.useForm();

  // Receipt type options
  const receiptTypeOptions = [
    'General Receipt',
    'Advance from Customer',
    'Due collection'
  ];

  // Mode of receipt options
  const modeOfReceiptOptions = [
    'Cash',
    'Card',
    'Gpay',
    'Netbanking',
    'Cheque'
  ];

  // Fetch receipts
  const fetchReceipts = async (search = '') => {
    try {
      setLoading(true);
      const response = await getAllReceipts();
      if (response.success) {
        setReceipts(response.data);
      } else {
        message.error('Failed to fetch receipts');
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      message.error('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch account heads for dropdown
  const fetchAccountHeads = async () => {
    try {
      const response = await getAllAccountHeads({ search: '' });
      if (response.success) {
        setAccountHeads(response.data);
      } else {
        message.error('Failed to fetch account heads');
      }
    } catch (error) {
      console.error('Error fetching account heads:', error);
      message.error('Failed to fetch account heads');
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchAccountHeads();
  }, []);

  // Handle account code selection
  const handleAccountCodeChange = (value) => {
    const selectedAccount = accountHeads.find(account => account.account_code === value);
    setSelectedAccount(selectedAccount);
    
    // Auto-fill form fields with account details
    if (selectedAccount) {
      form.setFieldsValue({
        account_name: selectedAccount.head_name,
        address: selectedAccount.address,
        gst_no: selectedAccount.gst_no
      });
    }
  };

  // Handle create receipt
  const handleCreate = async (values) => {
    try {
      setLoading(true);
      const response = await createReceipt(values);
      
      if (response.success) {
        message.success('Receipt created successfully');
        setCreateModalVisible(false);
        form.resetFields();
        setSelectedAccount(null);
        fetchReceipts(); // Refresh the list
      } else {
        message.error(response.message || 'Failed to create receipt');
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      message.error('Failed to create receipt');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchReceipts(value);
  };

  // View receipt details
  const handleView = (record) => {
    setSelectedReceipt(record);
    setViewModalVisible(true);
  };

  // Reset form when modal closes
  const handleCreateModalClose = () => {
    setCreateModalVisible(false);
    form.resetFields();
    setSelectedAccount(null);
  };

  // Table columns
  const columns = [
    {
      title: 'Ref No',
      dataIndex: 'ref_no',
      key: 'ref_no',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Account Name',
      dataIndex: 'account_name',
      key: 'account_name',
      width: 150,
    },
    {
      title: 'Account Code',
      dataIndex: 'account_code',
      key: 'account_code',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => (
        <Tag color={type === 'Due collection' ? 'red' : type === 'Advance from Customer' ? 'orange' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Mode',
      dataIndex: 'mode_of_receipt',
      key: 'mode_of_receipt',
      width: 120,
      render: (mode) => (
        <Tag color="purple">{mode}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => `₹${parseFloat(amount).toLocaleString()}`,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => dayjs(date).format("DD-MM-YYYY HH:mm:ss")

    },
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
        title="Receipt Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Receipt
          </Button>
        }
      >
        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search receipts..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        {/* Receipts Table */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={receipts}
            rowKey="idPrimary"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        </Spin>
      </Card>

      {/* Create Receipt Modal */}
      <Modal
        title="Create New Receipt"
        open={createModalVisible}
        onCancel={handleCreateModalClose}
        footer={null}
        width={700}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Account Code (Primary field) */}
            <Form.Item
              label="Account Code"
              name="account_code"
              rules={[{ required: true, message: 'Please select account code' }]}
              style={{ gridColumn: '1 / -1' }}
            >
              <Select
                placeholder="Select account code"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                onChange={handleAccountCodeChange}
              >
                {accountHeads.map(account => (
                  <Option key={account.account_code} value={account.account_code}>
                    {account.account_code} - {account.head_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Auto-filled Account Details */}
            {selectedAccount && (
              <>
                <Form.Item label="Account Name" style={{ marginBottom: 8 }}>
                  <Input value={selectedAccount.head_name} disabled />
                </Form.Item>
                <Form.Item label="GST No" style={{ marginBottom: 8 }}>
                  <Input value={selectedAccount.gst_no || 'N/A'} disabled />
                </Form.Item>
                <Form.Item label="Address" style={{ gridColumn: '1 / -1', marginBottom: 8 }}>
                  <TextArea 
                    value={selectedAccount.address || 'N/A'} 
                    disabled 
                    rows={2}
                  />
                </Form.Item>
              </>
            )}

            {/* Receipt Type */}
            <Form.Item
              label="Receipt Type"
              name="type"
              rules={[{ required: true, message: 'Please select receipt type' }]}
            >
              <Select placeholder="Select receipt type">
                {receiptTypeOptions.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* Mode of Receipt */}
            <Form.Item
              label="Mode of Receipt"
              name="mode_of_receipt"
              rules={[{ required: true, message: 'Please select mode of receipt' }]}
            >
              <Select placeholder="Select mode of receipt">
                {modeOfReceiptOptions.map(mode => (
                  <Option key={mode} value={mode}>{mode}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* Amount */}
            <Form.Item
              label="Amount"
              name="amount"
              rules={[
                { required: true, message: 'Please enter amount' },
                { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter valid amount' }
              ]}
            >
              <Input 
                type="number" 
                placeholder="Enter amount" 
                step="0.01"
                prefix="₹"
              />
            </Form.Item>

            {/* Narration */}
            <Form.Item
              label="Narration"
              name="narration"
              style={{ gridColumn: '1 / -1' }}
            >
              <TextArea 
                placeholder="Enter narration/details" 
                rows={3}
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
                icon={<FileTextOutlined />}
              >
                Create Receipt
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* View Receipt Modal */}
      <Modal
        title="Receipt Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedReceipt && (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Reference No">
              <Tag color="blue">{selectedReceipt.ref_no}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Account Code">
              {selectedReceipt.account_code}
            </Descriptions.Item>
            <Descriptions.Item label="Account Name">
              {selectedReceipt.account_name}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {selectedReceipt.address || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="GST No">
              {selectedReceipt.gst_no || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Receipt Type">
              <Tag color={
                selectedReceipt.type === 'Due collection' ? 'red' : 
                selectedReceipt.type === 'Advance from Customer' ? 'orange' : 'green'
              }>
                {selectedReceipt.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mode of Receipt">
              <Tag color="purple">{selectedReceipt.mode_of_receipt}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <strong>₹{parseFloat(selectedReceipt.amount).toLocaleString()}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Narration">
              {selectedReceipt.narration || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
            {dayjs(selectedReceipt.created_at).format("DD-MM-YYYY hh:mm A")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AccountReceipt;