import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Select,
    Table,
    Space,
    message,
    Card,
    Row,
    Col,
    Typography,
    Tag,
    Modal,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { createMasterGroup,getMasterGroup } from '../../api/services/AccountsService';

const { Option } = Select;
const { Title, Text } = Typography;

const MasterGrouping = () => {
    const [form] = Form.useForm();
    const [groupings, setGroupings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [majorGroups, setMajorGroups] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Group type options
    const groupTypeOptions = [
        { value: 'major', label: 'Major Group' },
        { value: 'sub', label: 'Sub Group' }
    ];

    // Group items options
    const groupItemsOptions = [
        { value: 'Asset', label: 'Asset' },
        { value: 'Liabilities', label: 'Liabilities' },
        { value: 'Income', label: 'Income' },
        { value: 'Expenditure', label: 'Expenditure' }
    ];

    // Fetch all master groupings
    // Fetch all master groupings
    const fetchMasterGroupings = async (search = '') => {
        try {
            setLoading(true);
            // Use your API service instead of direct fetch
            const response = await getMasterGroup({ search });
            console.log(response)
            if (response.success) {
                setGroupings(response.data);
                setMajorGroups(response.data);
            } else {
                message.error('Failed to fetch master groupings');
            }
        } catch (error) {
            console.error('Error fetching master groupings:', error);
            message.error('Failed to fetch master groupings');
        } finally {
            setLoading(false);
        }
    };

    // Create new master grouping
    const createMasterGrouping = async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                ...values,
                group_items: Array.isArray(values.group_items)
                    ? values.group_items.join(', ')
                    : values.group_items
            };

            const response = await createMasterGroup(payload)
            const result = response;

            if (result.success) {
                message.success('Master grouping created successfully!');
                handleModalClose();
                fetchMasterGroupings(); // Refresh the list
            } else {
                message.error(result.message || 'Failed to create master grouping');
            }
        } catch (error) {
            console.error('Error creating master grouping:', error);
            message.error('Failed to create master grouping');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        await createMasterGrouping(values);
    };

    // Handle group type change
    const handleGroupTypeChange = (value) => {
        // Reset major group fields when group type changes
        if (value === 'major') {
            form.setFieldsValue({
                major_group: undefined,
                major_group_code: undefined
            });
        }
    };

    // Handle major group selection
    const handleMajorGroupChange = (value) => {
        const selectedMajor = majorGroups.find(group => group.id === value);
        if (selectedMajor) {
            form.setFieldsValue({
                major_group: selectedMajor.group_name,
                major_group_code: selectedMajor.group_code
            });
        }
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchText(value);
        fetchMasterGroupings(value);
    };

    // Modal functions
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    // Columns for the table
    const columns = [
        {
            title: 'Group Code',
            dataIndex: 'group_code',
            key: 'group_code',
            width: 120,
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Group Name',
            dataIndex: 'group_name',
            key: 'group_name',
            width: 200,
        },
        {
            title: 'Group Type',
            dataIndex: 'group_type',
            key: 'group_type',
            width: 120,
            render: (type) => (
                <Tag color={type === 'major' ? 'green' : 'orange'}>
                    {type === 'major' ? 'Major Group' : 'Sub Group'}
                </Tag>
            )
        },
        {
            title: 'Major Group',
            dataIndex: 'major_group',
            key: 'major_group',
            width: 150,
            render: (text) => text || '-'
        },
        {
            title: 'Major Group Code',
            dataIndex: 'major_group_code',
            key: 'major_group_code',
            width: 120,
            render: (text) => text ? <Tag color="green">{text}</Tag> : '-'
        },
        {
            title: 'Group Items',
            dataIndex: 'group_items',
            key: 'group_items',
            width: 200,
            render: (items) => {
                if (!items) return '-';

                // If items is a string, split by comma
                const itemList = typeof items === 'string'
                    ? items.split(',').map(item => item.trim()).filter(item => item)
                    : Array.isArray(items) ? items : [];

                return (
                    <Space wrap size={[0, 8]}>
                        {itemList.map((item, index) => (
                            <Tag
                                key={index}
                                color={
                                    item === 'Asset' ? 'blue' :
                                        item === 'Liabilities' ? 'red' :
                                            item === 'Income' ? 'green' :
                                                'orange'
                                }
                                style={{ margin: '2px' }}
                            >
                                {item}
                            </Tag>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date) => new Date(date).toLocaleDateString()
        }
    ];

    // Load data on component mount
    useEffect(() => {
        fetchMasterGroupings();
    }, []);

    return (
        <div style={{ padding: '24px' }}>
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                    <Col span={12}>
                        <Title level={3} style={{ margin: 0 }}>Master Grouping</Title>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showModal}
                            >
                                Create Group
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    setSearchText('');
                                    fetchMasterGroupings();
                                }}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Data Table */}
            <Card
                title="Master Groupings"
                extra={
                    <Input
                        placeholder="Search by group name or code"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                }
            >
                <Table
                    columns={columns}
                    dataSource={groupings}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={false}
                    size="middle"
                />
            </Card>

            {/* Create Group Modal */}
            <Modal
                title="Create Master Grouping"
                visible={isModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        group_type: 'major'
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Group Name"
                                name="group_name"
                                rules={[
                                    { required: true, message: 'Please enter group name!' },
                                    { min: 2, message: 'Group name must be at least 2 characters!' }
                                ]}
                            >
                                <Input placeholder="Enter group name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Group Type"
                                name="group_type"
                                rules={[{ required: true, message: 'Please select group type!' }]}
                            >
                                <Select
                                    onChange={handleGroupTypeChange}
                                    placeholder="Select group type"
                                >
                                    {groupTypeOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.group_type !== currentValues.group_type
                        }
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('group_type') === 'sub' ? (
                                <>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Major Group"
                                                name="major_group_id"
                                                rules={[{ required: true, message: 'Please select major group!' }]}
                                            >
                                                <Select
                                                    onChange={handleMajorGroupChange}
                                                    placeholder="Select major group"
                                                    showSearch
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                >
                                                    {majorGroups.map(group => (
                                                        <Option key={group.id} value={group.id}>
                                                            {group.group_name} ({group.group_code})
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Major Group Code"
                                                name="major_group_code"
                                            >
                                                <Input readOnly />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item
                                        label="Major Group Name"
                                        name="major_group"
                                    >
                                        <Input readOnly />
                                    </Form.Item>
                                </>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item
                        label="Group Items"
                        name="group_items"
                        rules={[{ required: true, message: 'Please select at least one group item!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select group items"
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {groupItemsOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleModalClose}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                icon={<PlusOutlined />}
                            >
                                Create Grouping
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MasterGrouping;