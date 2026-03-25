import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Table, Space, Popconfirm, message, Modal, Card, Row, Col, Typography, Tag, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { roots } from '../../../colorConstant';
import {
    createSubProduct,
    getSubProducts,
    updateSubProduct,
    deleteSubProduct,
    getStatusOptions,
    getProductOptions
} from '../../../api/services/subProductServices';

import Swal from 'sweetalert2';

const { Option } = Select;
const { Title } = Typography;

const SubProduct = () => {
    const [form] = Form.useForm();
    const [subProducts, setSubProducts] = useState([]);
    const [filteredSubProducts, setFilteredSubProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSubProduct, setEditingSubProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        product: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchSubProducts();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [productsRes, statusRes] = await Promise.all([
                getProductOptions(),
                getStatusOptions(),
            ]);

            setProductOptions(productsRes.data || []);
            setStatusOptions(statusRes.data || []);
        } catch (error) {
            message.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubProducts = async () => {
        try {
            setLoading(true);
            const response = await getSubProducts(
                pagination.current,
                pagination.pageSize,
                {
                    search: filters.search,
                    product: filters.product,
                    status: filters.status
                }
            );

            setSubProducts(response.subProducts || []);
            setFilteredSubProducts(response.subProducts || []);
            setPagination({
                ...pagination,
                total: response.total || 0
            });
        } catch (error) {
            message.error('Failed to fetch sub-products');
        } finally {
            setLoading(false);
        }
    };

    const generateSubProductCode = (productName, subProductName) => {
        if (!productName || !subProductName) return '';

        const product = productOptions.find(p => p.value === productName);
        const productLabel = product?.label || productName;

        // Get first two letters of product name (uppercase)
        const productCode = productLabel.substring(0, 2).toUpperCase();

        // Get first two letters of sub product name (uppercase)
        const subProductCode = subProductName.substring(0, 2).toUpperCase();

        // Generate random 2-digit number
        const randomNum = Math.floor(10 + Math.random() * 90);

        return `${productCode}${subProductCode}${randomNum}`;
    };

    const onSubProductChange = () => {
        const productName = form.getFieldValue('product_name');
        const subProductName = form.getFieldValue('sub_product_name');

        if (productName && subProductName) {
            const newCode = generateSubProductCode(productName, subProductName);
            form.setFieldsValue({
                sub_product_code: newCode
            });
        }
    };

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleProductFilter = (value) => {
        setFilters(prev => ({ ...prev, product: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleStatusFilter = (value) => {
        setFilters(prev => ({ ...prev, status: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleTableChange = (pagination) => {
        setPagination(pagination);
    };

    const resetFilters = () => {
        setFilters({ search: '', product: '', status: '' });
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const showModal = () => {
        setIsModalVisible(true);
        setEditingSubProduct(null);
        form.resetFields();
    };

    const showEditModal = (subProduct) => {
        setIsModalVisible(true);
        setEditingSubProduct(subProduct);
        form.setFieldsValue({
            ...subProduct,
            product_name: subProduct.product_name
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingSubProduct(null);
        form.resetFields();
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);

            if (editingSubProduct) {
                await updateSubProduct(editingSubProduct.id, values);
                await Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Sub-product updated successfully.',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                await createSubProduct(values);
                await Swal.fire({
                    icon: 'success',
                    title: 'Created',
                    text: 'Sub-product added successfully.',
                    confirmButtonColor: '#3085d6'
                });
            }

            await fetchSubProducts();
            handleCancel();
        } catch (error) {
            console.error('Error saving sub-product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.response?.data?.message || 'Failed to save sub-product.',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the sub-product.',
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
                await deleteSubProduct(id);
                await fetchSubProducts();
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Sub-product deleted successfully.',
                    confirmButtonColor: '#3085d6'
                });
            } catch (error) {
                console.error('Error deleting sub-product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: 'Failed to delete sub-product.',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
        }
    };


    const getStatusColor = (statusValue) => {
        return statusValue === 'active' ? roots.status.success.main : roots.status.error.main;
    };

    const columns = [
        {
            title: 'Product Name',
            dataIndex: 'product_name',
            key: 'product_name',
            width: 150,
            render: (value) => {
                const product = productOptions.find(opt => opt.value === value);
                return product?.label || value;
            }
        },
        {
            title: 'Sub-Product Name',
            dataIndex: 'sub_product_name',
            key: 'sub_product_name',
            width: 180
        },
        {
            title: 'Sub-Product Code',
            dataIndex: 'sub_product_code',
            key: 'sub_product_code',
            width: 150,
            render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
        },
        {
            title: 'Created By',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 120
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120
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
                const color = getStatusColor(value);
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
                    {/* <Popconfirm
                        title="Are you sure you want to delete this sub-product?"
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

                    </Popconfirm> */}
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
                                placeholder="Search sub-products..."
                                prefix={<SearchOutlined style={{ color: roots.text.tertiary }} />}
                                value={filters.search}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{ borderColor: roots.ebony[300] }}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={8} md={5}>
                            <Select
                                placeholder="Filter by product"
                                value={filters.product || undefined}
                                onChange={handleProductFilter}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {productOptions.map(product => (
                                    <Option key={product.value} value={product.value}>{product.label}</Option>
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
                                    {pagination.total} sub-products found
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
                                Add New Sub-Product
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
                    <Table
                        columns={columns}
                        dataSource={filteredSubProducts}
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} sub-products`
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1500 }}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                    />
                </Card>

                {/* Sub-Product Modal */}
                <Modal
                    title={editingSubProduct ? "Edit Sub-Product" : "Add New Sub-Product"}
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
                                            label="Product"
                                            name="product_name"
                                            rules={[{ required: true, message: 'Please select product!' }]}
                                        >
                                            <Select onChange={onSubProductChange}>
                                                {productOptions.map(product => (
                                                    <Option key={product.value} value={product.value}>{product.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Sub-Product Name"
                                            name="sub_product_name"
                                            rules={[{ required: true, message: 'Please enter sub-product name!' }]}
                                        >
                                            <Input
                                                onChange={onSubProductChange}
                                                style={{ backgroundColor: roots.ebony[50] }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Sub-Product Code"
                                            name="sub_product_code"
                                            rules={[{ required: true, message: 'Sub-product code required!' }]}
                                        >
                                            <Input
                                                readOnly
                                                style={{ backgroundColor: roots.ebony[50] }}
                                            />
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
                                            {editingSubProduct ? 'Update Sub-Product' : 'Add Sub-Product'}
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

export default SubProduct;