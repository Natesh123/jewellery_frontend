import React, { useState, useEffect } from 'react';
import { Table, Space, Popconfirm, message, Card, Typography, Tag, Spin, Button, Input, InputNumber } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { deleteMCXRateData, getMCXRatesAll, updateMCXRateData } from '../../api/services/quatationService'; // Removed updateMCXRate import
import { formatDateTime, isToday } from '../../utils/dateUtils';
import Swal from 'sweetalert2';

const { Title } = Typography;
const { TextArea } = Input;

const MCXRate = () => {
    const [metals, setMetals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState({});

    useEffect(() => {
        fetchMCXRates();
    }, []);

    const fetchMCXRates = async () => {
        try {
            setLoading(true);
            const response = await getMCXRatesAll();

            console.log('API Response:', response);
            if (Array.isArray(response)) {
                setMetals(response);
            } else if (response && response.success && Array.isArray(response.data)) {
                setMetals(response.data);
            } else {
                console.warn('No valid data found in response:', response);
                message.warning('No MCX rates data available');
                setMetals([]);
            }
        } catch (error) {
            console.error('Error fetching MCX rates:', error);
            message.error('Failed to fetch MCX rates');
            setMetals([]);
        } finally {
            setLoading(false);
        }
    };

    const isEditable = (record) => {
        return isToday(record.date);
    };

    const handleEdit = (record) => {
        if (!isEditable(record)) {
            message.warning('Only today\'s rates can be edited');
            return;
        }
        setEditingId(record.id);
        setEditingData({ ...record });
    };

    // Mock implementation of updateMCXRate since it's not available in the service
    const updateMCXRate = async (id, data) => {
        // This is a placeholder - you'll need to implement the actual API call
        console.log('Updating MCX rate:', id, data);

        // // Simulate API call delay
        // return new Promise((resolve) => {
        //     setTimeout(() => {
        //         resolve({ success: true });
        //     }, 1000);
        // });
        return updateMCXRateData(id, data)
        // If you have an actual API endpoint, you would use something like:
        // return axios.put(`/api/mcx-rates/${id}`, data);
    };

    const handleSave = async (id) => {
        try {
            setLoading(true);
            await updateMCXRate(id, editingData);
            message.success('Rate updated successfully');
            setEditingId(null);
            setEditingData({});
            fetchMCXRates();
        } catch (error) {
            console.error('Error updating rate:', error);
            message.error('Failed to update rate');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditingData({});
    };

    const handleChange = (field, value) => {
        setEditingData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the MCX rate entry.',
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
                await deleteMCXRateData(id);
                fetchMCXRates();
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'MCX rate deleted successfully',
                    confirmButtonColor: '#3085d6'
                });
            } catch (error) {
                console.error('Error deleting MCX rate:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: 'Failed to delete MCX rate',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Metal Name',
            dataIndex: 'metal_name',
            key: 'metal_name',
            width: 100,
        },
        {
            title: 'Origin Price',
            dataIndex: 'origin_price',
            key: 'origin_price',
            width: 100,
            render: (value, record) => {
                if (editingId === record.id && isEditable(record)) {
                    return (
                        <InputNumber
                            value={editingData.origin_price}
                            onChange={(val) => handleChange('origin_price', val)}
                            precision={3}
                            step={0.001}
                            style={{ width: '100%' }}
                        />
                    );
                }
                return value && parseFloat(value).toFixed(3);
            }
        },
        {
            title: 'Rate',
            dataIndex: 'rate',
            key: 'rate',
            width: 100,
            render: (value, record) => {
                if (editingId === record.id && isEditable(record)) {
                    return (
                        <InputNumber
                            value={editingData.rate}
                            onChange={(val) => handleChange('rate', val)}
                            precision={3}
                            step={0.001}
                            style={{ width: '100%' }}
                        />
                    );
                }
                return value && parseFloat(value).toFixed(3);
            }
        },
        {
            title: 'Sub Amount',
            dataIndex: 'sub_amt',
            key: 'sub_amt',
            width: 100,
            render: (value, record) => {
                if (editingId === record.id && isEditable(record)) {
                    return (
                        <InputNumber
                            value={editingData.sub_amt}
                            onChange={(val) => handleChange('sub_amt', val)}
                            precision={3}
                            step={0.001}
                            style={{ width: '100%' }}
                        />
                    );
                }
                return value && parseFloat(value).toFixed(3);
            }
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 120,
            render: (date, record) => (
                <span style={{
                    color: isEditable(record) ? roots.green[600] : roots.text.primary,
                    fontWeight: isEditable(record) ? 'bold' : 'normal'
                }}>
                    {date}
                    {isEditable(record) && (
                        <Tag color={roots.green[100]} style={{ marginLeft: '8px', fontSize: '10px' }}>
                            Editable
                        </Tag>
                    )}
                </span>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_, record) => {
                const editable = isEditable(record);

                if (editingId === record.id) {
                    return (
                        <Space>
                            <Button
                                type="text"
                                icon={<SaveOutlined />}
                                onClick={() => handleSave(record.id)}
                                style={{ color: roots.green[600] }}
                                size="small"
                            />
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                                style={{ color: roots.status.error.main }}
                                size="small"
                            />
                        </Space>
                    );
                }

                return (
                    <Space>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            style={{ color: editable ? roots.teal[600] : roots.text.disabled }}
                            disabled={!editable}
                            size="small"
                        />
                        <Popconfirm
                            title="Are you sure you want to delete this MCX rate?"
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
                );
            }
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
        .editable-row {
            background-color: #0000ff !important;
        }
    `;

    return (
        <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            <Spin spinning={loading}>


                {/* Header */}
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ color: roots.gold[700], margin: 0 }}>
                        MCX Rates
                    </Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Tag color={roots.green[100]} style={{ color: roots.green[800], borderColor: roots.green[300] }}>
                            Today's rates are editable
                        </Tag>
                        <Tag color={roots.gold[500]} style={{ color: roots.text.inverse, padding: '4px 8px', fontSize: '14px' }}>
                            {metals.length} rates displayed
                        </Tag>
                    </div>
                </div>

                {/* Table */}
                <Card style={{ boxShadow: roots.shadow.lg, borderRadius: '8px' }}>
                    <Table
                        columns={columns}
                        dataSource={metals}
                        pagination={false}
                        scroll={{ x: 800 }}
                        rowKey="id"
                        size="middle"
                        loading={loading}
                        locale={{ emptyText: 'No MCX rates data available' }}
                        rowClassName={(record) => (editingId === record.id ? 'editable-row' : '')}
                    />
                </Card>
            </Spin>
        </div>
    );
};

export default MCXRate;