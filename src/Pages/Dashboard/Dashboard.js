import React, { useEffect, useState } from 'react';
import api from '../../api/apiConfig/apiClient';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';
import {
  Card,
  Statistic,
  Select,
  Table,
  Tag,
  Row,
  Col,
  Divider,
  Space,
  Typography,
  Avatar,
  Progress,
  Badge,
  Button
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  GoldOutlined,
  DollarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  AccountBookOutlined,
  TransactionOutlined,
  WalletOutlined,
  MoneyCollectOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  FilterOutlined,
  MoreOutlined
} from '@ant-design/icons';
import './Dashboard.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Enhanced sample data
const goldRateData = [
  { date: 'Jan 1', rate: 5832, change: 1.2 },
  { date: 'Jan 2', rate: 5845, change: 0.8 },
  { date: 'Jan 3', rate: 5862, change: 1.5 },
  { date: 'Jan 4', rate: 5878, change: 1.3 },
  { date: 'Jan 5', rate: 5855, change: -0.9 },
  { date: 'Jan 6', rate: 5840, change: -0.7 },
  { date: 'Jan 7', rate: 5865, change: 1.2 },
];

const silverRateData = [
  { date: 'Jan 1', rate: 72.5, change: 0.8 },
  { date: 'Jan 2', rate: 72.8, change: 0.4 },
  { date: 'Jan 3', rate: 73.2, change: 0.6 },
  { date: 'Jan 4', rate: 73.8, change: 0.8 },
  { date: 'Jan 5', rate: 73.5, change: -0.4 },
  { date: 'Jan 6', rate: 73.2, change: -0.4 },
  { date: 'Jan 7', rate: 73.7, change: 0.7 },
];

const accountGrowthData = [
  { month: 'Jan', accounts: 120, growth: 8 },
  { month: 'Feb', accounts: 145, growth: 12 },
  { month: 'Mar', accounts: 168, growth: 15 },
  { month: 'Apr', accounts: 192, growth: 14 },
  { month: 'May', accounts: 220, growth: 15 },
  { month: 'Jun', accounts: 250, growth: 14 },
];

const loanDistributionData = [
  { name: 'Gold Loans', value: 65 },
  { name: 'Personal Loans', value: 20 },
  { name: 'Business Loans', value: 10 },
  { name: 'Education Loans', value: 5 },
];

const recentTransactions = [
  { id: '#TXN-2501', customer: 'Rajesh Kumar', type: 'Gold Loan', amount: 125000, date: '2024-05-23', status: 'Completed' },
  { id: '#TXN-2502', customer: 'Priya Devi', type: 'Gold Purchase', amount: 87500, date: '2024-05-22', status: 'Pending' },
  { id: '#TXN-2503', customer: 'Arunachalam', type: 'Loan Repayment', amount: 45000, date: '2024-05-21', status: 'Completed' },
  { id: '#TXN-2504', customer: 'Meena S', type: 'Silver Sale', amount: 32500, date: '2024-05-20', status: 'Failed' },
  { id: '#TXN-2505', customer: 'Suresh R', type: 'Gold Loan', amount: 180000, date: '2024-05-19', status: 'Completed' },
  { id: '#TXN-2506', customer: 'Lakshmi K', type: 'Account Opening', amount: 5000, date: '2024-05-18', status: 'Completed' }
];

const performanceData = [
  { name: 'Gold Loans', value: 85 },
  { name: 'Silver Loans', value: 72 },
  { name: 'Other Loans', value: 64 }
];

