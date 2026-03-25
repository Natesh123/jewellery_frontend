import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Table, Space, Popconfirm, message, Modal, Card, Row, Col, Typography, Tag, Spin, List, Divider } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { roots } from '../../../colorConstant';
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    getStatusOptions,
    getMetalOptions,
    getTaxOptions
} from '../../../api/services/categoryService';
import Swal from 'sweetalert2';

const { Option } = Select;
const { Title } = Typography;

const Category = () => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [metalOptions, setMetalOptions] = useState([]);
    const [taxOptions, setTaxOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
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
    const [titleNames, setTitleNames] = useState([]);

    // Predefined common accounting titles
    const predefinedTitles = [
        'Cash A/C',
        'Bank A/C',
        'Sundry Debtors',
        'Cash On Hand',
        'Petty Cash',
        // 'Stock-in-Trade',
        // 'Capital Account',
        // 'Loan Account',
        // 'Sales Account',
        // 'Purchase Account',
        // 'Expense Account',
        // 'Income Account'
    ];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [metalsRes, statusRes, taxRes] = await Promise.all([
                getMetalOptions(),
                getStatusOptions(),
                getTaxOptions(),
            ]);

            setMetalOptions(metalsRes.data || []);
            setStatusOptions(statusRes.data || []);
            setTaxOptions(taxRes.data || []);
        } catch (error) {
            message.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories(
                pagination.current,
                pagination.pageSize,
                {
                    search: filters.search,
                    metal: filters.metal,
                    status: filters.status
                }
            );

            setCategories(response.categories || []);
            setFilteredCategories(response.categories || []);
            setPagination({
                ...pagination,
                total: response.total || 0
            });
        } catch (error) {
            message.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const generateCategoryCode = (metalId, taxType, categoryName) => {
        const metal = metalOptions.find(m => m.value === metalId);
        const metalInitial = metal?.label?.charAt(0).toUpperCase() || 'X';
        const taxInitial = taxType === 'taxable' ? 'T' : 'N';
        
        // Get first letter of category name, or use metal initial as fallback
        const categoryInitial = categoryName && categoryName.length > 0 
            ? categoryName.charAt(0).toUpperCase() 
            : metalInitial;
    
        const existingCodes = categories
            .filter(c => c.metal_id === metalId && c.tax_type === taxType)
            .map(c => c.category_code);
    
        let nextNumber = 1;
        
        if (existingCodes.length > 0) {
            const numbers = existingCodes.map(code => {
                const match = code.match(/\d+$/);
                return match ? parseInt(match[0], 10) : 0;
            });
            
            const maxNumber = Math.max(...numbers);
            nextNumber = maxNumber + 1;
        }
    
        return `${metalInitial}${taxInitial}${categoryInitial}${nextNumber.toString().padStart(3, '0')}`;
    };

    const generateTitleCode = (categoryCode, titleName, existingTitles = []) => {
        const baseCode = categoryCode;
        
        // Find existing codes for this category to determine next sequence
        const existingCodes = existingTitles.map(title => title.code);
        let sequence = 1;
        
        if (existingCodes.length > 0) {
            const lastSequence = Math.max(...existingCodes.map(code => {
                const match = code.match(/\d{2}$/); // Match last 2 digits
                return match ? parseInt(match[0]) : 0;
            }));
            sequence = lastSequence + 1;
        }
    
        return `${baseCode}${sequence.toString().padStart(2, '0')}`;
    };

    const generateCategoryName = (metalId, taxType) => {
        const metal = metalOptions.find(m => m.value === metalId);
        const taxLabel = taxType === 'taxable' ? 'Taxable' : 'Non-Taxable';
        return `${metal?.label || ''} ${taxLabel} Ornaments`;
    };

    const onCategoryChange = () => {
        const metalId = form.getFieldValue('metal_id');
        const taxType = form.getFieldValue('tax_type');
        const categoryName = form.getFieldValue('category_name') || generateCategoryName(metalId, taxType);
    
        if (metalId && taxType) {
            const finalCategoryName = categoryName || generateCategoryName(metalId, taxType);
            const categoryCode = generateCategoryCode(metalId, taxType, finalCategoryName);
    
            form.setFieldsValue({
                category_name: finalCategoryName,
                category_code: categoryCode
            });

            // Auto-populate title names when category code is generated and it's a new category
            if (!editingCategory && categoryCode) {
                autoFillTitleNames(categoryCode);
            }
        }
    };

    // Function to auto-fill title names
    const autoFillTitleNames = (categoryCode) => {
        // Check if we already have some titles (to avoid duplicate auto-filling)
        if (titleNames.length > 0) {
            const shouldRefill = window.confirm(
                'Do you want to replace existing titles with default accounting titles?'
            );
            if (!shouldRefill) return;
        }

        // Generate titles with codes
        const generatedTitles = predefinedTitles.map((titleName, index) => {
            return {
                id: Date.now() + index,
                name: titleName,
                code: `${categoryCode}${(index + 1).toString().padStart(2, '0')}`,
                isNew: true
            };
        });

        setTitleNames(generatedTitles);
        message.success('Default accounting titles have been added');
    };

    const addTitleName = () => {
        const categoryCode = form.getFieldValue('category_code');
        if (!categoryCode) {
            message.warning('Please generate category code first');
            return;
        }

        const newTitle = {
            id: Date.now(), // temporary id
            name: '',
            code: generateTitleCode(categoryCode, '', titleNames),
            isNew: true
        };

        setTitleNames([...titleNames, newTitle]);
    };

    const updateTitleName = (index, field, value) => {
        const updatedTitles = [...titleNames];
        updatedTitles[index][field] = value;

        // Auto-generate code when name is entered
        if (field === 'name' && value) {
            const categoryCode = form.getFieldValue('category_code');
            const otherTitles = updatedTitles.filter((_, i) => i !== index);
            updatedTitles[index].code = generateTitleCode(categoryCode, value, otherTitles);
        }

        setTitleNames(updatedTitles);
    };

    const removeTitleName = (index) => {
        const updatedTitles = titleNames.filter((_, i) => i !== index);
        setTitleNames(updatedTitles);
    };

    // Function to fill specific titles manually
    const fillCommonTitles = () => {
        const categoryCode = form.getFieldValue('category_code');
        if (!categoryCode) {
            message.warning('Please generate category code first');
            return;
        }

        // Get the 5 specific titles you mentioned
        const specificTitles = [
            'Cash A/C',
            'Bank A/C',
            'Sundry Debtors',
            'Cash On Hand',
            'Petty Cash'
        ];

        const generatedTitles = specificTitles.map((titleName, index) => {
            return {
                id: Date.now() + index,
                name: titleName,
                code: `${categoryCode}${(index + 1).toString().padStart(2, '0')}`,
                isNew: true
            };
        });

        setTitleNames(generatedTitles);
        message.success('Common accounting titles have been added');
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
        setEditingCategory(null);
        setTitleNames([]);
        form.resetFields();
    };

    const showEditModal = (category) => {
        setIsModalVisible(true);
        setEditingCategory(category);
        // Load existing title names if available
        setTitleNames(category.title_names || []);
        form.setFieldsValue({
            ...category,
            metal_id: category.metal_id,
            tax_type: category.tax_type
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingCategory(null);
        setTitleNames([]);
        form.resetFields();
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);

            // Filter out empty titles
            const validTitles = titleNames.filter(title => title.name && title.code);

            // Prepare data with title names
            const categoryData = {
                ...values,
                title_names: validTitles.map(title => ({
                    name: title.name,
                    code: title.code
                }))
            };

            if (editingCategory) {
                await updateCategory(editingCategory.id, categoryData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Category updated successfully',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                await createCategory(categoryData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Created',
                    text: 'Category added successfully',
                    confirmButtonColor: '#3085d6'
                });
            }

            await fetchCategories();
            handleCancel();
        } catch (error) {
            console.error('Error saving category:', error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.response?.data?.message || 'Failed to save category',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the category.',
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
                await deleteCategory(id);
                await fetchCategories();
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Category deleted successfully',
                    confirmButtonColor: '#3085d6'
                });
            } catch (error) {
                console.error('Error deleting category:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: 'Failed to delete category',
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

    const getTaxColor = (taxValue) => {
        return taxValue === 'taxable' ? '#52c41a' : '#f5222d';
    };

    const columns = [
        {
            title: 'Metal',
            dataIndex: 'metal_name',
            key: 'metal_name',
            width: 120,
            render: (value, record) => {
                const metal = metalOptions.find(m => m.value === record.metal_id);
                return (
                    <Tag color={getMetalColor(metal?.label)} style={{ color: '#000', fontWeight: 'bold' }}>
                        {metal?.label || value}
                    </Tag>
                );
            }
        },
        {
            title: 'Tax Type',
            dataIndex: 'tax_type',
            key: 'tax_type',
            width: 120,
            render: (value) => {
                const option = taxOptions.find(opt => opt.value === value);
                return (
                    <Tag color={getTaxColor(value)} style={{ color: '#fff', fontWeight: 'bold' }}>
                        {option?.label || value}
                    </Tag>
                );
            }
        },
        {
            title: 'Category Name',
            dataIndex: 'category_name',
            key: 'category_name',
            width: 180
        },
        {
            title: 'Category Code',
            dataIndex: 'category_code',
            key: 'category_code',
            width: 100,
            render: (text) => <Tag color={roots.gold[500]} style={{ color: roots.text.inverse }}>{text}</Tag>
        },
        {
            title: 'Title Names',
            dataIndex: 'title_names',
            key: 'title_names',
            width: 200,
            render: (titles) => (
                <div>
                    {titles && titles.length > 0 ? (
                        <List
                            size="small"
                            dataSource={titles.slice(0, 3)}
                            renderItem={(title) => (
                                <List.Item>
                                    <div>
                                        <div><strong>{title.name}</strong></div>
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>{title.code}</div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <Tag color="default">No titles</Tag>
                    )}
                    {titles && titles.length > 3 && (
                        <Tag color="blue">+{titles.length - 3} more</Tag>
                    )}
                </div>
            )
        },
        {
            title: 'CGST %',
            dataIndex: 'cgst',
            key: 'cgst',
            width: 100,
            render: (value) => `${value}%`
        },
        {
            title: 'SGST %',
            dataIndex: 'sgst',
            key: 'sgst',
            width: 100,
            render: (value) => `${value}%`
        },
        {
            title: 'IGST %',
            dataIndex: 'igst',
            key: 'igst',
            width: 100,
            render: (value) => `${value}%`
        },
        {
            title: 'Created By',
            dataIndex: 'created_by',
            key: 'created_by',
            width: 150,
            render: (value, record) => (
                <div>
                    <div>{value}</div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>{record.updated_by}</div>
                </div>
            )
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
        .title-item {
            background: ${roots.ebony[50]};
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            border: 1px solid ${roots.ebony[200]};
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
                                placeholder="Search categories..."
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
                                    {pagination.total} categories found
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
                                Add New Category
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
                    <Table
                        columns={columns}
                        dataSource={filteredCategories}
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 2000 }}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                    />
                </Card>

                {/* Category Modal */}
                <Modal
                    title={editingCategory ? "Edit Category" : "Add New Category"}
                    open={isModalVisible}
                    onCancel={handleCancel}
                    footer={null}
                    width={800}
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
                                            <Select 
                                                onChange={onCategoryChange}
                                                placeholder="Select metal type"
                                            >
                                                {metalOptions.map(metal => (
                                                    <Option key={metal.value} value={metal.value}>{metal.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Tax Type"
                                            name="tax_type"
                                            rules={[{ required: true, message: 'Please select tax type!' }]}
                                        >
                                            <Select 
                                                onChange={onCategoryChange}
                                                placeholder="Select tax type"
                                            >
                                                {taxOptions.map(tax => (
                                                    <Option key={tax.value} value={tax.value}>{tax.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Category Name"
                                            name="category_name"
                                            rules={[{ required: true, message: 'Category name is required' }]}
                                        >
                                            <Input 
                                                placeholder="Enter category name"
                                                style={{ backgroundColor: roots.ebony[50] }} 
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Category Code"
                                            name="category_code"
                                            rules={[{ required: true, message: 'Category code is required' }]}
                                        >
                                            <Input 
                                                readOnly 
                                                style={{ backgroundColor: roots.ebony[50], fontWeight: 'bold' }} 
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Title Names Section */}
                                {/* <Divider orientation="left">
                                    Title Names
                                    <Space style={{ marginLeft: 12 }}>
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={addTitleName}
                                            size="small"
                                        >
                                            Add Custom Title
                                        </Button>
                                        {!editingCategory && (
                                            <Button
                                                type="primary"
                                                ghost
                                                onClick={fillCommonTitles}
                                                size="small"
                                                style={{ borderColor: roots.gold[500], color: roots.gold[600] }}
                                            >
                                                Fill Common Titles
                                            </Button>
                                        )}
                                    </Space>
                                </Divider> */}

                                {/* {titleNames.length === 0 && !editingCategory && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '20px',
                                        backgroundColor: roots.ebony[50],
                                        borderRadius: '6px',
                                        marginBottom: '16px',
                                        border: `1px dashed ${roots.ebony[300]}`
                                    }}>
                                        <p style={{ color: roots.text.secondary, marginBottom: '12px' }}>
                                            No titles added yet. Click "Fill Common Titles" to add default accounting titles or "Add Custom Title" for custom ones.
                                        </p>
                                        <Space>
                                            <Button
                                                type="primary"
                                                onClick={fillCommonTitles}
                                                size="small"
                                            >
                                                Add Default Titles
                                            </Button>
                                        </Space>
                                    </div>
                                )}

                                {titleNames.map((title, index) => (
                                    <div key={title.id} className="title-item">
                                        <Row gutter={16} align="middle">
                                            <Col span={10}>
                                                <Form.Item
                                                    label="Title Name"
                                                    required
                                                >
                                                    <Input
                                                        placeholder="Enter title name"
                                                        value={title.name}
                                                        readOnly
                                                        onChange={(e) => updateTitleName(index, 'name', e.target.value)}
                                                        style={{ backgroundColor: '#fff' }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={10}>
                                                <Form.Item
                                                    label="Title Code"
                                                >
                                                    <Input
                                                        placeholder="Auto-generated code"
                                                        value={title.code}
                                                        readOnly
                                                        style={{ 
                                                            backgroundColor: roots.ebony[50], 
                                                            fontWeight: 'bold',
                                                            color: roots.teal[700]
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<CloseOutlined />}
                                                    onClick={() => removeTitleName(index)}
                                                    style={{ marginTop: 30 }}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))} */}

                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item
                                            label="CGST %"
                                            name="cgst"
                                            rules={[{ required: true, message: 'CGST percentage required!' }]}
                                        >
                                            <Input type="number" suffix="%" min="0" max="100" step="0.01" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            label="SGST %"
                                            name="sgst"
                                            rules={[{ required: true, message: 'SGST percentage required!' }]}
                                        >
                                            <Input type="number" suffix="%" min="0" max="100" step="0.01" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            label="IGST %"
                                            name="igst"
                                            rules={[{ required: true, message: 'IGST percentage required!' }]}
                                        >
                                            <Input type="number" suffix="%" min="0" max="100" step="0.01" />
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
                                            <Select placeholder="Select status">
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
                                                boxShadow: roots.shadow.gold,
                                                fontWeight: 600
                                            }}
                                            loading={loading}
                                        >
                                            {editingCategory ? 'Update Category' : 'Add Category'}
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

export default Category;