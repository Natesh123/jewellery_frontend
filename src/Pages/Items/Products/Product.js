// src/components/Product/Product.js

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Table, Space, Popconfirm, message, Modal, Card, Row, Col, Typography, Tag, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { roots } from '../../../colorConstant';
import {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getStatusOptions,
    getMetalOptions,
    getCategoryOptions,
    getSubProductOptions
} from '../../../api/services/productService';

import Swal from 'sweetalert2';

const { Option } = Select;
const { Title } = Typography;

const Product = () => {
    const [form] = Form.useForm();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [metalOptions, setMetalOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [subProductOptions, setSubProductOptions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        metal: '',
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
        fetchProducts();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [metalsRes, statusRes, categoriesRes, subProductsRes] = await Promise.all([
                getMetalOptions(),
                getStatusOptions(),
                getCategoryOptions(),
                getSubProductOptions(),
            ]);

            setMetalOptions(metalsRes.data || []);
            setStatusOptions(statusRes.data || []);
            setCategoryOptions(categoriesRes.data || []);
            setSubProductOptions(subProductsRes.data || []);


        } catch (error) {
            message.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await getProducts(
                pagination.current,
                pagination.pageSize,
                {
                    search: filters.search,
                    metal: filters.metal,
                    status: filters.status
                }
            );

            setProducts(response.products || []);
            setFilteredProducts(response.products || []);
            setPagination({
                ...pagination,
                total: response.total || 0
            });
        } catch (error) {
            message.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const generateProductCode = (productName, metalName) => {
        if (!productName || !metalName) return '';

        // Get first two letters of product name (uppercase)
        const productCode = productName.substring(0, 2).toUpperCase();

        // Get first letter of metal name (uppercase)
        // const metalCode = metalName.charAt(0).toUpperCase();

        // Generate random 2-digit number
        const randomNum = Math.floor(10 + Math.random() * 90);

        return `${productCode}${metalName}${randomNum}`;
    };

    const onProductChange = () => {
        const productName = form.getFieldValue('product_name');
        const metalName = form.getFieldValue('metal_name');

        console.log(`Product Name: ${productName}, Metal Name: ${metalName}`);



        if (productName && metalName) {
            const newCode = generateProductCode(productName, metalName);
            form.setFieldsValue({
                product_code: newCode
            });
        }
    };

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleMetalFilter = (value) => {
        setFilters(prev => ({ ...prev, metal: value }));
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
        setFilters({ search: '', metal: '', status: '' });
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const showModal = () => {
        setIsModalVisible(true);
        setEditingProduct(null);
        form.resetFields();
    };

    const showEditModal = (product) => {
        setIsModalVisible(true);
        setEditingProduct(product);
        form.setFieldsValue({
            ...product,
            metal_name: product.metal_name,
            category_name: product.category_name
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingProduct(null);
        form.resetFields();
    };



    const onFinish = async (values) => {
        try {
            setLoading(true);

            if (editingProduct) {
                await updateProduct(editingProduct.id, values);
                await Swal.fire({
                    icon: 'success',
                    title: 'Product Updated',
                    text: 'Product updated successfully.',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                await createProduct(values);
                await Swal.fire({
                    icon: 'success',
                    title: 'Product Added',
                    text: 'Product added successfully.',
                    confirmButtonColor: '#3085d6'
                });
            }

            await fetchProducts();
            handleCancel();
        } catch (error) {
            console.error('Error saving product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.response?.data?.message || 'Failed to save product.',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };



    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the product.',
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
                await deleteProduct(id);
                await fetchProducts();
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Product deleted successfully.',
                    confirmButtonColor: '#3085d6'
                });
            } catch (error) {
                console.error('Error deleting product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: 'Failed to delete product.',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
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

    const getSubProductColor = (subProductValue) => {
        return subProductValue === 'yes' ? '#52c41a' : '#f5222d';
    };

    const columns = [
        {
            title: 'Metal',
            dataIndex: 'metal_name',
            key: 'metal_name',
            width: 120,
            render: (value) => {
                const metal = metalOptions.find(m => m.value === value);
                return (
                    <Tag color={getMetalColor(metal?.label)} style={{ color: '#000', fontWeight: 'bold' }}>
                        {metal?.label || value}
                    </Tag>
                );
            }
        },
        {
            title: 'Category',
            dataIndex: 'category_name',
            key: 'category_name',
            width: 150
        },
        {
            title: 'Product Name',
            dataIndex: 'product_name',
            key: 'product_name',
            width: 180
        },
        {
            title: 'Product Code',
            dataIndex: 'product_code',
            key: 'product_code',
            width: 120,
            render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
        },
        {
            title: 'Sub Product',
            dataIndex: 'sub_product',
            key: 'sub_product',
            width: 120,
            render: (value) => {
                const option = subProductOptions.find(opt => opt.value === value);
                return (
                    <Tag color={getSubProductColor(value)} style={{ color: '#fff', fontWeight: 'bold' }}>
                        {option?.label || value}
                    </Tag>
                );
            }
        },
        {
            title: 'HSN Code',
            dataIndex: 'hsn_code',
            key: 'hsn_code',
            width: 120
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
                    {/* <Popconfirm
                        title="Are you sure you want to delete this product?"
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
                                placeholder="Search products..."
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
                                    <Option key={metal.value} value={metal.value}>{metal.label}</Option>
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
                                    {pagination.total} products found
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
                                Add New Product
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
                    <Table
                        columns={columns}
                        dataSource={filteredProducts}
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1800 }}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                    />
                </Card>

                {/* Product Modal */}
                <Modal
                    title={editingProduct ? "Edit Product" : "Add New Product"}
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
                                            label="Metal Name"
                                            name="metal_name"
                                            rules={[{ required: true, message: 'Please select metal!' }]}
                                        >
                                            <Select onChange={onProductChange}>
                                                {metalOptions.map(metal => (
                                                    <Option key={metal.value} value={metal.value}>{metal.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Category Name"
                                            name="category_name"
                                            rules={[{ required: true, message: 'Please enter category name!' }]}
                                        >
                                            <Select onChange={onProductChange}>
                                                {categoryOptions.map(category => (
                                                    <Option key={category.value} value={category.value}>{category.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Product Name"
                                            name="product_name"
                                            rules={[{ required: true, message: 'Please enter product name!' }]}
                                        >
                                            <Input onChange={onProductChange} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Product Code"
                                            name="product_code"
                                            rules={[{ required: true, message: 'Product code required!' }]}
                                        >
                                            <Input readOnly style={{ backgroundColor: roots.ebony[50] }} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Sub Product"
                                            name="sub_product"
                                            rules={[{ required: true, message: 'Please select sub product option!' }]}
                                        >
                                            <Select>
                                                {subProductOptions.map(option => (
                                                    <Option key={option.value} value={option.value}>{option.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="HSN Code"
                                            name="hsn_code"
                                            rules={[{ required: true, message: 'HSN code required!' }]}
                                        >
                                            <Input />
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
                                            {editingProduct ? 'Update Product' : 'Add Product'}
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

export default Product;