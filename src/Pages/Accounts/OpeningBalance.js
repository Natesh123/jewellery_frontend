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
    getMasterGroup, 
    getAllAccountHeads, 
    createOpeningBalance, 
    getAllOpeningBalances,
    updateOpeningBalance,
    deleteOpeningBalance
} from '../../api/services/AccountsService';

import { roots } from '../../colorConstant';

const { Option } = Select;
const { Title } = Typography;

const OpeningBalance = () => {
    const [form] = Form.useForm();
    const [groupings, setGroupings] = useState([]);
    const [allAccountHeads, setAllAccountHeads] = useState([]);
    const [filteredAccountHeads, setFilteredAccountHeads] = useState([]);
    const [openingBalances, setOpeningBalances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [modal, contextHolder] = Modal.useModal();

    // Fetch initial data
    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupResponse, headResponse, balanceResponse] = await Promise.all([
                getMasterGroup({ search: '' }),
                getAllAccountHeads({ search: '' }),
                getAllOpeningBalances({ search: '' })
            ]);

            if (groupResponse.success) setGroupings(groupResponse.data);
            if (headResponse.success) setAllAccountHeads(headResponse.data);
            if (balanceResponse.success) setOpeningBalances(balanceResponse.data);
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

    // Handle Group selection change
    const handleGroupChange = (value) => {
        const filtered = allAccountHeads.filter(head => head.group_name === value);
        setFilteredAccountHeads(filtered);
        form.setFieldsValue({ account_head: undefined });
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                ...values,
                date: values.date.format('YYYY-MM-DD'),
                weight_debit: values.weight_debit || 0,
                weight_credit: values.weight_credit || 0,
                amount_debit: values.amount_debit || 0,
                amount_credit: values.amount_credit || 0,
            };

            let response;
            if (editingId) {
                response = await updateOpeningBalance(editingId, payload);
            } else {
                response = await createOpeningBalance(payload);
            }

            if (response.success || response.message) {
                message.success(`Opening balance ${editingId ? 'updated' : 'created'} successfully!`);
                handleReset();
                fetchData(); // Refresh list
            } else {
                message.error(response.message || `Failed to ${editingId ? 'update' : 'create'} opening balance`);
            }
        } catch (error) {
            console.error(`Error ${editingId ? 'updating' : 'creating'} opening balance:`, error);
            message.error(`Failed to ${editingId ? 'update' : 'create'} opening balance`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record) => {
        setEditingId(record.id);
        const filtered = allAccountHeads.filter(head => head.group_name === record.group_name);
        setFilteredAccountHeads(filtered);
        
        form.setFieldsValue({
            ...record,
            date: moment(record.date),
            weight_debit: Number(record.weight_debit),
            weight_credit: Number(record.weight_credit),
            amount_debit: Number(record.amount_debit),
            amount_credit: Number(record.amount_credit),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            const response = await deleteOpeningBalance(id);
            if (response.success || response.message) {
                message.success('Opening balance deleted successfully');
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
        setFilteredAccountHeads([]);
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
            title: 'Group',
            dataIndex: 'group_name',
            key: 'group_name',
        },
        {
            title: 'A/C Head',
            dataIndex: 'account_head',
            key: 'account_head',
        },
        {
            title: 'Weight',
            children: [
                {
                    title: 'Debit',
                    dataIndex: 'weight_debit',
                    key: 'weight_debit',
                    render: (val) => Number(val || 0).toFixed(3),
                },
                {
                    title: 'Credit',
                    dataIndex: 'weight_credit',
                    key: 'weight_credit',
                    render: (val) => Number(val || 0).toFixed(3),
                },
            ],
        },
        {
            title: 'Amount',
            children: [
                {
                    title: 'Dr',
                    dataIndex: 'amount_debit',
                    key: 'amount_debit',
                    render: (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                },
                {
                    title: 'Cr',
                    dataIndex: 'amount_credit',
                    key: 'amount_credit',
                    render: (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                },
            ],
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => moment(date).format('DD-MM-YYYY'),
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
                                    title: 'Delete Opening Balance?',
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
            <Title level={2} style={{ color: roots.gold[700] }}>{editingId ? 'Edit Opening Balance' : 'Opening Balance'}</Title>
            
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
                        <Col span={6}>
                            <Form.Item
                                label="Date"
                                name="date"
                                rules={[{ required: true, message: 'Please select date' }]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={9}>
                            <Form.Item
                                label="Group"
                                name="group_name"
                                rules={[{ required: true, message: 'Please select group' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select Group"
                                    onChange={handleGroupChange}
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {groupings.map(group => (
                                        <Option key={group.id} value={group.group_name}>
                                            {group.group_name} ({group.group_code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={9}>
                            <Form.Item
                                label="A/C Head"
                                name="account_head"
                                rules={[{ required: true, message: 'Please select A/C head' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select A/C Head"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {filteredAccountHeads.map(head => (
                                        <Option key={head.id} value={head.head_name}>
                                            {head.head_name} ({head.account_code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Naration" name="narration">
                                <Input placeholder="Enter naration" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Weight</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Debit" name="weight_debit">
                                <InputNumber style={{ width: '100%' }} placeholder="0.000" precision={3} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Credit" name="weight_credit">
                                <InputNumber style={{ width: '100%' }} placeholder="0.000" precision={3} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">Amount</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Debit" name="amount_debit">
                                <InputNumber style={{ width: '100%' }} placeholder="0.00" precision={2} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Credit" name="amount_credit">
                                <InputNumber style={{ width: '100%' }} placeholder="0.00" precision={2} />
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
                title={<span style={{ color: roots.gold[800] }}>Opening Balances List</span>}
                style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}
                extra={
                    <Input
                        placeholder="Search by group or head"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            getAllOpeningBalances({ search: e.target.value }).then(res => {
                                if (res.success) setOpeningBalances(res.data);
                            });
                        }}
                        style={{ width: 300, borderColor: roots.gold[300] }}
                        allowClear
                    />
                }
            >
                <Table
                    columns={columns}
                    dataSource={openingBalances}
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

export default OpeningBalance;
