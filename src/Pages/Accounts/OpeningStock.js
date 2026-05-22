import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Select,
    Table,
    Space,
    message,
    Modal,
    Card,
    Row,
    Col,
    Typography,
    DatePicker,
    InputNumber,
    Divider,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CloseOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { 
    createOpeningStock, 
    getAllOpeningStocks,
    updateOpeningStock,
    deleteOpeningStock
} from '../../api/services/AccountsService';
import { getCategories } from '../../api/services/categoryService';
import { getAllProducts } from '../../api/services/productService';
import { getSubProducts } from '../../api/services/subProductServices';
import { getPurities } from '../../api/services/purityService';

import { roots } from '../../colorConstant';

const { Option } = Select;
const { Title } = Typography;

const OpeningStock = () => {
    const [form] = Form.useForm();
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subProducts, setSubProducts] = useState([]);
    const [purities, setPurities] = useState([]);
    const [openingStocks, setOpeningStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [modal, contextHolder] = Modal.useModal();

    // Fetch initial data
    const fetchData = async () => {
        try {
            setLoading(true);
            const [catRes, prodRes, subRes, purRes, stockRes] = await Promise.all([
                getCategories(1, 1000),
                getAllProducts(),
                getSubProducts(1, 1000),
                getPurities(1, 1000),
                getAllOpeningStocks({ search: '' })
            ]);

            console.log('API Responses:', { catRes, prodRes, subRes, purRes, stockRes });

            // Robust data extraction helper
            const extractData = (res, key) => {
                if (!res) return [];
                if (Array.isArray(res)) return res;
                if (res.data && Array.isArray(res.data)) return res.data;
                if (res[key] && Array.isArray(res[key])) return res[key];
                if (res.data && res.data[key] && Array.isArray(res.data[key])) return res.data[key];
                return [];
            };

            const catList = extractData(catRes, 'categories');
            setCategories(catList);

            const prodList = extractData(prodRes, 'products');
            setAllProducts(prodList);
            setFilteredProducts(prodList);

            const subList = extractData(subRes, 'subProducts');
            setSubProducts(subList);

            const purList = extractData(purRes, 'purities');
            setPurities(purList);

            // Opening Stock list handling
            if (stockRes) {
                const stocks = stockRes.data || (Array.isArray(stockRes) ? stockRes : []);
                setOpeningStocks(stocks);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter products when category changes
    const handleCategoryChange = (categoryName) => {
        const selectedCat = categories.find(c => c.category_name === categoryName);
        if (selectedCat) {
            const filtered = allProducts.filter(p => p.category_id === selectedCat.id);
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(allProducts);
        }
        form.setFieldsValue({ product: undefined });
    };

    // Weight and Amount calculations
    const handleWeightChange = () => {
        const gross = form.getFieldValue('gross_weight') || 0;
        const less = form.getFieldValue('less_weight') || 0;
        const net = gross - less;
        form.setFieldsValue({ net_weight: net });
        handleAmountCalculation(net);
    };

    const handleRateChange = (rate) => {
        const net = form.getFieldValue('net_weight') || 0;
        handleAmountCalculation(net, rate);
    };

    const handleAmountCalculation = (net, rateValue) => {
        const rate = rateValue !== undefined ? rateValue : (form.getFieldValue('rate') || 0);
        const amount = net * rate;
        form.setFieldsValue({ amount: amount });
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                ...values,
                date: moment().format('YYYY-MM-DD'), // Default to current date
                gross_weight: values.gross_weight || 0,
                less_weight: values.less_weight || 0,
                net_weight: values.net_weight || 0,
                rate: values.rate || 0,
                amount: values.amount || 0,
            };

            let response;
            if (editingId) {
                response = await updateOpeningStock(editingId, payload);
            } else {
                response = await createOpeningStock(payload);
            }

            if (response.success || response.message) {
                message.success(`Opening stock ${editingId ? 'updated' : 'created'} successfully!`);
                handleReset();
                fetchData(); // Refresh list
            } else {
                message.error(response.message || `Failed to ${editingId ? 'update' : 'create'} opening stock`);
            }
        } catch (error) {
            console.error(`Error ${editingId ? 'updating' : 'creating'} opening stock:`, error);
            message.error(`Failed to ${editingId ? 'update' : 'create'} opening stock`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
            gross_weight: Number(record.gross_weight),
            less_weight: Number(record.less_weight),
            net_weight: Number(record.net_weight),
            rate: Number(record.rate),
            amount: Number(record.amount),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            const response = await deleteOpeningStock(id);
            if (response.success || response.message) {
                message.success('Opening stock deleted successfully');
                fetchData();
            } else {
                message.error(response.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            message.error('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        form.setFieldsValue({ date: moment() });
        setEditingId(null);
    };

    // Custom styles
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
        .submit-button {
            background: ${roots.gradient.gold} !important;
            border: none !important;
            color: ${roots.text.inverse} !important;
            font-weight: 600;
            box-shadow: ${roots.shadow.gold};
            transition: ${roots.transition.normal};
        }
        .submit-button:hover {
            transform: translateY(-2px);
            box-shadow: ${roots.shadow.xl}, ${roots.shadow.gold};
            color: ${roots.text.inverse} !important;
        }
        .reset-button {
            border-color: ${roots.gold[500]} !important;
            color: ${roots.gold[600]} !important;
        }
        .reset-button:hover {
            color: ${roots.gold[700]} !important;
            border-color: ${roots.gold[600]} !important;
        }
    `;

    // Columns for the table
    const columns = [
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Product',
            dataIndex: 'product',
            key: 'product',
        },
        {
            title: 'Purity',
            dataIndex: 'purity',
            key: 'purity',
        },
        {
            title: 'Gross Wt',
            dataIndex: 'gross_weight',
            key: 'gross_weight',
            render: (val) => Number(val || 0).toFixed(3),
        },
        {
            title: 'Net Wt',
            dataIndex: 'net_weight',
            key: 'net_weight',
            render: (val) => Number(val || 0).toFixed(3),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEdit(record)}
                            ghost
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            ghost
                            onClick={() => {
                                modal.confirm({
                                    title: 'Delete Opening Stock?',
                                    content: 'Are you sure you want to delete this record?',
                                    okText: 'Yes',
                                    okType: 'danger',
                                    cancelText: 'No',
                                    centered: true,
                                    onOk: () => handleDelete(record.id),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        }
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            {contextHolder}
            <Title level={2} style={{ color: roots.gold[700] }}>{editingId ? 'Edit Opening Stock' : 'Opening Stock'}</Title>
            
            <Card 
                style={{ marginBottom: 24, boxShadow: roots.shadow.md, borderRadius: '8px' }} 
                title={<span style={{ color: roots.gold[800] }}>{editingId ? 'Update Record' : 'New Entry'}</span>}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ date: moment() }}
                >
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Category"
                                name="category"
                                rules={[{ required: true, message: 'Please select category' }]}
                            >
                                <Select 
                                    showSearch 
                                    placeholder="Select Category"
                                    onChange={handleCategoryChange}
                                    options={categories.map(cat => ({
                                        label: cat.category_name,
                                        value: cat.category_name
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Product"
                                name="product"
                                rules={[{ required: true, message: 'Please select product' }]}
                            >
                                <Select 
                                    showSearch 
                                    placeholder="Select Product"
                                    options={filteredProducts.map(prod => ({
                                        label: prod.product_name,
                                        value: prod.product_name
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Sub Product"
                                name="sub_product"
                            >
                                <Select 
                                    showSearch 
                                    placeholder="Select Sub Product" 
                                    allowClear
                                    options={subProducts.map(sub => ({
                                        label: sub.sub_product_name,
                                        value: sub.sub_product_name
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                label="Purity"
                                name="purity"
                                rules={[{ required: true, message: 'Please select purity' }]}
                            >
                                <Select 
                                    showSearch 
                                    placeholder="Select Purity"
                                    options={purities.map(pur => ({
                                        label: pur.purity_name,
                                        value: pur.purity_name
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Gross Weight" name="gross_weight">
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    placeholder="0.000" 
                                    precision={3} 
                                    onChange={handleWeightChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Less Weight" name="less_weight">
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    placeholder="0.000" 
                                    precision={3} 
                                    onChange={handleWeightChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Net Weight" name="net_weight">
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    placeholder="0.000" 
                                    precision={3} 
                                    readOnly 
                                    style={{ backgroundColor: '#f5f5f5', width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Rate" name="rate">
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    placeholder="0.00" 
                                    precision={2} 
                                    onChange={handleRateChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Amount" name="amount">
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    placeholder="0.00" 
                                    precision={2} 
                                    readOnly 
                                    style={{ backgroundColor: '#f5f5f5', width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
                        <Space>
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={handleReset}
                                className="reset-button"
                            >
                                {editingId ? 'Cancel' : 'Reset'}
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={editingId ? <SaveOutlined /> : <PlusOutlined />}
                                loading={submitting}
                                className="submit-button"
                            >
                                {editingId ? 'Update' : 'Submit'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={<span style={{ color: roots.gold[800] }}>Opening Stocks List</span>}
                style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}
                extra={
                    <Input
                        placeholder="Search by category or product"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            getAllOpeningStocks({ search: e.target.value }).then(res => {
                                if (res.success) setOpeningStocks(res.data);
                            });
                        }}
                        style={{ width: 300, borderColor: roots.gold[300] }}
                        allowClear
                    />
                }
            >
                <Table
                    columns={columns}
                    dataSource={openingStocks}
                    rowKey="id"
                    loading={loading}
                    bordered
                    size="middle"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </div>
    );
};

export default OpeningStock;
