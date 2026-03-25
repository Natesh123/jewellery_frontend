import React, { useState, useEffect } from 'react';
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
  Tabs
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { createAccountHead, getAllAccountHeads } from '../../api/services/AccountsService';
import { getMasterGroup } from '../../api/services/AccountsService';
import { getAllState } from '../../api/services/AccountsService'; // Add state API
import { getMeltingWages, updateMeltingWages } from '../../api/services/MeltingPurchaseService';

const { Option } = Select;
const { TabPane } = Tabs;

const AccountHead = () => {
  const [accountHeads, setAccountHeads] = useState([]);
  const [groupings, setGroupings] = useState([]);
  const [states, setStates] = useState([]); // State for states data
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedState, setSelectedState] = useState(null); // Track selected state
  const [form] = Form.useForm();

  // Manage account details
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedManageAccount, setSelectedManageAccount] = useState(null);
  const [manageForm] = Form.useForm();
  const [wagesInfo, setWagesInfo] = useState({ pending: [], history: [] });

  // Payment types and modes
  const paymentTypes = [
    { value: 'cash', label: 'Cash', icon: '💰' },
    { value: 'gpay', label: 'GPay', icon: '📱' },
    { value: 'cheque', label: 'Cheque', icon: '🏦' },
    { value: 'card', label: 'Card', icon: '💳' }
  ];

  const paymentModes = [
    { value: 'full', label: 'Full Payment' },
    { value: 'partial', label: 'Partial Payment' },
    { value: 'due', label: 'Due Payment' }
  ];

  const handlePaymentModeChange = (value) => {
    const total = manageForm.getFieldValue('total_amount') || 0;

    if (value === 'due') {
      manageForm.setFieldsValue({
        paid_amount: 0,
        due_amount: total
      });
    } else if (value === 'full') {
      manageForm.setFieldsValue({
        paid_amount: total,
        due_amount: 0
      });
    } else if (value === 'partial') {
      const currentPaid = manageForm.getFieldValue('paid_amount') || 0;
      const currentDue = total - currentPaid;
      manageForm.setFieldsValue({
        due_amount: currentDue > 0 ? currentDue : 0
      });
    }
  };

  const handleAmountChange = (e) => {
    const total = manageForm.getFieldValue('total_amount') || 0;
    const paid = parseFloat(e.target.value) || 0;

    // Ensure paid amount doesn't exceed total for partial payment (optional check)
    // if (paid > total) { ... }

    const due = total - paid;
    manageForm.setFieldsValue({
      due_amount: due > 0 ? due : 0
    });
  };

  const handleManage = async (record) => {
    setSelectedManageAccount(record);
    setManageModalVisible(true);
    setLoading(true);

    try {
      // Fetch wages data for the smith in format "Name - Code"
      const smithIdentifier = `${record.head_name} - ${record.account_code}`;
      const response = await getMeltingWages({ assign_smith_name: smithIdentifier });

      // Handle both full response and inner data response
      const data = response.success ? response.data : response;
      const totalAmount = data.totalWages || 0;

      setWagesInfo({
        pending: data.data || [],
        history: data.history || []
      });

      manageForm.setFieldsValue({
        total_amount: totalAmount,
        paid_amount: totalAmount,
        due_amount: 0.00,
        payment_mode: 'full',
        payment_type: 'cash'
      });
    } catch (error) {
      console.error('Error fetching wages:', error);
      message.error('Error fetching wages data');
      handleManageModalClose();
    } finally {
      setLoading(false);
    }
  };

  const handleManageModalClose = () => {
    setManageModalVisible(false);
    manageForm.resetFields();
    setSelectedManageAccount(null);
    setWagesInfo({ pending: [], history: [] });
  };

  const handleCompleteAssignment = async (values) => {
    try {
      setLoading(true);
      const payload = {
        assign_smith_name: `${selectedManageAccount.head_name} - ${selectedManageAccount.account_code}`,
        amount: values.paid_amount,
        description: `Wages paid for ${selectedManageAccount.head_name}`,
        balanceAmt: values.due_amount,
        mode: values.payment_type
      };

      const response = await updateMeltingWages(payload);

      if (response.success) {
        message.success('Wages Completed Successfully');
        handleManageModalClose();
      } else {
        message.error(response.message || 'Failed to complete wages');
      }
    } catch (error) {
      console.error('Error completing wages:', error);
      message.error('Failed to complete wages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch account heads
  const fetchAccountHeads = async (search = '') => {
    try {
      setLoading(true);
      const response = await getAllAccountHeads({ search });
      if (response.success) {
        setAccountHeads(response.data);
      } else {
        message.error('Failed to fetch account heads');
      }
    } catch (error) {
      console.error('Error fetching account heads:', error);
      message.error('Failed to fetch account heads');
    } finally {
      setLoading(false);
    }
  };

  // Fetch master groupings for group name dropdown
  const fetchMasterGroupings = async () => {
    try {
      const response = await getMasterGroup({ search: '' });
      if (response.success) {
        setGroupings(response.data);
      } else {
        message.error('Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching master groupings:', error);
      message.error('Failed to fetch groups');
    }
  };

  // Fetch states for state dropdown
  const fetchStates = async () => {
    try {
      const response = await getAllState({ search: '' });
      if (response.success) {
        setStates(response.data);
      } else {
        message.error('Failed to fetch states');
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      message.error('Failed to fetch states');
    }
  };

  useEffect(() => {
    fetchAccountHeads();
    fetchMasterGroupings();
    fetchStates();
  }, []);

  // Handle state selection change
  const handleStateChange = (value) => {
    const selectedState = states.find(state => state.name === value);
    setSelectedState(selectedState);

    // Auto-fill state code when state is selected
    if (selectedState) {
      form.setFieldsValue({
        state_code: selectedState.code
      });
    } else {
      // Clear state code if no state selected
      form.setFieldsValue({
        state_code: undefined
      });
    }
  };

  // Handle create account head
  const handleCreate = async (values) => {
    try {
      setLoading(true);
      const response = await createAccountHead(values);

      if (response.success) {
        message.success('Account head created successfully');
        setCreateModalVisible(false);
        form.resetFields();
        setSelectedState(null); // Reset selected state
        fetchAccountHeads(); // Refresh the list
      } else {
        message.error(response.message || 'Failed to create account head');
      }
    } catch (error) {
      console.error('Error creating account head:', error);
      message.error('Failed to create account head');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchAccountHeads(value);
  };

  // View account details
  const handleView = (record) => {
    setSelectedAccount(record);
    setViewModalVisible(true);
  };

  // Reset form when modal closes
  const handleCreateModalClose = () => {
    setCreateModalVisible(false);
    form.resetFields();
    setSelectedState(null);
  };

  // Table columns
  const columns = [
    {
      title: 'Account Code',
      dataIndex: 'account_code',
      key: 'account_code',
      width: 120,
    },
    {
      title: 'Group Name',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 120,
    },
    {
      title: 'Head Name',
      dataIndex: 'head_name',
      key: 'head_name',
      width: 150,
    },
    {
      title: 'Phone No',
      dataIndex: 'phone_no',
      key: 'phone_no',
      width: 120,
    },
    {
      title: 'GST No',
      dataIndex: 'gst_no',
      key: 'gst_no',
      width: 120,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 100,
    },
    {
      title: 'State Code',
      dataIndex: 'state_code',
      key: 'state_code',
      width: 100,
      render: (code) => code ? <Tag color="green">{code}</Tag> : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
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
          {record.account_code?.startsWith('S09') && (
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => handleManage(record)}
              size="small"
              style={{ backgroundColor: '#fa4a14ff', borderColor: '#faad14', marginLeft: '10px' }}
            >
              Wages
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Account Head Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Account Head
          </Button>
        }
      >
        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by head name or account code"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        {/* Account Heads Table */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={accountHeads}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={false}
          />
        </Spin>
      </Card>

      {/* Create Account Head Modal */}
      <Modal
        title="Create Account Head"
        open={createModalVisible}
        onCancel={handleCreateModalClose}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Group Name */}
            <Form.Item
              label="Group Name"
              name="group_name"
              rules={[{ required: true, message: 'Please select group name' }]}
            >
              <Select
                placeholder="Select group name"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {groupings.map(group => (
                  <Option key={group.id} value={group.group_name}>
                    {group.group_name} ({group.group_code})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Head Name */}
            <Form.Item
              label="Head Name"
              name="head_name"
              rules={[{ required: true, message: 'Please enter head name' }]}
            >
              <Input placeholder="Enter head name" />
            </Form.Item>

            {/* Address */}
            <Form.Item
              label="Address"
              name="address"
              style={{ gridColumn: '1 / -1' }}
            >
              <Input.TextArea placeholder="Enter address" rows={3} />
            </Form.Item>

            {/* GST No */}
            <Form.Item
              label="GST No"
              name="gst_no"
            >
              <Input placeholder="Enter GST number" />
            </Form.Item>

            {/* Phone No */}
            <Form.Item
              label="Phone No"
              name="phone_no"
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>

            {/* GST Type */}
            <Form.Item
              label="GST Type"
              name="gst_type"
            >
              <Select placeholder="Select GST type">
                <Option value="Regular">Regular</Option>
                <Option value="Composition">Composition</Option>
                <Option value="Unregistered">Unregistered</Option>
              </Select>
            </Form.Item>

            {/* State */}
            <Form.Item
              label="State"
              name="state"
            >
              <Select
                placeholder="Select state"
                showSearch
                onChange={handleStateChange}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {states.map(state => (
                  <Option key={state.id} value={state.name}>
                    {state.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* State Code (Auto-filled) */}
            <Form.Item
              label="State Code"
              name="state_code"
            >
              <Input
                placeholder="Auto-filled from state"
                disabled
                value={selectedState?.code}
              />
            </Form.Item>
          </div>

          {/* Form Buttons */}
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={handleCreateModalClose}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Account Head
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* View Account Head Modal */}
      <Modal
        title="Account Head Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        {selectedAccount && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><strong>Account Code:</strong></div>
            <div><Tag color="blue">{selectedAccount.account_code}</Tag></div>

            <div><strong>Group Name:</strong></div>
            <div>{selectedAccount.group_name}</div>

            <div><strong>Head Name:</strong></div>
            <div>{selectedAccount.head_name}</div>

            <div><strong>Phone No:</strong></div>
            <div>{selectedAccount.phone_no || 'N/A'}</div>

            <div><strong>GST No:</strong></div>
            <div>{selectedAccount.gst_no || 'N/A'}</div>

            <div><strong>GST Type:</strong></div>
            <div>{selectedAccount.gst_type || 'N/A'}</div>

            <div><strong>State:</strong></div>
            <div>{selectedAccount.state || 'N/A'}</div>

            <div><strong>State Code:</strong></div>
            <div>
              {selectedAccount.state_code ? (
                <Tag color="green">{selectedAccount.state_code}</Tag>
              ) : (
                'N/A'
              )}
            </div>

            {selectedAccount.address && (
              <>
                <div><strong>Address:</strong></div>
                <div style={{ gridColumn: '2', whiteSpace: 'pre-wrap' }}>
                  {selectedAccount.address}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Manage Account Modal */}
      <Modal
        title={<div style={{ fontSize: '18px', fontWeight: '600', color: '#1a3353' }}>Wages Management</div>}
        open={manageModalVisible}
        onCancel={handleManageModalClose}
        footer={null}
        width={900}
        centered
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Spin spinning={loading} tip="Fetching wages data...">
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            {/* Info Cards */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e1e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ color: '#5f7d95', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Smith / Account</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a3353' }}>{selectedManageAccount?.head_name}</div>
              <div style={{ color: '#5f7d95', fontSize: '13px' }}>{selectedManageAccount?.account_code}</div>
            </div>

            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, #fff5f2 0%, #ffe8e0 100%)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #ffdbd0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'right'
            }}>
              <div style={{ color: '#fa4a14ff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Total Pending Wages</div>
              <div style={{ color: '#fa4a14ff', fontSize: '32px', fontWeight: '800' }}>
                ₹ {manageForm.getFieldValue('total_amount')?.toLocaleString('en-IN') || '0.00'}
              </div>
            </div>
          </div>

          <Tabs defaultActiveKey="payment" type="card" className="wages-tabs">
            <TabPane tab="Process Payment" key="payment">
              <Form
                form={manageForm}
                layout="vertical"
                onFinish={handleCompleteAssignment}
              >
                <div style={{
                  background: '#f8fafc',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginTop: '8px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                    <Form.Item
                      label={<span style={{ fontWeight: '600' }}>Payment Mode</span>}
                      name="payment_mode"
                      rules={[{ required: true, message: 'Please select payment mode' }]}
                    >
                      <Select
                        placeholder="Select Payment Mode"
                        size="large"
                        onChange={handlePaymentModeChange}
                        style={{ width: '100%' }}
                      >
                        {paymentModes.map(mode => (
                          <Option key={mode.value} value={mode.value}>
                            {mode.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label={<span style={{ fontWeight: '600' }}>Payment Type</span>}
                      name="payment_type"
                      rules={[{ required: true, message: 'Please select payment type' }]}
                    >
                      <Select placeholder="Select Payment Type" size="large" style={{ width: '100%' }}>
                        {paymentTypes.map(type => (
                          <Option key={type.value} value={type.value}>
                            <span style={{ marginRight: 8 }}>{type.icon}</span>
                            {type.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                    <Form.Item
                      label={<span style={{ fontWeight: '600' }}>Total Amount (₹)</span>}
                      name="total_amount"
                    >
                      <Input
                        size="large"
                        disabled
                        style={{ backgroundColor: '#edf2f7', color: '#4a5568', fontWeight: '600', border: '1px solid #cbd5e0' }}
                      />
                    </Form.Item>

                    <Form.Item
                      label={<span style={{ fontWeight: '600' }}>Paid Amount (₹)</span>}
                      name="paid_amount"
                      rules={[{ required: true, message: 'Please enter paid amount' }]}
                    >
                      <Input size="large" onChange={handleAmountChange} placeholder="0.00" style={{ border: '1px solid #fa4a14ff' }} />
                    </Form.Item>

                    <Form.Item
                      label={<span style={{ fontWeight: '600' }}>Due Amount (₹)</span>}
                      name="due_amount"
                    >
                      <Input
                        size="large"
                        disabled
                        style={{ backgroundColor: '#edf2f7', color: '#e53e3e', fontWeight: '600', border: '1px solid #cbd5e0' }}
                      />
                    </Form.Item>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '24px' }}>
                  <Space size="middle">
                    <Button onClick={handleManageModalClose} size="large" style={{ padding: '0 32px' }}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<CheckCircleOutlined />}
                      size="large"
                      style={{ backgroundColor: '#fa4a14ff', borderColor: '#fa4a14ff', padding: '0 32px', height: '45px', borderRadius: '8px' }}
                    >
                      Complete Wages Payment
                    </Button>
                  </Space>
                </div>
              </Form>
            </TabPane>

            <TabPane tab="Pending Items" key="items">
              <Table
                dataSource={wagesInfo.pending}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Metal', dataIndex: 'metal', key: 'metal' },
                  { title: 'Product', dataIndex: 'product', key: 'product' },
                  { title: 'Weight', dataIndex: 'weight', key: 'weight' },
                  { title: 'Wage', dataIndex: 'total_wage', key: 'total_wage', render: (val) => `₹${val}` },
                  { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (val) => new Date(val).toLocaleDateString('en-GB') },
                ]}
              />
            </TabPane>

            <TabPane tab="Payment History" key="history">
              <Table
                dataSource={wagesInfo.history}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (val) => new Date(val).toLocaleDateString('en-GB') },
                  { title: 'Mode', dataIndex: 'mode', key: 'mode' },
                  { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val) => `₹${val}` },
                  { title: 'Balance', dataIndex: 'balanceAmt', key: 'balanceAmt', render: (val) => `₹${val}` },
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                ]}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Modal>
    </div>
  );
};

export default AccountHead;