import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Table, Space, Popconfirm, message, Modal, Card, Row, Col, Typography, Tag, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { roots } from '../../colorConstant';
import {
    createPurity,
    getPurities,
    updatePurity,
    deletePurity,
    getStatusOptions,
    getPurityStandards,
    getPurityCount,
    getMetalOptions
} from '../../api/services/purityService';

import { formatDateTime } from '../../utils/dateUtils';


const { Option } = Select;
const { Title } = Typography;

const Purity = () => {
    const [form] = Form.useForm();
    const [purities, setPurities] = useState([]);
    const [filteredPurities, setFilteredPurities] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPurity, setEditingPurity] = useState(null);
    const [purityCode, setPurityCode] = useState('');
    const [statusOptions, setStatusOptions] = useState([]);
    const [metalOptions, setMetalOptions] = useState([]);
    const [purityStandards, setPurityStandards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        search: '',
        metal: '',
        status: ''
    });

    useEffect(() => {
        fetchInitialData();

    }, []);

    useEffect(() => {
        fetchPurities();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [metalsRes, standardsRes, statusRes] = await Promise.all([
                getMetalOptions(),
                getPurityStandards(),
                getStatusOptions(),
            ]);

            // Validate and transform metals data for dropdown
            const transformedMetals = metalsRes?.data?.map(metal => ({
                id: metal.value,
                value: metal.value,
                label: metal.label,
                color: getMetalColor(metal.label)
            })) || [];

            // Validate other responses
            const purityStandardsData = standardsRes?.data || [];
            const statusOptionsData = statusRes?.data || [];

            setMetalOptions(transformedMetals);
            setPurityStandards(purityStandardsData);
            setStatusOptions(statusOptionsData);

            // Fetch initial count
            const countRes = await getPurityCount();
            setPagination(prev => ({
                ...prev,
                total: countRes?.count || 0
            }));
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            message.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPurities = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                search: filters.search,
                metal: filters.metal,
                status: filters.status
            };

            const response = await getPurities(params.page, params.limit, {
                search: params.search,
                metal: params.metal,
                status: params.status
            });

            // Format the data before setting state
            const formattedPurities = response.purities.map(purity => ({
                ...purity,
                key: purity.id,
                created_at: formatDateTime(purity.created_at),
                updated_at: formatDateTime(purity.updated_at),
                created_by: purity.created_by || purity.created || 'System',
                updated_by: purity.updated_by || purity.updated || 'System',
                // Get metal name from metalOptions
                metal_name: metalOptions.find(m => m.value === purity.metal_id)?.label || purity.metal_id
            }));

            setPurities(formattedPurities);
            setFilteredPurities(formattedPurities);
            setPagination({
                ...pagination,
                total: response.total
            });
        } catch (error) {
            message.error('Failed to fetch purities');
        } finally {
            setLoading(false);
        }
    };

    const getMetalColor = (metalName) => {
        const colors = {
            'Gold': '#FFD700',
            'Silver': '#C0C0C0',
            'Platinum': '#E5E4E2',
            'Palladium': '#B4B4B4',
            'Copper': '#B87333',
            'Bronze': '#CD7F32'
        };
        return colors[metalName] || '#666666';
    };

    const generatePurityCode = (metalId, purity) => {
        if (!metalId || !purity) return '';
        const metal = metalOptions.find(m => m.id === metalId);
        const metalCode = metal ? metal.label.charAt(0).toUpperCase() : 'M';
        const purityCode = purity.replace('k', '').toUpperCase();
        return `${metalCode}${purityCode}`;
    };

    const handleSearch = (value) => {
        setFilters({ ...filters, search: value });
        setPagination({ ...pagination, current: 1 });
    };

    const handleMetalFilter = (value) => {
        setFilters({ ...filters, metal: value });
        setPagination({ ...pagination, current: 1 });
    };

    const handleStatusFilter = (value) => {
        setFilters({ ...filters, status: value });
        setPagination({ ...pagination, current: 1 });
    };

    const handleTableChange = (pagination) => {
        setPagination(pagination);
    };

    const resetFilters = () => {
        setFilters({ search: '', metal: '', status: '' });
        setPagination({ ...pagination, current: 1 });
    };

    const onPurityChange = () => {
        const metalId = form.getFieldValue('metal_id');
        const purity = form.getFieldValue('purity_standard');

        if (metalId && purity) {
            const metal = metalOptions.find(m => m.id === metalId);
            const standard = purityStandards.find(p => p.value === purity);
            const newCode = generatePurityCode(metalId, purity);
            const purityName = standard ? `${standard.label} ${metal?.label || ''}` : '';

            form.setFieldsValue({
                purity_code: newCode,
                purity_name: purityName,
                purity_percentage: standard?.percentage || 0
            });
            setPurityCode(newCode);
        }
    };

    const showModal = () => {
        setIsModalVisible(true);
        setEditingPurity(null);
        form.resetFields();
        setPurityCode('');
    };

    const showEditModal = (purity) => {
        setIsModalVisible(true);
        setEditingPurity(purity);
        form.setFieldsValue({
            ...purity,
            metal_id: purity.metal_id,
            purity_standard: purity.purity_standard
        });
        setPurityCode(purity.purity_code);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingPurity(null);
        form.resetFields();
        setPurityCode('');
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            if (editingPurity) {
                await updatePurity(editingPurity.id, values);
                message.success('Purity updated successfully');
            } else {
                await createPurity(values);
                message.success('Purity added successfully');
            }
            fetchPurities();
            handleCancel();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save purity');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await deletePurity(id);
            message.success('Purity deleted successfully');
            fetchPurities();
        } catch (error) {
            message.error('Failed to delete purity');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Metal',
            dataIndex: 'metal_id',
            key: 'metal_id',
            width: 120,
            render: (_, record) => {
                const metal = metalOptions.find(m => m.value === record.metal_id);
                return (
                    <Tag color={metal?.color || '#666666'} style={{ color: '#000', fontWeight: 'bold' }}>
                        {metal?.label || 'Unknown'}
                    </Tag>
                );
            }
        },
        {
            title: 'Purity Name',
            dataIndex: 'purity_name',
            key: 'purity_name',
            width: 180
        },
        {
            title: 'Purity Code',
            dataIndex: 'purity_code',
            key: 'purity_code',
            width: 100,
            render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
        },
        {
            title: 'Purity %',
            dataIndex: 'purity_percentage',
            key: 'purity_percentage',
            width: 100,
            render: (value) => `${value}%`
        },
        {
            title: 'Created By',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 150
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120
        },
        {
            title: 'Updated By',
            dataIndex: 'updated_by',
            key: 'updated_by',
            width: 150
        },
        {
            title: 'Updated At',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 120
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (value) => {
                const option = statusOptions.find(opt => opt.value === value);
                const color = value === 'active' ? roots.status.success.main : roots.status.error.main;
                return <Tag color={color} style={{ color: roots.text.inverse }}>{option?.label || value}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
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
                        title="Are you sure you want to delete this purity?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ style: { backgroundColor: roots.status.error.main, borderColor: roots.status.error.main } }}
                    >
                        {localStorage.getItem("userRole") === "super admin" && (
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                style={{ color: roots.status.error.main }}
                            />
                        )}

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
                                placeholder="Search purities..."
                                prefix={<SearchOutlined style={{ color: roots.text.tertiary }} />}
                                value={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ borderColor: roots.ebony[300] }}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={8} md={5}>
                            <Select
                                placeholder="Filter by metal"
                                value={filters.metal || undefined}
                                onChange={handleMetalFilter}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {metalOptions.map(metal => (
                                    <Option key={metal.id} value={metal.id}>{metal.label}</Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={8} md={5}>
                            <Select
                                placeholder="Filter by status"
                                value={filters.status || undefined}
                                onChange={handleStatusFilter}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {statusOptions.map(status => (
                                    <Option key={status.value} value={status.value}>{status.label}</Option>
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
                                <Tag color={roots.gold[500]} style={{ color: roots.text.inverse, padding: '4px 8px' }}>
                                    {pagination.total} purities found
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
                                Add New Purity
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
                    <Table
                        columns={columns}
                        dataSource={filteredPurities}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{ x: 1500 }}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                    />
                </Card>

                {/* Purity Modal */}
                <Modal
                    title={editingPurity ? "Edit Purity" : "Add New Purity"}
                    open={isModalVisible}
                    onCancel={handleCancel}
                    footer={null}
                    width={700}
                    destroyOnClose
                >
                    <Spin spinning={loading}>
                        <div style={{ marginTop: '24px' }}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Metal"
                                            name="metal_id"
                                            rules={[{ required: true, message: 'Please select metal!' }]}
                                        >
                                            <Select onChange={onPurityChange}>
                                                {metalOptions.map(metal => (
                                                    <Option key={metal.id} value={metal.id}>{metal.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Purity Standard"
                                            name="purity_standard"
                                            rules={[{ required: true, message: 'Please select purity standard!' }]}
                                        >
                                            <Select onChange={onPurityChange}>
                                                {purityStandards.map(purity => (
                                                    <Option key={purity.value} value={purity.value}>{purity.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Purity Name"
                                            name="purity_name"
                                            rules={[{ required: true, message: 'Purity name required!' }]}
                                        >
                                            <Input style={{ backgroundColor: roots.ebony[50] }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Purity Code"
                                            name="purity_code"
                                            rules={[{ required: true, message: 'Purity code required!' }]}
                                        >
                                            <Input style={{ backgroundColor: roots.ebony[50] }} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Purity Percentage"
                                            name="purity_percentage"
                                            rules={[{ required: true, message: 'Purity percentage required!' }]}
                                        >
                                            <Input suffix="%" style={{ backgroundColor: roots.ebony[50] }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Status"
                                            name="status"
                                            rules={[{ required: true, message: 'Please select status!' }]}
                                        >
                                            <Select>
                                                {statusOptions.map(opt => (
                                                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

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
                                            loading={loading}
                                        >
                                            {editingPurity ? 'Update Purity' : 'Add Purity'}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </div>
                    </Spin>
                </Modal>
            </Spin>
        </div>
    );
};

export default Purity;