const COLORS = ['#FFD700', '#4DB6AC', '#607D8B', '#90A4AE'];
const PERFORMANCE_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [currentGoldRate, setCurrentGoldRate] = useState(0);
  const [currentSilverRate, setCurrentSilverRate] = useState(0);
  const [prevGoldRate, setPrevGoldRate] = useState(0);
  const [prevSilverRate, setPrevSilverRate] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isFetching, setIsFetching] = useState(false);

  
  const fetchLiveRate = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const response = await api.get("https://amayagoldpoint.in/api/metal-prices");
      if (response.data && response.data.length > 0) {
        const newGoldPrice = response.data[0].price;
        const newSilverPrice = response.data[2].price;
        
        if (newGoldPrice !== currentGoldRate) {
          setPrevGoldRate(currentGoldRate || newGoldPrice);
          setCurrentGoldRate(newGoldPrice);
        }
        if (newSilverPrice !== currentSilverRate) {
          setPrevSilverRate(currentSilverRate || newSilverPrice);
          setCurrentSilverRate(newSilverPrice);
        }

        const now = new Date();
        setLastUpdated(now);
      }
    } catch (error) {
      // Silent error
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchLiveRate();
    const interval = setInterval(fetchLiveRate, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPercentage = (num) => {
    if (isNaN(num) || num === 0) return '0.0%';
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const calculateChange = (current, prev) => {
    if (!prev || prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const summaryCards = [
    {
      title: 'Total Assets',
      value: 24567500,
      trend: 18.5,
      icon: <MoneyCollectOutlined />,
      isCurrency: true,
      color: '#FFD700',
      trendColor: '#4CAF50'
    },
    {
      title: 'Active Loans',
      value: 3247,
      trend: 12.3,
      icon: <AccountBookOutlined />,
      color: '#4DB6AC',
      trendColor: '#4CAF50'
    },
    {
      title: 'New Accounts',
      value: 684,
      trend: 8.7,
      icon: <WalletOutlined />,
      color: '#607D8B',
      trendColor: '#4CAF50'
    },
    {
      title: 'NPA Rate',
      value: 2.4,
      trend: -0.3,
      icon: <BarChartOutlined />,
      isPercentage: true,
      color: '#F44336',
      trendColor: '#F44336'
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip-container">
          <div className="custom-tooltip-header">
            <Text strong>{label}</Text>
          </div>
          <div className="custom-tooltip-body">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-item">
                <div className="tooltip-color" style={{ backgroundColor: entry.color }} />
                <Text className="tooltip-text">
                  {`${entry.dataKey}: ${typeof entry.value === 'number' && entry.value > 1000 ? formatCurrency(entry.value) : entry.value}`}
                </Text>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const PerformanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip-container">
          <div className="custom-tooltip-header">
            <Text strong>{payload[0].payload.name}</Text>
          </div>
          <div className="custom-tooltip-body">
            <div className="tooltip-item">
              <Text className="tooltip-text">
                {`Performance: ${payload[0].value}%`}
              </Text>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong>{text}</Text>,
      width: 150
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => <Text>{text}</Text>,
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => <Tag className="transaction-type-tag">{text}</Tag>,
      width: 150
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => <Text strong className="transaction-amount">{formatCurrency(text)}</Text>,
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => <Text className="transaction-date">{text}</Text>,
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        let bgColor = '';
        switch (status) {
          case 'Completed':
            color = '#4CAF50';
            bgColor = '#E8F5E9';
            break;
          case 'Pending':
            color = '#FF9800';
            bgColor = '#FFF3E0';
            break;
          case 'Failed':
            color = '#F44336';
            bgColor = '#FFEBEE';
            break;
          default:
            color = '#9E9E9E';
            bgColor = '#FAFAFA';
        }
        return (
          <div className="status-badge" style={{ backgroundColor: bgColor, color }}>
            {status}
          </div>
        );
      },
      width: 120
    },
    {
      title: '',
      key: 'action',
      render: () => (
        <Button type="text" icon={<MoreOutlined />} className="action-button" />
      ),
      width: 50
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <Title level={3} className="dashboard-title">
            Amaya Gold Point
          </Title>
          <Text type="secondary" className="dashboard-subtitle">Dashboard Overview - Tamil Nadu Operations</Text>
        </div>
        <div className="header-actions">
          <Select
            value={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value)}
            className="period-select"
            suffixIcon={<FilterOutlined />}
          >
            <Option value="This Month">This Month</Option>
            <Option value="Last Month">Last Month</Option>
            <Option value="This Quarter">This Quarter</Option>
            <Option value="This Year">This Year</Option>
          </Select>
          {/* <Button type="primary" icon={<DownloadOutlined />} className="export-button">
            Export
          </Button> */}
        </div>
      </div>

      {/* Current Rates Banner */}
      <Card className="rates-banner">
        <Row gutter={24} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div className="rate-card">
              <GoldOutlined className="rate-icon gold-icon" />
              <div className="rate-content">
                <Text className="rate-label">Gold Rate (24K)</Text>
                <div className="rate-value-container">
                  <Text className="rate-value">₹{currentGoldRate}/g</Text>
                  <Badge
                    count={formatPercentage(calculateChange(currentGoldRate, prevGoldRate))}
                    className={`rate-badge ${calculateChange(currentGoldRate, prevGoldRate) >= 0 ? 'positive' : 'negative'}`}
                  />
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="rate-card">
              <GoldOutlined className="rate-icon silver-icon" />
              <div className="rate-content">
                <Text className="rate-label">Silver Rate</Text>
                <div className="rate-value-container">
                  <Text className="rate-value">₹{currentSilverRate}/g</Text>
                  <Badge
                    count={formatPercentage(calculateChange(currentSilverRate, prevSilverRate))}
                    className={`rate-badge ${calculateChange(currentSilverRate, prevSilverRate) >= 0 ? 'positive' : 'negative'}`}
                  />
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <div className="rate-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Badge status="processing" color="#4CAF50" />
                <Text strong style={{ color: '#4CAF50', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Updates Active</Text>
              </div>
              <Text className="meta-text">
                <Text strong>Last Updated:</Text> {lastUpdated.toLocaleString()}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Summary Cards */}
      <Row gutter={[24, 24]} className="summary-row">
        {summaryCards.map((card, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card className="summary-card">
              <div className="summary-card-content">
                <div className="summary-icon-container" style={{ backgroundColor: `${card.color}20` }}>
                  {React.cloneElement(card.icon, {
                    style: {
                      fontSize: 20,
                      color: card.color
                    }
                  })}
                </div>
                <div className="summary-text-container">
                  <Text className="summary-title">{card.title}</Text>
                  <Text className="summary-value">
                    {card.isCurrency
                      ? formatCurrency(card.value)
                      : card.isPercentage
                        ? formatPercentage(card.value)
                        : formatNumber(card.value)}
                  </Text>
                  <div className="summary-trend">
                    {card.trend >= 0 ? (
                      <RiseOutlined className="trend-icon positive" />
                    ) : (
                      <FallOutlined className="trend-icon negative" />
                    )}
                    <Text className={`trend-text ${card.trend >= 0 ? 'positive' : 'negative'}`}>
                      {card.trend >= 0 ? `+${card.trend}%` : `${card.trend}%`} from last month
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} className="charts-row">
        {/* Gold Rate Trend */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={
              <div className="chart-header">
                <GoldOutlined className="chart-icon gold-icon" />
                <Text className="chart-title">Gold Rate Trend (7 Days)</Text>
                <Button type="text" className="chart-action">View Report <ArrowRightOutlined /></Button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={goldRateData}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#FFD700"
                  fill="url(#goldGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#FFD700', strokeWidth: 0, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Silver Rate Trend */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={
              <div className="chart-header">
                <GoldOutlined className="chart-icon silver-icon" />
                <Text className="chart-title">Silver Rate Trend (7 Days)</Text>
                <Button type="text" className="chart-action">View Report <ArrowRightOutlined /></Button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={silverRateData}>
                <defs>
                  <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#C0C0C0"
                  fill="url(#silverGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#C0C0C0', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#C0C0C0', strokeWidth: 0, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Second Row Charts */}
      <Row gutter={[24, 24]} className="charts-row">
        {/* Account Growth */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={
              <div className="chart-header">
                <WalletOutlined className="chart-icon teal-icon" />
                <Text className="chart-title">Account Growth</Text>
                <Button type="text" className="chart-action">View Report <ArrowRightOutlined /></Button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accountGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="accounts"
                  fill="#4DB6AC"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Loan Performance */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={
              <div className="chart-header">
                <AccountBookOutlined className="chart-icon gold-icon" />
                <Text className="chart-title">Loan Performance</Text>
                <Button type="text" className="chart-action">View Report <ArrowRightOutlined /></Button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                innerRadius="20%"
                outerRadius="90%"
                data={performanceData}
                startAngle={180}
                endAngle={-180}
              >
                <RadialBar
                  minAngle={15}
                  label={{ fill: '#666', position: 'insideStart' }}
                  background
                  clockWise
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                  ))}
                </RadialBar>
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value, entry, index) => (
                    <span className="legend-text">
                      {value}: {performanceData[index].value}%
                    </span>
                  )}
                />
                <Tooltip content={<PerformanceTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Third Row Charts */}
      <Row gutter={[24, 24]} className="charts-row">
        {/* Loan Distribution */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={
              <div className="chart-header">
                <PieChartOutlined className="chart-icon gold-icon" />
                <Text className="chart-title">Loan Distribution</Text>
                <Button type="text" className="chart-action">View Report <ArrowRightOutlined /></Button>
              </div>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {loanDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                    contentStyle={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend">
              {loanDistributionData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <Text className="legend-label">{item.name}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Account Growth Trend */}
        <Col xs={24} lg={12}>
          <Card
            className="chart-card"
            title={
              <div className="chart-header">
                <BarChartOutlined className="chart-icon teal-icon" />
                <Text className="chart-title">Account Growth Trend</Text>
                <Button type="text" className="chart-action">View Report <ArrowRightOutlined /></Button>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accountGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="growth"
                  stroke="#4DB6AC"
                  strokeWidth={3}
                  dot={{ fill: '#4DB6AC', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#4DB6AC', strokeWidth: 0, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions Table */}
      <Card
        className="table-card"
        title={
          <div className="chart-header">
            <TransactionOutlined className="chart-icon gold-icon" />
            <Text className="chart-title">Recent Transactions</Text>
            <Button type="text" className="chart-action">View All <ArrowRightOutlined /></Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={recentTransactions}
          rowKey="id"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            position: ['bottomRight']
          }}
          scroll={{ x: true }}
          className="transactions-table"
        />
      </Card>
    </div>
  );
};

export default Dashboard;