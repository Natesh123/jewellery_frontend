import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Table, Space, Popconfirm, message, Modal, Card, Row, Col, Typography, Tag, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { roots } from '../../colorConstant';
import {
    createMetal,
    getMetals,
    updateMetal,
    deleteMetal,
    getStatusOptions,
    getMetalOptions,
    getMetalCount
} from '../../api/services/metalService';
import { formatDateTime } from '../../utils/dateUtils';

import Swal from 'sweetalert2';

const { Option } = Select;
const { Title } = Typography;

const Metal = () => {
    const [form] = Form.useForm();
    const [metals, setMetals] = useState([]);
    const [filteredMetals, setFilteredMetals] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingMetal, setEditingMetal] = useState(null);
    const [metalCode, setMetalCode] = useState('');
    const [statusOptions, setStatusOptions] = useState([]);

    const [metalOptions, setMetalOptions] = useState([]);
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
        fetchMetals();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [metalRes, countRes, statusRes] = await Promise.all([
                getMetalOptions(),
                getMetalCount(),
                getStatusOptions()
            ]);

            setMetalOptions(metalRes.data);
            setStatusOptions(statusRes.data);
            setPagination(prev => ({
                ...prev,
                total: countRes.count
            }));
        } catch (error) {
            message.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchMetals = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                search: filters.search,
                metal: filters.metal,
                status: filters.status
            };

            const response = await getMetals(params.page, params.limit, {
                search: params.search,
                metal: params.metal,
                status: params.status
            });

            // Format the data before setting state
            const formattedMetals = response.metals.map(metal => ({
                ...metal,
                key: metal.id,  // Ensure each record has a unique key
                created_at: formatDateTime(metal.created_at),
                updated_at: formatDateTime(metal.updated_at),
                created_by: metal.created_by || metal.created_by || 'System',
                updated_by: metal.updated_by || metal.updated_by || 'System'
            }));

            setMetals(formattedMetals);
            setFilteredMetals(formattedMetals);
            setPagination({
                ...pagination,
                total: response.total
            });
        } catch (error) {
            message.error('Failed to fetch metals');
        } finally {
            setLoading(false);
        }
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

    const onMetalNameChange = (e) => {
        const name = e.target.value;
        const newCode = generateMetalCode(name);
        form.setFieldsValue({ metal_code: newCode });
        setMetalCode(newCode);
    };

    const generateMetalCode = (metalName) => {
        if (!metalName) return '';
        const code = metalName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
        return `${code}`;
    };

    const getMetalColor = (metalName) => {
        const metal = metalOptions.find(m => m.label.toLowerCase() === metalName?.toLowerCase());
        return metal ? metal.color : '#666666';
    };

    const showModal = () => {
        setIsModalVisible(true);
        setEditingMetal(null);
        form.resetFields();
        setMetalCode('');
    };

    const showEditModal = (metal) => {
        setIsModalVisible(true);
        setEditingMetal(metal);
        form.setFieldsValue({
            ...metal,
            // Ensure we're using the raw values for editing
            metalname: metal.metalname,
            metal_code: metal.metal_code,
            status: metal.status
        });
        setMetalCode(metal.metal_code);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingMetal(null);
        form.resetFields();
        setMetalCode('');
    };



    const onFinish = async (values) => {
        try {
            setLoading(true);

            if (editingMetal) {
                const updateData = {
                    ...values,
                    id: editingMetal.id
                };
                await updateMetal(editingMetal.id, updateData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Metal updated successfully',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                await createMetal(values);
                await Swal.fire({
                    icon: 'success',
                    title: 'Created',
                    text: 'Metal added successfully',
                    confirmButtonColor: '#3085d6'
                });
            }

            fetchMetals();
            handleCancel();
        } catch (error) {
            console.error('Error saving metal:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.response?.data?.message || 'Failed to save metal',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };



    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the metal entry.',
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
                await deleteMetal(id);
                fetchMetals();
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Metal deleted successfully',
                    confirmButtonColor: '#3085d6'
                });
            } catch (error) {
                console.error('Error deleting metal:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: 'Failed to delete metal',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
        }
    };


    const FirstLetterTag = ({ metalName }) => {
        const firstLetter = metalName ? metalName.charAt(0).toUpperCase() : '';
        const color = getMetalColor(metalName);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    backgroundColor: color,
                    color: '#000',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }}>
                    {firstLetter}
                </div>
                <span>{metalName}</span>
            </div>
        );
    };

    const columns = [
        {
            title: 'Metal Name',
            dataIndex: 'metalname',
            key: 'metalname',
            fixed: 'left',
            width: 200,
            render: (text) => <FirstLetterTag metalName={text} />
        },
        {
            title: 'Metal Code',
            dataIndex: 'metal_code',
            key: 'metal_code',
            width: 120,
            render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
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
                        title="Are you sure you want to delete this metal?"
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
                                placeholder="Search metals..."
                                prefix={<SearchOutlined style={{ color: roots.text.tertiary }} />}
                                value={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ borderColor: roots.ebony[300] }}
                            />
                        </Col>
                        <Col xs={24} sm={8} md={5}>
                            <Select
                                placeholder="Filter by metal"
                                value={filters.metal}
                                onChange={handleMetalFilter}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {metalOptions.map(metal => (
                                    <Option key={metal.value} value={metal.value}>{metal.label}</Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={8} md={5}>
                            <Select
                                placeholder="Filter by status"
                                value={filters.status}
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
                                    {pagination.total} metals found
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
                                Add New Metal
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
                    <Table
                        columns={columns}
                        dataSource={filteredMetals}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{ x: 1200 }}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                    />
                </Card>

                {/* Metal Modal */}
                <Modal
                    title={editingMetal ? "Edit Metal" : "Add New Metal"}
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
                                    <Col span={16}>
                                        <Form.Item
                                            label="Metal Name"
                                            name="metalname"
                                            rules={[{ required: true, message: 'Please input metal name!' }]}
                                        >
                                            <Input onChange={onMetalNameChange} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            label="Metal Code"
                                            name="metal_code"
                                            rules={[{ required: true, message: 'Metal code required!' }]}
                                        >
                                            <Input readOnly value={metalCode} style={{ backgroundColor: roots.ebony[50] }} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Status"
                                            name="status"
                                            rules={[{ required: true, message: 'Please select status!' }]}
                                        >
                                            <Select>
                                                <Option key="Active" value="active">Active</Option>
                                                <Option key="Inactive" value="inactive">Inactive</Option>
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
                                            {editingMetal ? 'Update Metal' : 'Add Metal'}
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

export default Metal;