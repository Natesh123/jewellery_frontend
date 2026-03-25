import React, { useEffect, useState } from 'react';
import api from '../../api/apiConfig/apiClient';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Modal,
  Form,
  InputNumber,
  Space,
  Row,
  Col,
  message
} from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { getLiveRate, updateLiveRate } from '../../api/services/LiveRateService';

const { Title, Text } = Typography;

const GoldSilverRate = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rateData, setRateData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper: safely convert to number
  const toNumber = (val, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  // 🟢 Fetch live rates from backend
  const fetchLiveRate = async () => {
    setLoading(true);
    try {
      const response = await getLiveRate();

      if (response) {
        const formatted = response.map((item) => ({
          id: item.id,
          type: `${item.metal_name} ${item.carat || ''}`.trim(),
          live_rate: toNumber(item.live_rate),
          discount: toNumber(item.discount),
          effective_rate: toNumber(item.live_rate) - toNumber(item.discount),
        }));
        setRateData(formatted);
      } else {
        message.error('Unexpected response format from backend');
      }
    } catch (error) {
      console.error('Error fetching live rates:', error);
      message.error('Failed to load live rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRate();
  }, []);

  // 🟡 Edit modal open
  const handleEdit = (record) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      live_rate: toNumber(record.live_rate, 0),
      discount: toNumber(record.discount, 0),
    });
    setIsModalVisible(true);
  };

  // 🔴 Modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  // 🟣 Submit updated rate
  const handleSubmit = async (values) => {
    const live_rate = toNumber(values.live_rate, null);
    const discount = toNumber(values.discount, null);

    if (live_rate === null || discount === null) {
      message.error('Please enter valid numeric values.');
      return;
    }
    if (live_rate < 0 || discount < 0) {
      message.error('Rate and Discount cannot be negative.');
      return;
    }

    try {
      await updateLiveRate(selectedRecord.id, { live_rate, discount });
      message.success(`${selectedRecord.type} updated successfully!`);
      handleModalClose();
      fetchLiveRate(); // Refresh table
    } catch (error) {
      console.error('Update error:', error);
      message.error('Failed to update rate.');
    }
  };

  // 🧾 Table columns
  const columns = [
    {
      title: 'Gold Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag
          color={type.toLowerCase().includes('silver') ? 'gray' : 'gold'}
          style={{ fontWeight: 'bold' }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Live Rate (₹)',
      dataIndex: 'live_rate',
      key: 'live_rate',
      render: (rate) => <Text strong style={{ color: '#52c41a' }}>₹ {rate}</Text>,
    },
    {
      title: 'Discount (₹)',
      dataIndex: 'discount',
      key: 'discount',
      render: (discount) => <Tag color="blue">₹ {discount}</Tag>,
    },
    {
      title: 'Effective Rate (₹)',
      dataIndex: 'effective_rate',
      key: 'effective_rate',
      render: (rate) => (
        <Text strong style={{ color: '#fa8c16' }}>₹ {parseFloat(rate).toFixed(2)}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Title level={3} style={{ margin: 0 }}>
              Gold & Silver Rate Management
            </Title>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchLiveRate}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Live Rates">
        <Table
          columns={columns}
          dataSource={rateData}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>

      <Modal
        title={`Update Rate - ${selectedRecord?.type || ''}`}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={400}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Live Rate (₹)"
            name="live_rate"
            rules={[
              { required: true, message: 'Please enter live rate!' },
              {
                validator: (_, value) =>
                  Number(value) < 0
                    ? Promise.reject('Rate cannot be negative!')
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Enter live rate" />
          </Form.Item>

          <Form.Item
            label="Discount (₹)"
            name="discount"
            rules={[
              { required: true, message: 'Please enter discount!' },
              {
                validator: (_, value) =>
                  Number(value) < 0
                    ? Promise.reject('Discount cannot be negative!')
                    : Promise.resolve(),
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Enter discount amount" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={handleModalClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<EditOutlined />}>
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GoldSilverRate;
