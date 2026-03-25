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
  Statistic,Avatar
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CameraOutlined,
  FilePdfOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import pledgeService from '../../api/services/pledgeService';
import { uploadConfigUrl, uploadConfigUrl2 } from '../../api/apiUrl';

const { Option } = Select;
const { Text } = Typography;
// Mock data
const metalOptions = ['Gold', 'Silver', 'Platinum', 'Palladium'];

const ReligionalManager = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(false);
   const [preview, setPreview] = useState(null);
  const [pledgeFilters, setPledgeFilters] = useState({
    search: '',
    metal: '',
    status: '',
    dateRange: []
  });
  const [filteredPledges, setFilteredPledges] = useState([]);
  const [productDetailsVisible, setProductDetailsVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);


  const showProductDetails = (products) => {
    setSelectedProducts(products);
    setProductDetailsVisible(true);
  };

  const fetchPledges = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await pledgeService.getAllRegionalManagerPledges(page, pageSize);
      const pledgesData = response.data || [];
      const paginationData = {
        current: response.page || page,
        pageSize: response.limit || pageSize,
        total: response.total || 0,
      };

      // Transform the API data to match the table structure
      const transformedPledges = pledgesData.map(pledge => ({
        key: pledge.id,
        pledge_id: pledge.pledge_id,
        date: new Date(pledge.created_at).toLocaleDateString(),
        customer_name: pledge.customer_data?.customer_name,
        customer_id: pledge.customer_id,
        metal: pledge.product_details?.[0]?.metal || 'Multiple',
        product: pledge.product_details?.[0]?.product || 'Multiple',
        sub_product: pledge.product_details?.[0]?.sub_product || 'Multiple',
        gross_weight: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0),
        net_weight: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.net_weight) || 0), 0),
        amount: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
        pledge_amount: pledge.pledge_amount,
        approval: pledge.regional_manager_status,
        bill: pledge.bill,
        ornament_photo: pledge.ornament_photo,
        products: pledge.product_details || [],
        interest_rate: pledge.interest_rate,
        current_interest: pledge.current_interest,
        total_payment: pledge.total_payment,
        remarks: pledge.remarks,
        user_data: pledge.user_data
      }));

      setPledges(transformedPledges);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching pledges:', error);
      message.error('Failed to fetch pledges');
    } finally {
      setLoading(false);
    }
  };
  // Load mock data
  useEffect(() => {
    fetchPledges();
    fetchExecutives()


    const mockPledges = [

    ];



    setPledges(mockPledges);
    setFilteredPledges(mockPledges);
  }, []);

  useEffect(() => {
    applyPledgeFilters();
  }, [pledgeFilters, pledges]);


  const applyPledgeFilters = () => {
    let filtered = [...pledges];

    if (pledgeFilters.search) {
      const searchTerm = pledgeFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.pledge_id?.toLowerCase().includes(searchTerm)
      );
    }

    if (pledgeFilters.metal) {
      filtered = filtered.filter(item =>
        item.metal?.toLowerCase() === pledgeFilters.metal.toLowerCase()
      );
    }

    if (pledgeFilters.status) {
      filtered = filtered.filter(item =>
        item.status?.toLowerCase() === pledgeFilters.status.toLowerCase()
      );
    }

    if (pledgeFilters.dateRange && pledgeFilters.dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const pledgeDate = new Date(item.date);
        return pledgeDate >= pledgeFilters.dateRange[0] &&
          pledgeDate <= pledgeFilters.dateRange[1];
      });
    }

    setFilteredPledges(filtered);
  };


  const handleDeletePledge = (key) => {
    setPledges(prev => prev.filter(item => item.key !== key));
    message.success('Pledge deleted successfully');
  };

  const resetPledgeFilters = () => {
    setPledgeFilters({
      search: '',
      metal: '',
      status: '',
      dateRange: []
    });
  };
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [executives, setExecutives] = useState([]);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [currentPledgeId, setCurrentPledgeId] = useState(null);

  // Function to fetch executives
  const fetchExecutives = async () => {
    try {
      setLoading(true);
      const response = await pledgeService.getOfficeExecutive();
      setExecutives(response);
    } catch (error) {
      message.error('Failed to fetch executives');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to open the modal and set the current pledge ID
  const showAssignModal = (pledgeId) => {
    setCurrentPledgeId(pledgeId);
    setIsAssignModalVisible(true);
    fetchExecutives(); // Fetch executives when modal opens
  };

  // Function to assign executive
  const handleAssign = async () => {
    if (!selectedExecutive) {
      message.warning('Please select an executive');
      return;
    }
    try {
      setLoading(true);
      await pledgeService.assigneRegigonalApproval(currentPledgeId, { regional_manager_status: selectedExecutive,user_id:localStorage.getItem("userId") });
      message.success('Updated successfully');
      fetchPledges()
      setIsAssignModalVisible(false);
      setSelectedExecutive(null);
    } catch (error) {
      message.error('Failed ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePledgePDF = (record) => {
    message.success(`Generating PDF for pledge ${record.pledge_id}`);
    // PDF generation logic would go here
  };

  const updatePledgeStatus = (key, status) => {
    setPledges(prev => prev.map(item =>
      item.key === key ? { ...item, status } : item
    ));
    message.success(`Pledge status updated to ${status}`);
  };

  const pledgeColumns = [
    {
      title: 'Pledge ID',
      dataIndex: 'pledge_id',
      key: 'pledge_id',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customer_id}</Text>
        </div>
      )
    },
    {
      title: 'Product Details',
      key: 'product_details',
      width: 200,
      render: (_, record) => (
        <div
          onClick={() => showProductDetails(record.products)}
          style={{ cursor: 'pointer', padding: '8px' }}
        >
          {record.products.length === 1 ? (
            <>
              <div><Text strong>{record.products[0].metal}</Text></div>
              <div> {record.products[0].sub_product}</div>
            </>
          ) : (
            <>
              <div><Text strong>Multiple Metals</Text></div>
              <div>{record.products.length} items (click to view)</div>
            </>
          )}
        </div>
      )
    },
    {
      title: 'Bill',
      key: 'bill',
      width: 80,
      render: (_, record) => {
        const photo = record?.bill;
        const src = photo ? `${uploadConfigUrl2}${photo}` : null;
        return (
          <>
            <Avatar
              src={src}
              size="large"
              icon={!photo && <CameraOutlined />}
              style={{
                backgroundColor: photo ? 'transparent' : roots.gold[400],
                color: roots.text.inverse
              }}
              onClick={() => photo && setPreview(src)}
            />
            <Modal
              open={!!preview}
              footer={null}
              onCancel={() => setPreview(null)}
            >
              <img alt="preview" src={preview} style={{ width: '100%' }} />
            </Modal>
          </>
        );
      }
    },
    {
      title: 'Ornament Photo',
      key: 'ornament_photo',
      width: 80,
      render: (_, record) => {
        const photo = record?.ornament_photo;
        const src = photo ? `${uploadConfigUrl2}${photo}` : null;
        return (
          <>
            <Avatar
              src={src}
              size="large"
              icon={!photo && <CameraOutlined />}
              style={{
                backgroundColor: photo ? 'transparent' : roots.gold[400],
                color: roots.text.inverse
              }}
              onClick={() => photo && setPreview(src)}
            />
            <Modal
              open={!!preview}
              footer={null}
              onCancel={() => setPreview(null)}
            >
              <img alt="preview" src={preview} style={{ width: '100%' }} />
            </Modal>
          </>
        );
      }
    },
    {
      title: 'Weight (g)',
      key: 'weight',
      width: 120,
      render: (_, record) => (
        <div>
          <div>Gross: {record.gross_weight.toFixed(3)}</div>
          <div>Net: {record.net_weight.toFixed(3)}</div>
        </div>
      )
    },
    {
      title: 'Amounts',
      key: 'amounts',
      width: 180,
      render: (_, record) => (
        <div>
          <div>Amount: ₹{record.amount.toFixed(2)}</div>
          <div>Pledge: ₹{record.pledge_amount}</div>
        </div>
      )
    },
    {
      title: 'Approved to General Manager',
      key: 'status',
      width: 120,
      render: (_, record) => {
        let color, text;
        switch (record.approval) {
          case '1':
            color = 'blue';
            text = 'Approved';
            break;
          case '2':
            color = 'orange';
            text = 'Processing';
            break;
          case '3':  // You might want to add this if you have more statuses
            color = 'red';
            text = 'Rejected';
            break;
          case '4':  // Example for rejected status
            color = 'red';
            text = 'Rejected';
            break;
          default:
            color = 'gray';
            text = 'Pending';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
        

          <Button
            type="link"
            icon={<UserAddOutlined />}
            onClick={() => showAssignModal(record.key)}
          />
         
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
    .customer-card {
      border: 1px solid ${roots.ebony[200]};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: ${roots.ebony[50]};
    }
    .webcam-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 16px;
    }
    .webcam-buttons {
      margin-top: 16px;
    }
    .stats-card {
      border-left: 4px solid ${roots.gold[500]};
      border-radius: 4px;
    }
    .pledge-table {
      margin-top: 24px;
    }
    .steps-container {
      margin-bottom: 24px;
    }
    .otp-section {
      margin: 16px 0;
      padding: 16px;
      background: ${roots.ebony[50]};
      border-radius: 8px;
    }
  `;
  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />



      {/* Pledge Filters */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Search by customer or pledge ID"
              prefix={<SearchOutlined />}
              value={pledgeFilters.search}
              onChange={(e) => setPledgeFilters(prev => ({ ...prev, search: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by metal"
              style={{ width: '100%' }}
              value={pledgeFilters.metal}
              onChange={(value) => setPledgeFilters(prev => ({ ...prev, metal: value }))}
              allowClear
            >
              {metalOptions.map(metal => (
                <Option key={metal} value={metal}>{metal}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={pledgeFilters.status}
              onChange={(value) => setPledgeFilters(prev => ({ ...prev, status: value }))}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="closed">Closed</Option>
              <Option value="pending_approval">Pending Approval</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={resetPledgeFilters}
            >
              Reset Filters
            </Button>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Statistic
              title="Total Pledges"
              value={filteredPledges.length}
              prefix={<FilePdfOutlined />}
              valueStyle={{ color: roots.gold[500] }}
            />
          </Col>
        </Row>
      </Card>

      {/* Pledge Table */}
      <div className="pledge-table">
        <Table
          columns={pledgeColumns}
          dataSource={filteredPledges}
          scroll={{ x: 1500 }}
          rowKey="key"
          bordered
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              fetchPledges(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              fetchPledges(current, size);
            }
          }}
        />
      </div>

      {/* Assign Executive Modal */}
      <Modal
        title="New Quotation Approved and send to General Manager"
        visible={isAssignModalVisible}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setSelectedExecutive(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsAssignModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="assign"
            type="primary"
            loading={loading}
            onClick={handleAssign}
          >
            Update
          </Button>,
        ]}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Manage Approval Status"
          loading={loading}
          onChange={(value) => setSelectedExecutive(value)}
          value={selectedExecutive}
        >
          <Select.Option key={'1'} value={'1'}>
            {'Approved'}
          </Select.Option>
          <Select.Option key={'2'} value={'2'}>
            {'Processing'}
          </Select.Option>
          <Select.Option key={'3'} value={'3'}>
            {'Rejected'}
          </Select.Option>
        </Select>
         {selectedExecutive === "3" && (
            <div style={{ marginTop: 16 }}>
              <Input
                placeholder="Enter Reason "
                style={{ marginBottom: 8 }}
               
              />
             
            </div>
          )}
      </Modal>


      <Modal
        title="Product Details"
        visible={productDetailsVisible}
        onCancel={() => setProductDetailsVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={[
            {
              title: 'Metal',
              dataIndex: 'metal',
              key: 'metal',
              width: 100,
            },
            {
              title: 'Product',
              dataIndex: 'product',
              key: 'product',
              width: 120,
            },
            {
              title: 'Sub Product',
              dataIndex: 'sub_product',
              key: 'sub_product',
              width: 120,
            },
            {
              title: 'Gross Weight (g)',
              dataIndex: 'gross_weight',
              key: 'gross_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Net Weight (g)',
              dataIndex: 'net_weight',
              key: 'net_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Rate (₹/g)',
              dataIndex: 'rate',
              key: 'rate',
              width: 100,
              render: (value) => `₹${parseFloat(value).toFixed(2)}`,
            },
            {
              title: 'Amount (₹)',
              dataIndex: 'amount',
              key: 'amount',
              width: 120,
              render: (value) => `₹${parseFloat(value).toFixed(2)}`,
            },
          ]}
          dataSource={selectedProducts}
          rowKey={(record) => `${record.metal}-${record.product}-${record.sub_product}`}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  )
}

export default ReligionalManager;
