import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Tag,
    Divider,
    InputNumber,
    List,
    Checkbox, Avatar, Dropdown, Menu
} from 'antd';

import {
    DownOutlined, EditOutlined, EyeOutlined,
    SearchOutlined,
    ReloadOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined, UserOutlined, CameraOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import Swal from 'sweetalert2';

// API Services
import {
    getMeltingPurchase,
    updatePurchaseMeltStatus,
    createMeltProducts, getAllMeltReceiptProducts, updateMeltProduct, getMeltingSalesPayments, createSalesPayment
} from '../../api/services/MeltingPurchaseService';
import { uploadConfigUrl } from '../../api/apiUrl';
import { getProducts } from '../../api/services/productService';
import { getMetals } from '../../api/services/metalService';
import { getSubProducts } from '../../api/services/subProductServices';
import { getProductById } from '../../api/services/productService';
import { getMetalById } from '../../api/services/metalService';

import { DatePicker } from 'antd';
import { getMCXRates } from '../../api/services/quatationService';
import Statistic from 'antd/es/statistic/Statistic';
import { getCustomers } from '../../api/services/customerServices';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const Sales = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [customers, setCustomers] = useState([]);
    const [metals, setMetals] = useState([]);
    const [products, setAllProducts] = useState([]);
    const [subProducts, setAllSubProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [selectedPurchases, setSelectedPurchases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [dateRange, setDateRange] = useState([]);
    const [isMeltingPopupVisible, setIsMeltingPopupVisible] = useState(false);
    const [liveGoldRate, setLiveGoldRate] = useState(0.0);
    const [isConfirmationPopupVisible, setIsConfirmationPopupVisible] = useState(false);
    const [confirmationSelections, setConfirmationSelections] = useState([]);
    // Melt products state
    const liveGoldRateRef = React.useRef(0.0);
    const [meltProducts, setMeltProducts] = useState([]);
    const [meltPagination, setMeltPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    });
    const [isMeltTableLoading, setIsMeltTableLoading] = useState(false);

    // Options for dropdowns
    const [metalOptions, setMetalOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [subProductOptions, setSubProductOptions] = useState({});
    const [purchaseDetailsVisible, setPurchaseDetailsVisible] = useState(false);
    const [selectedPurchasesJson, setSelectedPurchasesJson] = useState('');
    const [selectedMeltRecord, setSelectedMeltRecord] = useState(null);
    // Add these state variables at the top of your component
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [selectedMeltProduct, setSelectedMeltProduct] = useState(null);
    const [customerFilters, setCustomerFilters] = useState({
        search: '',
        page: 1,
        limit: 10
    });
    const [customerPagination, setCustomerPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    });
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentForm] = Form.useForm();
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Payment types and options
    const paymentTypes = [
        { value: 'cash', label: 'Cash', icon: '💰' },
        { value: 'gpay', label: 'GPay', icon: '📱' },
        { value: 'cheque', label: 'Cheque', icon: '🏦' },
        { value: 'card', label: 'Card', icon: '💳' }
    ];

    const paymentModes = [
        { value: 'full', label: 'Full Payment' },
    ];
    // Add these state variables
    const [updatePaymentModalVisible, setUpdatePaymentModalVisible] = useState(false);
    const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
    const [salesPayments, setSalesPayments] = useState([]);
    const [isSalesPaymentsLoading, setIsSalesPaymentsLoading] = useState(false);
    const [createPaymentModalVisible, setCreatePaymentModalVisible] = useState(false);
    const [createPaymentForm] = Form.useForm();
    const [createPaymentLoading, setCreatePaymentLoading] = useState(false);

    // Fetch sales payments by melt_id
    const fetchSalesPayments = async (meltId) => {
        try {
            setIsSalesPaymentsLoading(true);
            const response = await getMeltingSalesPayments({ metal: meltId });
            setSalesPayments(response.purchases || []);
        } catch (error) {
            message.error('Failed to fetch payment details');
            console.error('Error fetching sales payments:', error);
        } finally {
            setIsSalesPaymentsLoading(false);
        }
    };

    // Create new payment
    // Create new payment - FIXED VERSION
    const handleCreatePayment = async (values) => {
        try {
            setCreatePaymentLoading(true);

            // Debug: Check what data we have
            console.log('Creating payment with values:', values);
            console.log('Selected payment record:', selectedPaymentRecord);
            console.log('Sales payments:', salesPayments);

            // Calculate total amount correctly - use calculations state
            const calculatedAmount = calculations[selectedPaymentRecord?.id]?.amount || 0;
            const totalAmount = parseFloat(calculatedAmount) || 0;

            // Calculate remaining due amount
            const totalPaidSoFar = salesPayments.reduce((total, payment) =>
                total + parseFloat(payment.completed_payment || 0), 0);

            const remainingDue = totalAmount - totalPaidSoFar;

            console.log('Payment Calculation:', {
                totalAmount,
                totalPaidSoFar,
                remainingDue
            });

            // Validate that paid amount doesn't exceed remaining due
            const paidAmount = parseFloat(values.paid_amount) || 0;
            if (paidAmount > remainingDue) {
                message.error(`Paid amount cannot exceed remaining due amount of ₹${remainingDue.toFixed(2)}`);
                return;
            }

            if (paidAmount <= 0) {
                message.error('Paid amount must be greater than 0');
                return;
            }

            // Prepare payment data - check API requirements
            const paymentData = {
                melt_id: selectedPaymentRecord.id, // This might be required
                user_id: selectedPaymentRecord.assign_customer,
                user_name: selectedPaymentRecord.assign_customer_name,
                payment_type: values.payment_type,
                total_payment: totalAmount.toString(),
                completed_payment: paidAmount.toString(),
                pending_payment: (remainingDue - paidAmount).toString(),
                transaction_id: values.transaction_id || null,
                cheque_number: values.cheque_number || null,
                bank_name: values.bank_name || null
            };

            console.log('Sending payment data:', paymentData);

            // Call API - check if melt_id should be first parameter or in the data object
            const response = await createSalesPayment(selectedPaymentRecord.id, paymentData);

            console.log('Payment creation response:', response);

            message.success('Payment created successfully!');
            setCreatePaymentModalVisible(false);
            createPaymentForm.resetFields();

            // Refresh payment data
            await fetchSalesPayments(selectedPaymentRecord.id);


        } catch (error) {
            console.error('Error creating payment:', error);

            // More specific error messages
            if (error.response) {
                // Server responded with error status
                message.error(error.response.data?.message || 'Server error occurred');
            } else if (error.request) {
                // Network error
                message.error('Network error - please check your connection');
            } else {
                // Other errors
                message.error('Failed to create payment: ' + error.message);
            }
        } finally {
            setCreatePaymentLoading(false);
        }
    };

    const handleUpdatePayment = (record) => {
        setSelectedPaymentRecord(record);
        setUpdatePaymentModalVisible(true);
        fetchSalesPayments(record.id);
    };

    const UpdatePaymentModal = () => {
        if (!selectedPaymentRecord) return null;

        const paymentDetails = selectedPaymentRecord.payment_details

            ? (typeof selectedPaymentRecord.payment_details === 'string'
                ? JSON.parse(selectedPaymentRecord.payment_details)
                : selectedPaymentRecord.payment_details)
            : null;

        const baseTotal = calculateProductValues(selectedPaymentRecord).amount;
        const roundOffAmount = parseFloat(selectedPaymentRecord?.round_off_amount || paymentDetails?.round_off_amount || 0);
        const finalTotal = getFinalProductTotal(selectedPaymentRecord);
        const totalPaid = salesPayments.reduce((total, payment) =>
            total + parseFloat(payment.completed_payment || 0), 0);

        const roundOffFromTable = salesPayments.reduce((total, payment) =>
            total + parseFloat(payment.pending_payment || 0), 0);

        const displayTotal = totalPaid + roundOffFromTable;
        const isFullyPaid = true; // User considers the round-off settled

        const paymentColumns = [

            {
                title: 'Payment ID',
                dataIndex: 'id',
                key: 'id',
                width: 100,
                render: (text) => <Tag color="blue">#{text}</Tag>
            },
            {
                title: 'Payment Type',
                dataIndex: 'payment_type',
                key: 'payment_type',
                width: 120,
                render: (type) => (
                    <Tag color={
                        type === 'cash' ? 'green' :
                            type === 'gpay' ? 'blue' :
                                type === 'cheque' ? 'orange' : 'purple'
                    }>
                        {type?.toUpperCase()}
                    </Tag>
                )
            },
            {
                title: 'Paid Amount (₹)',
                dataIndex: 'completed_payment',
                key: 'completed_payment',
                width: 120,
                render: (text) => <Text strong>₹{parseFloat(text || 0).toFixed(2)}</Text>
            },
            {
                title: 'Round Off (₹)',
                dataIndex: 'pending_payment',
                key: 'pending_payment',
                width: 120,
                render: (text) => <Text type="danger">₹{parseFloat(text || 0).toFixed(2)}</Text>
            },
            {
                title: 'Transaction ID',
                dataIndex: 'transaction_id',
                key: 'transaction_id',
                width: 150,
                render: (text) => text || 'N/A'
            },
            {
                title: 'Payment Date',
                dataIndex: 'payment_date',
                key: 'payment_date',
                width: 150,
                render: (text) => new Date(text).toLocaleDateString()
            }
        ];

        return (
            <Modal
                title={
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Payment Details - #{selectedPaymentRecord?.id}
                        <Tag color="blue" style={{ marginLeft: 16 }}>
                            Product: #AMAMELT{selectedPaymentRecord?.id}
                        </Tag>
                    </div>
                }
                visible={updatePaymentModalVisible}
                onCancel={() => {
                    setUpdatePaymentModalVisible(false);
                    setSelectedPaymentRecord(null);
                    setSalesPayments([]);
                }}
                footer={null}
                width={1000}
                maskClosable={false}
            >
                {/* Payment Summary */}
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Total Amount"
                                value={displayTotal}
                                precision={2}
                                prefix="₹"
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Total Paid"
                                value={totalPaid}
                                precision={2}
                                prefix="₹"
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Round Off"
                                value={roundOffFromTable}
                                precision={2}
                                prefix="₹"
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Payment Status"
                                value="Fully Paid"
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                    </Row>
                </Card>




                {/* Payment History Table */}
                <Card
                    title="Payment History"
                    extra={
                        !isFullyPaid && (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => setCreatePaymentModalVisible(true)}
                            >
                                Add Payment
                            </Button>
                        )
                    }
                >
                    <Table
                        columns={paymentColumns}
                        dataSource={salesPayments}
                        pagination={false}
                        rowKey="id"
                        loading={isSalesPaymentsLoading}
                        scroll={{ x: 800 }}
                        summary={() => (
                            <Table.Summary>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell colSpan={2}>
                                        <Text strong>Total</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                        <Text strong>₹{totalPaid.toFixed(2)}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                        <Text strong style={{ color: roundOffFromTable > 0 ? '#cf1322' : '#3f8600' }}>
                                            ₹{roundOffFromTable.toFixed(2)}
                                        </Text>
                                    </Table.Summary.Cell>

                                    <Table.Summary.Cell colSpan={2}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        )}
                    />
                </Card>
            </Modal>
        );
    };

    const CreatePaymentModal = () => {
        if (!selectedPaymentRecord) return null;

        const totalAmount = getFinalProductTotal(selectedPaymentRecord);

        const totalPaid = salesPayments.reduce((total, payment) =>
            total + parseFloat(payment.completed_payment || 0), 0);

        const remainingDue = Math.max(0, totalAmount - totalPaid);

        const handleAmountChange = (value) => {
            const paid = parseFloat(value) || 0;
            const newDue = Math.max(0, remainingDue - paid);
            createPaymentForm.setFieldsValue({
                due_amount: newDue
            });
        };



        return (
            <Modal
                title={
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Add Payment - #{selectedPaymentRecord?.id}
                    </div>
                }
                visible={createPaymentModalVisible}
                onCancel={() => {
                    setCreatePaymentModalVisible(false);
                    createPaymentForm.resetFields();
                }}
                footer={null}
                width={600}
                maskClosable={false}
            >
                <Form
                    form={createPaymentForm}
                    layout="vertical"
                    onFinish={handleCreatePayment}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="payment_type"
                                label="Payment Type"
                                rules={[{ required: true, message: 'Please select payment type' }]}
                            >
                                <Select placeholder="Select Payment Type">
                                    {paymentTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            <span style={{ marginRight: 8 }}>{type.icon}</span>
                                            {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="paid_amount"
                                label={`Paid Amount (Max: ₹${remainingDue.toFixed(2)})`}
                                rules={[
                                    { required: true, message: 'Please enter paid amount' },
                                    {
                                        validator: (_, value) => {
                                            const paid = parseFloat(value) || 0;
                                            if (paid > remainingDue) {
                                                return Promise.reject(new Error(`Cannot exceed remaining due of ₹${remainingDue.toFixed(2)}`));
                                            }
                                            if (paid <= 0) {
                                                return Promise.reject(new Error('Paid amount must be greater than 0'));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Enter paid amount"
                                    min={0}
                                    max={remainingDue}
                                    step={0.01}
                                    precision={2}
                                    onChange={handleAmountChange}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="due_amount"
                                label="Remaining Due After Payment"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    disabled
                                    value={remainingDue}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Conditional Fields */}
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.payment_type !== currentValues.payment_type}
                    >
                        {({ getFieldValue }) => {
                            const paymentType = getFieldValue('payment_type');
                            return (
                                <>
                                    {(paymentType === 'gpay' || paymentType === 'card') && (
                                        <Form.Item
                                            name="transaction_id"
                                            label="Transaction ID"
                                            rules={[{ required: true, message: 'Please enter transaction ID' }]}
                                        >
                                            <Input placeholder={`Enter ${paymentType} transaction ID`} />
                                        </Form.Item>
                                    )}

                                    {paymentType === 'cheque' && (
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="cheque_number"
                                                    label="Cheque Number"
                                                    rules={[{ required: true, message: 'Please enter cheque number' }]}
                                                >
                                                    <Input placeholder="Enter cheque number" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="bank_name"
                                                    label="Bank Name"
                                                    rules={[{ required: true, message: 'Please enter bank name' }]}
                                                >
                                                    <Input placeholder="Enter bank name" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    )}
                                </>
                            );
                        }}
                    </Form.Item>

                    <Form.Item>
                        <div style={{ textAlign: 'right' }}>
                            <Space>
                                <Button
                                    onClick={() => {
                                        setCreatePaymentModalVisible(false);
                                        createPaymentForm.resetFields();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={createPaymentLoading}
                                    icon={<CheckCircleOutlined />}
                                >
                                    Add Payment
                                </Button>
                            </Space>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        );
    };

    // Fetch customers with pagination
    const fetchCustomers = async (page = 1, pageSize = 10, filters = {}) => {
        try {
            setIsCustomerLoading(true);
            const response = await getCustomers(page, pageSize, filters);
            setCustomers(response.customers || []);

            if (response.pagination) {
                setCustomerPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.pagination.total
                }));
            }
        } catch (error) {
            message.error('Failed to fetch customers');
            console.error('Error fetching customers:', error);
        } finally {
            setIsCustomerLoading(false);
        }
    };

    // Handle customer search
    const handleCustomerSearch = (value) => {
        setCustomerFilters(prev => ({ ...prev, search: value, page: 1 }));
        fetchCustomers(1, customerPagination.pageSize, { search: value });
    };

    // Handle customer table pagination change
    const handleCustomerTableChange = (newPagination) => {
        const { current, pageSize } = newPagination;
        setCustomerPagination(prev => ({
            ...prev,
            current: current,
            pageSize: pageSize
        }));
        fetchCustomers(current, pageSize, customerFilters);
    };

    // Open customer assignment modal
    const handleAssignCustomer = (record) => {
        setSelectedMeltProduct(record);
        setCustomerModalVisible(true);
        fetchCustomers(1, customerPagination.pageSize);
    };

    // Assign customer to melt product
    // Update the handleCustomerSelect function to set calculated amount
    const handleCustomerSelect = async (customer) => {
        try {
            setSelectedCustomer(customer);

            // Close customer modal and open payment modal
            setCustomerModalVisible(false);
            setPaymentModalVisible(true);

            // Reset payment form
            paymentForm.resetFields();

            // Get calculated amount for the selected product
            const productCalc = calculations[selectedMeltProduct?.id] || {};
            const calculatedAmount = productCalc.amount || 0;

            console.log('Setting calculated amount:', calculatedAmount);

            // Set default values with calculated amount
            paymentForm.setFieldsValue({
                payment_mode: 'full',
                payment_type: ['cash'],
                payment_amounts: { cash: calculatedAmount },
                total_amount: calculatedAmount,
                due_amount: 0,
                paid_amount: calculatedAmount
            });

        } catch (error) {
            console.error('Error selecting customer:', error);
            message.error('Failed to proceed with customer selection');
        }
    };
    const handlePaymentSubmit = async (values) => {
        try {
            setPaymentLoading(true);

            // Validate total amount breakdown
            const totalPaid = Object.values(values.payment_amounts || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            const roundOff = values.round_off_active ? (parseFloat(values.round_off_amount) || 0) : 0;
            const expectedTotal = parseFloat(values.total_amount);

            // Check if sum of payments matches expected total
            if (Math.abs(totalPaid - expectedTotal) > 0.01) {
                // If it doesn't match, maybe they want the total to include round off but haven't updated payments
                // The expectedTotal from form is (sum of payments + round off)
            }

            // Get current user info
            const currentUser = {
                id: 1,
                name: 'Admin User'
            };

            // Prepare payment data
            const paymentData = {
                assign_customer: selectedCustomer.id,
                assign_customer_name: selectedCustomer.customer_name,
                assigned_at: new Date().toISOString(),
                assign_customer_payment_type: values.payment_type ? values.payment_type.join(', ') : '',
                total_amount: expectedTotal, // Save at root level for persistence
                round_off_amount: roundOff,   // Save at root level for persistence
                payment_details: JSON.stringify({
                    user_id: selectedCustomer.id,
                    user_name: selectedCustomer.customer_name,
                    payment_mode: values.payment_mode,
                    payment_type: values.payment_type ? values.payment_type.join(', ') : '',
                    total_amount: expectedTotal,
                    paid_amount: totalPaid,
                    payment_amounts: values.payment_amounts,
                    round_off_amount: roundOff,
                    due_amount: Math.max(0, expectedTotal - totalPaid),
                    transaction_id: values.transaction_id,
                    cheque_number: values.cheque_number,
                    bank_name: values.bank_name,
                    payment_date: new Date().toISOString(),
                    notes: values.notes
                })
            };



            // Update melt product with customer and payment information
            await updateMeltProduct(selectedMeltProduct.id, paymentData);

            message.success(`Customer ${selectedCustomer.customer_name} assigned with ${values.payment_mode} payment!`);

            // Refresh melt products
            fetchMeltProducts(meltPagination.current, meltPagination.pageSize);

            // Close modals and reset states
            setPaymentModalVisible(false);
            setSelectedMeltProduct(null);
            setSelectedCustomer(null);

        } catch (error) {
            console.error('Error processing payment:', error);
            message.error('Failed to process payment');
        } finally {
            setPaymentLoading(false);
        }
    };
    const handleAmountChange = (changedValues, allValues) => {
        if (changedValues.payment_amounts || changedValues.payment_type || changedValues.round_off_amount || changedValues.round_off_active !== undefined) {
            const currentTypes = allValues.payment_type || [];
            const currentAmounts = allValues.payment_amounts || {};
            const roundOffActive = allValues.round_off_active || false;
            const roundOffAmount = roundOffActive ? (parseFloat(allValues.round_off_amount) || 0) : 0;

            // Clean up amounts for types that were removed
            const cleanedAmounts = {};
            currentTypes.forEach(type => {
                cleanedAmounts[type] = currentAmounts[type] || 0;
            });

            const sumPayments = Object.values(cleanedAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            const total = sumPayments + roundOffAmount;

            paymentForm.setFieldsValue({
                payment_amounts: cleanedAmounts,
                total_amount: total,
                paid_amount: total,
                due_amount: 0
            });
        }
    };



    // Update the PaymentModal component to handle payment mode changes
    const PaymentModal = () => {
        const [selectedPaymentType, setSelectedPaymentType] = useState(['cash']);
        const [selectedPaymentMode, setSelectedPaymentMode] = useState('full');

        const handlePaymentModeChange = (value) => {
            setSelectedPaymentMode(value);
            const total = paymentForm.getFieldValue('total_amount') || 0;

            if (value === 'due') {
                paymentForm.setFieldsValue({
                    paid_amount: 0,
                    due_amount: total
                });
            } else if (value === 'full') {
                paymentForm.setFieldsValue({
                    paid_amount: total,
                    due_amount: 0
                });
            } else if (value === 'partial') {
                // Keep current values for partial payment
                const currentPaid = paymentForm.getFieldValue('paid_amount') || 0;
                const currentDue = total - currentPaid;
                paymentForm.setFieldsValue({
                    due_amount: currentDue > 0 ? currentDue : 0
                });
            }
        };

        return (
            <Modal
                title={
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Complete Customer Assignment
                        {selectedMeltProduct && (
                            <Tag color="blue" style={{ marginLeft: 16 }}>
                                Product: #AMAMELT{selectedMeltProduct.id}
                            </Tag>
                        )}
                    </div>
                }
                visible={paymentModalVisible}
                onCancel={() => {
                    setPaymentModalVisible(false);
                    setSelectedCustomer(null);
                    setSelectedMeltProduct(null);
                }}
                footer={null}
                width={700}
                maskClosable={false}
            >
                {/* Customer Info Card */}
                <Card
                    size="small"
                    style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}
                    title={
                        <div>
                            <UserOutlined style={{ marginRight: 8 }} />
                            Selected Customer
                        </div>
                    }
                >
                    <Row gutter={16} align="middle">
                        <Col span={4}>
                            <Avatar
                                src={selectedCustomer?.customer_photo ? `${uploadConfigUrl}${selectedCustomer.customer_photo}` : null}
                                size="large"
                                icon={!selectedCustomer?.customer_photo && <UserOutlined />}
                                style={{
                                    backgroundColor: selectedCustomer?.customer_photo ? 'transparent' : roots.gold[400],
                                    color: roots.text.inverse
                                }}
                            />
                        </Col>
                        <Col span={20}>
                            <Row gutter={[8, 8]}>
                                <Col span={12}>
                                    <Text strong>Name: </Text>
                                    <Text>{selectedCustomer?.customer_name}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>ID: </Text>
                                    <Text>{selectedCustomer?.customer_id}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Phone: </Text>
                                    <Text>{selectedCustomer?.phone || 'N/A'}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Aadhar: </Text>
                                    <Text>{selectedCustomer?.aadhar_no || 'N/A'}</Text>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>

                {/* Product Info Card */}
                <Card
                    size="small"
                    style={{ marginBottom: 16 }}
                    title={
                        <div>
                            <InfoCircleOutlined style={{ marginRight: 8 }} />
                            Product Details
                        </div>
                    }
                >
                    <Row gutter={16}>
                        <Col span={8}>
                            <Statistic
                                title="Total Amount"
                                value={calculations[selectedMeltProduct?.id]?.amount || 0}
                                precision={2}
                                prefix="₹"
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Final Weight"
                                value={calculations[selectedMeltProduct?.id]?.finalWeight || 0}
                                precision={3}
                                suffix="g"
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Current Rate"
                                value={liveGoldRate}
                                precision={2}
                                prefix="₹"
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Payment Form */}
                <Form
                    form={paymentForm}
                    layout="vertical"
                    onFinish={handlePaymentSubmit}
                    onValuesChange={handleAmountChange}
                >
                    <Row gutter={16}>
                        {/* Payment Mode */}
                        <Col span={12}>
                            <Form.Item
                                name="payment_mode"
                                label="Payment Mode"
                                rules={[{ required: true, message: 'Please select payment mode' }]}
                            >
                                <Select
                                    placeholder="Select Payment Mode"
                                    onChange={handlePaymentModeChange}
                                >
                                    {paymentModes.map(mode => (
                                        <Option key={mode.value} value={mode.value}>
                                            {mode.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        {/* Payment Type */}
                        <Col span={12}>
                            <Form.Item
                                name="payment_type"
                                label="Payment Type"
                                rules={[{ required: true, message: 'Please select payment type' }]}
                            >
                                <Select
                                    placeholder="Select Payment Type"
                                    mode="multiple"
                                    onChange={(value) => setSelectedPaymentType(value)}
                                >
                                    {paymentTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            <span style={{ marginRight: 8 }}>{type.icon}</span>
                                            {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>



                    {/* Amount Breakdown for each Payment Type */}
                    <Divider orientation="left" style={{ margin: '12px 0' }}>Payment Breakdown</Divider>
                    <div style={{ padding: '0 8px 16px 8px' }}>
                        {selectedPaymentType.map(type => (
                            <Row gutter={16} key={type} align="middle" style={{ marginBottom: 12 }}>
                                <Col span={14}>
                                    <Text strong>
                                        <span style={{ marginRight: 8 }}>{paymentTypes.find(t => t.value === type)?.icon}</span>
                                        {paymentTypes.find(t => t.value === type)?.label} Amount (₹)
                                    </Text>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        name={['payment_amounts', type]}
                                        noStyle
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Enter amount"
                                            min={0}
                                            step={0.01}
                                            precision={2}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        ))}

                        {/* Round Off Section */}
                        <Divider dashed style={{ margin: '8px 0' }} />
                        <Row gutter={16} align="middle">
                            <Col span={14}>
                                <Form.Item name="round_off_active" valuePropName="checked" noStyle>
                                    <Checkbox>Round Off / Adjustment Amount (₹)</Checkbox>
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.round_off_active !== curr.round_off_active}>
                                    {({ getFieldValue }) => (
                                        getFieldValue('round_off_active') && (
                                            <Form.Item name="round_off_amount" noStyle rules={[{ required: true, message: 'Value required' }]}>
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="Amount (+/-)"
                                                    step={0.01}
                                                    precision={2}
                                                />
                                            </Form.Item>
                                        )
                                    )}
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>


                    {/* Conditional Fields based on Payment Type */}
                    {(selectedPaymentType.includes('gpay') || selectedPaymentType.includes('card')) && selectedPaymentMode !== 'due' && (
                        <Form.Item
                            name="transaction_id"
                            label="Transaction ID"
                            rules={[{ required: true, message: 'Please enter transaction ID' }]}
                        >
                            <Input placeholder={`Enter ${selectedPaymentType} transaction ID`} />
                        </Form.Item>
                    )}

                    {selectedPaymentType.includes('cheque') && selectedPaymentMode !== 'due' && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="cheque_number"
                                    label="Cheque Number"
                                    rules={[{ required: true, message: 'Please enter cheque number' }]}
                                >
                                    <Input placeholder="Enter cheque number" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="bank_name"
                                    label="Bank Name"
                                    rules={[{ required: true, message: 'Please enter bank name' }]}
                                >
                                    <Input placeholder="Enter bank name" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Row gutter={16} style={{ marginTop: 16 }}>
                        {/* Total Amount */}
                        <Col span={24}>
                            <Form.Item
                                name="total_amount"
                                label={<Text strong style={{ color: roots.gold[600] }}>Calculated Total Amount (₹)</Text>}
                                rules={[{ required: true, message: 'Please enter total amount' }]}
                            >
                                <InputNumber
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#f6ffed',
                                        fontWeight: 'bold',
                                        color: '#3f8600',
                                        borderColor: '#b7eb8f'
                                    }}
                                    placeholder="Total Amount"
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                    disabled
                                />
                            </Form.Item>
                        </Col>

                        {/* Remaining Amount */}
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                if (getFieldValue('round_off_active')) return null;

                                const baseAmount = calculations[selectedMeltProduct?.id]?.amount || 0;
                                const roundOff = getFieldValue('round_off_active') ? (getFieldValue('round_off_amount') || 0) : 0;
                                const adjustedTotal = baseAmount + roundOff;

                                const paymentAmounts = getFieldValue('payment_amounts') || {};
                                const sumPayments = Object.values(paymentAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

                                const remainingAmount = adjustedTotal - sumPayments;
                                return (
                                    <Col span={24}>
                                        <Form.Item
                                            label={<Text strong style={{ color: Math.abs(remainingAmount) > 0.01 ? '#cf1322' : '#3f8600' }}>Remaining Amount (₹)</Text>}
                                        >
                                            <InputNumber
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: Math.abs(remainingAmount) > 0.01 ? '#fff1f0' : '#f6ffed',
                                                    fontWeight: 'bold',
                                                    color: Math.abs(remainingAmount) > 0.01 ? '#cf1322' : '#3f8600',
                                                    borderColor: Math.abs(remainingAmount) > 0.01 ? '#ffa39e' : '#b7eb8f'
                                                }}
                                                value={parseFloat(remainingAmount.toFixed(2))}
                                                precision={2}
                                                disabled
                                                prefix="₹"
                                            />
                                        </Form.Item>
                                    </Col>
                                );
                            }}
                        </Form.Item>



                    </Row>

                    {/* Additional Notes */}

                    {/* Form Actions */}
                    <Form.Item>
                        <div style={{ textAlign: 'right' }}>
                            <Space>
                                <Button
                                    onClick={() => {
                                        setPaymentModalVisible(false);
                                        setSelectedCustomer(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={paymentLoading}
                                    icon={<CheckCircleOutlined />}
                                >
                                    Complete Assignment
                                </Button>
                            </Space>
                        </div>
                    </Form.Item>
                </Form>
            </Modal >
        );
    };

    // Customer columns for the assignment modal
    const customerColumns = [
        {
            title: 'Photo',
            dataIndex: 'customer_photo',
            key: 'customer_photo',
            width: 80,
            render: (photo) => (
                <Avatar
                    src={photo ? `${uploadConfigUrl}${photo}` : null}
                    size="large"
                    icon={!photo && <CameraOutlined />}
                    style={{
                        backgroundColor: photo ? 'transparent' : roots.gold[400],
                        color: roots.text.inverse
                    }}
                />
            )
        },
        {
            title: 'Customer ID',
            dataIndex: 'customer_id',
            key: 'customer_id',
            width: 120,
            render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
        },
        {
            title: 'Customer Name',
            dataIndex: 'customer_name',
            key: 'customer_name',
            width: 150,
            render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
        },
        {
            title: 'Aadhar No',
            dataIndex: 'aadhar_no',
            key: 'aadhar_no',
            width: 140
        },
        {
            title: 'PAN No',
            dataIndex: 'pan_no',
            key: 'pan_no',
            width: 120
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 120
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={() => handleCustomerSelect(record)}
                >
                    Select
                </Button>
            )
        }
    ];
    // Calculation state
    const [calculations, setCalculations] = useState({});

    // Main table pagination
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    });

    // Modal table pagination
    const [modalPagination, setModalPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true
    });

    const [isTableLoading, setIsTableLoading] = useState(false);
    const [isModalTableLoading, setIsModalTableLoading] = useState(false);

    const [purchaseFilters, setPurchaseFilters] = useState({
        search: '',
        metal: '',
        status: '',
        productType: ''
    });

    const fetchMCXData = async () => {
        try {
            const response = await getMCXRates();
            console.log('MCX Response:', response);

            if (response && response.length > 0) {
                const goldRate = parseFloat(response[0]?.rate) || 0;
                const subAmt = parseFloat(response[0]?.sub_amt) || 0;
                const calculatedRate = goldRate - subAmt;

                console.log('Gold Rate:', goldRate, 'Sub Amt:', subAmt, 'Final Rate:', calculatedRate);

                setLiveGoldRate(calculatedRate);
                liveGoldRateRef.current = calculatedRate; // Update the ref
                return calculatedRate;
            } else {
                console.warn('No MCX data found');
                setLiveGoldRate(0);
                liveGoldRateRef.current = 0;
                return 0;
            }
        } catch (error) {
            console.error('Error fetching MCX rates:', error);
            setLiveGoldRate(0);
            liveGoldRateRef.current = 0;
            return 0;
        }
    };

    // Update calculateProductValues to use the ref
    const calculateProductValues = (product) => {
        if (!product) return { netWeight: 0, marginWeight: 0, finalWeight: 0, rate: 0, amount: 0 };
        const weight = parseFloat(product.weight) || 0;

        const meltWeight = parseFloat(product.melt_weight) || 0;
        const dustWeight = parseFloat(product.dust_weight) || 0;
        const purity = parseFloat(product.purity) || 100;
        const marginPercent = 3;

        // ✅ Step 1: Net weight after dust & stone
        const netWeight = (weight - dustWeight) * (purity / 100);

        // ✅ Step 2: Margin deduction
        const marginWeight = (netWeight * marginPercent) / 100;

        // ✅ Step 3: Final weight after margin
        const finalWeight = netWeight - marginWeight;

        // ✅ Step 4: Use live gold rate from ref (always current)
        const currentRate = liveGoldRateRef.current;
        console.log("CURRENT RATE from ref:", currentRate);

        // ✅ Step 5: Amount calculation
        const amount = finalWeight * currentRate;

        return {
            netWeight: parseFloat(netWeight.toFixed(3)),
            marginWeight: parseFloat(marginWeight.toFixed(3)),
            finalWeight: parseFloat(finalWeight.toFixed(3)),
            rate: parseFloat(currentRate.toFixed(2)),
            amount: parseFloat(amount.toFixed(2))
        };
    };

    const getFinalProductTotal = (record) => {
        if (!record) return 0;

        // 1. Check root total_amount
        if (record.total_amount) {
            return parseFloat(record.total_amount);
        }

        const paymentDetails = record.payment_details
            ? (typeof record.payment_details === 'string'
                ? JSON.parse(record.payment_details)
                : record.payment_details)
            : null;

        // 2. Check payment_details
        if (paymentDetails && paymentDetails.total_amount) {
            return parseFloat(paymentDetails.total_amount);
        }

        // 3. Fallback: Base Price + stored Round Off
        const basePrice = calculateProductValues(record).amount;
        const roundOff = parseFloat(record.round_off_amount || paymentDetails?.round_off_amount || 0);

        return basePrice + roundOff;
    };



    // Add this function to handle manual refresh
    // Add this function to handle manual refresh
    const handleRefreshGoldRate = async () => {
        setLoading(true);
        try {
            await fetchMCXData();
            message.success('Gold rate updated successfully!');
        } catch (error) {
            message.error('Failed to refresh gold rate');
        } finally {
            setLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                console.log('Step 1: Fetching MCX data...');
                // First fetch MCX data and wait for it to complete
                await fetchMCXData();

                console.log('Step 2: MCX data loaded, fetching product options...');
                // Then fetch product options
                await fetchProductOptionsData();

                console.log('Step 3: Product options loaded, fetching melt products...');
                // Then fetch melt products (now liveGoldRate should be available)
                await fetchMeltProducts(1, meltPagination.pageSize);

                console.log('Step 4: Melt products loaded, fetching initial data...');
                // Finally fetch initial purchase data
                await fetchInitialData(1, pagination.pageSize);

                console.log('All data loaded successfully!');

            } catch (error) {
                console.error('Error initializing data:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeData();

        // Set up 1-second live refresh for rates
        const interval = setInterval(() => {
            fetchMCXData();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Fetch options for dropdowns
    const fetchProductOptionsData = async () => {
        try {
            await fetchMetalOptions();
            await fetchProductOptions();
            await fetchAllSubProductOptions();
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchMetalOptions = async () => {
        try {
            const response = await getMetals();
            console.log('Metals API Response:', response);
            const metalsData = response.data?.metals || response.metals || [];
            setMetalOptions(metalsData.map(metal => ({
                id: metal.id,
                name: metal.metalname,
                code: metal.metal_code
            })));
            setMetals(metalsData);
        } catch (error) {
            message.error('Failed to fetch metal options');
            console.error('Error fetching metals:', error);
        }
    };
    const handleViewPurchaseDetails = (record) => {
        setSelectedPurchasesJson(record.purchases);
        setSelectedMeltRecord(record);
        setPurchaseDetailsVisible(true);
    };

    const handleClosePurchaseDetails = () => {
        setPurchaseDetailsVisible(false);
        setSelectedPurchasesJson('');
        setSelectedMeltRecord(null);
    };
    const fetchProductOptions = async () => {
        try {
            const response = await getProducts();
            console.log('Products API Response:', response);
            const productsData = response.data?.products || response.products || [];
            const formattedProducts = productsData.map(product => ({
                id: product.id,
                name: product.product_name,
                code: product.product_code,
                metalId: product.metal_id
            }));
            setProductOptions(formattedProducts);
            setAllProducts(productsData);
        } catch (error) {
            message.error('Failed to fetch product options');
            console.error('Error fetching products:', error);
        }
    };

    const fetchAllSubProductOptions = async () => {
        try {
            const response = await getSubProducts();
            console.log('SubProducts API Response:', response);
            const subsData = response.data?.subProducts || response.subProducts || [];
            const subsByProduct = {};

            subsData.forEach(sub => {
                const productId = sub.product_id;
                if (!subsByProduct[productId]) {
                    subsByProduct[productId] = [];
                }
                subsByProduct[productId].push({
                    id: sub.id,
                    name: sub.sub_product_name,
                    code: sub.sub_product_code,
                    productId: productId
                });
            });
            setSubProductOptions(subsByProduct);
            setAllSubProducts(subsData);
        } catch (error) {
            message.error('Failed to fetch sub product options');
            console.error('Error fetching sub products:', error);
        }
    };
    // Fetch melt products
    const fetchMeltProducts = async (page = 1, pageSize = 10) => {
        try {
            setIsMeltTableLoading(true);

            const response = await getAllMeltReceiptProducts({
                page: page,
                limit: pageSize,
                // status: 1
            });

            console.log('Melt Products API Response:', response);
            console.log('Current Live Gold Rate for calculation:', liveGoldRate);

            const meltProductsData = response.data?.purchases || response.purchases || [];
            console.log('Melt Products Data:', meltProductsData);

            // Set melt products first
            setMeltProducts(meltProductsData);

            // Calculate values - this will use the current liveGoldRate
            const initialCalculations = {};
            meltProductsData.forEach(product => {
                initialCalculations[product.id] = calculateProductValues(product);
            });
            setCalculations(initialCalculations);

            if (response.data?.pagination) {
                setMeltPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.data.pagination.total
                }));
            } else if (response.pagination) {
                setMeltPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.pagination.total
                }));
            }
        } catch (error) {
            message.error('Failed to load melt products');
            console.error('Error loading melt products:', error);
        } finally {
            setIsMeltTableLoading(false);
        }
    };
    const filteredMeltProducts = React.useMemo(() => {
        return meltProducts.filter(item => {
            // Search filter
            const searchMatch = !purchaseFilters.search ||
                item.id.toString().includes(purchaseFilters.search) ||
                (item.customer_name && item.customer_name.toLowerCase().includes(purchaseFilters.search.toLowerCase())) ||
                (item.metal_details && item.metal_details.toLowerCase().includes(purchaseFilters.search.toLowerCase()));

            // Metal filter
            const metalMatch = !purchaseFilters.metal || item.metal === purchaseFilters.metal;

            // Status filter
            const statusMatch = !purchaseFilters.status ||
                (purchaseFilters.status === '1' && item.melt_details !== null) ||
                (purchaseFilters.status === '0' && item.melt_details === null);

            // Product Type (Conversion Type) filter
            let productTypeMatch = true;
            if (purchaseFilters.productType) {
                try {
                    const details = item.metal_details ? JSON.parse(item.metal_details) : null;
                    if (purchaseFilters.productType === 'old ornaments') {
                        // Match if it's NOT 22k and NOT 24K
                        productTypeMatch = !details || (details.conversion_type !== '22k' && details.conversion_type !== '24K');
                    } else {
                        productTypeMatch = details && details.conversion_type === purchaseFilters.productType;
                    }
                } catch (e) {
                    productTypeMatch = (purchaseFilters.productType === 'old ornaments');
                }
            }

            return searchMatch && metalMatch && statusMatch && productTypeMatch;
        });
    }, [meltProducts, purchaseFilters]);

    // Add this function to force refresh calculations
    const forceRefreshCalculations = () => {
        if (meltProducts.length > 0) {
            console.log('Force refreshing calculations with gold rate:', liveGoldRate);
            const updatedCalculations = {};
            meltProducts.forEach(product => {
                updatedCalculations[product.id] = calculateProductValues(product);
            });
            setCalculations(updatedCalculations);
            message.success('Calculations refreshed!');
        } else {
            message.warning('No melt products to calculate');
        }
    };


    const handleMeltTableChange = (newPagination) => {
        const { current, pageSize } = newPagination;
        setMeltPagination(prev => ({
            ...prev,
            current: current,
            pageSize: pageSize
        }));
        fetchMeltProducts(current, pageSize);
    };

    const handleMeltProductUpdate = (id, field, value) => {
        const updatedProducts = meltProducts.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );

        setMeltProducts(updatedProducts);

        // Recalculate values when relevant fields change
        if (['weight', 'melt_weight', 'dust_weight', 'purity', 'metal'].includes(field)) {
            const updatedProduct = updatedProducts.find(item => item.id === id);
            if (updatedProduct) {
                const newCalculations = calculateProductValues(updatedProduct);
                setCalculations(prev => ({
                    ...prev,
                    [id]: newCalculations
                }));
            }
        }
    };

    // Customer Assignment Modal Component
    const CustomerAssignmentModal = () => {
        return (
            <Modal
                title={
                    <div>
                        <UserOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        Assign Customer to Melt Product
                        {selectedMeltProduct && (
                            <Tag color="blue" style={{ marginLeft: 16 }}>
                                Product: #AMAMELT{selectedMeltProduct.id}
                            </Tag>
                        )}
                    </div>
                }
                visible={customerModalVisible}
                onCancel={() => {
                    setCustomerModalVisible(false);
                    setSelectedMeltProduct(null);
                }}
                footer={null}
                width={1000}
            >
                <Card>
                    {/* Customer Search */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Input
                                placeholder="Search customers by name, ID, Aadhar or PAN"
                                prefix={<SearchOutlined />}
                                value={customerFilters.search}
                                onChange={(e) => handleCustomerSearch(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    setCustomerFilters({ search: '', page: 1, limit: 10 });
                                    fetchCustomers(1, customerPagination.pageSize);
                                }}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>

                    {/* Customers Table */}
                    <Table
                        columns={customerColumns}
                        dataSource={customers}
                        pagination={{
                            current: customerPagination.current,
                            pageSize: customerPagination.pageSize,
                            total: customerPagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} customers`,
                            pageSizeOptions: ['10', '20', '50', '100']
                        }}
                        onChange={handleCustomerTableChange}
                        rowKey="id"
                        loading={isCustomerLoading}
                        scroll={{ x: 800, y: 400 }}
                    />
                </Card>
            </Modal>
        );
    };
    const PurchaseDetailsModal = ({ purchasesJson, visible, onCancel, record }) => {
        const [purchaseData, setPurchaseData] = useState([]);
        const [loading, setLoading] = useState(false);
        const [isSaving, setIsSaving] = useState(false);
        const [cgst, setCgst] = useState(0);
        const [sgst, setSgst] = useState(0);
        const [roundOff, setRoundOff] = useState(0);

        useEffect(() => {
            if (visible && purchasesJson) {
                setLoading(true);
                try {
                    const parsedData = JSON.parse(purchasesJson || '[]');
                    const data = Array.isArray(parsedData) ? parsedData : [];

                    // Initialize rate if missing (derived from amount / gross_weight)
                    const initializedData = data.map(item => {
                        const amount = parseFloat(item.amount) || 0;
                        const weight = parseFloat(item.gross_weight) || 0;
                        if (!item.rate && weight > 0) {
                            return { ...item, rate: (amount / weight).toFixed(2) };
                        }
                        return item;
                    });

                    setPurchaseData(initializedData);

                    // Initialize tax fields from record
                    if (record) {
                        setCgst(record.cgst || 0);
                        setSgst(record.sgst || 0);
                        setRoundOff(record.round_off || 0);
                    }
                } catch (error) {
                    console.error('Error parsing purchase details:', error);
                    setPurchaseData([]);
                } finally {
                    setLoading(false);
                }
            }
        }, [visible, purchasesJson, record]);

        const handleUpdatePurchaseItem = (index, field, value) => {
            const newData = [...purchaseData];
            const item = { ...newData[index], [field]: value };

            if (field === 'rate' || field === 'gross_weight') {
                const rate = parseFloat(field === 'rate' ? value : item.rate) || 0;
                const weight = parseFloat(field === 'gross_weight' ? value : item.gross_weight) || 0;
                item.amount = (rate * weight).toFixed(2);
            } else if (field === 'amount') {
                const amount = parseFloat(value) || 0;
                const weight = parseFloat(item.gross_weight) || 0;
                if (weight > 0) {
                    item.rate = (amount / weight).toFixed(2);
                }
            }

            newData[index] = item;
            setPurchaseData(newData);
        };

        useEffect(() => {
            const total = purchaseData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            const gst = (total * 0.015).toFixed(2);
            setCgst(parseFloat(gst));
            setSgst(parseFloat(gst));
        }, [purchaseData]);

        const handleSaveChanges = async () => {
            if (!record?.id) return;

            setIsSaving(true);
            try {
                const totalWt = purchaseData.reduce((total, product) => total + parseFloat(product.gross_weight || 0), 0).toFixed(3);
                await updateMeltProduct(record.id, {
                    purchases: JSON.stringify(purchaseData),
                    weight: totalWt,
                    cgst: cgst || 0,
                    sgst: sgst || 0,
                    round_off: roundOff || 0
                });
                message.success('Product details updated successfully');
                fetchMeltProducts();
                onCancel();
            } catch (error) {
                console.error('Error updating purchase details:', error);
                message.error('Failed to update product details');
            } finally {
                setIsSaving(false);
            }
        };

        const isNewFormat = Array.isArray(purchaseData) && purchaseData.length > 0 && typeof purchaseData[0] === 'object' && purchaseData[0].purchase_id;

        const totalWeight = purchaseData.reduce((total, product) => total + parseFloat(product.gross_weight || 0), 0).toFixed(3);
        const totalAmount = purchaseData.reduce((total, product) => total + parseFloat(product.amount || 0), 0).toFixed(2);

        return (
            <Modal
                title={isNewFormat ? "Product Details" : "Purchase Details"}
                visible={visible}
                onCancel={onCancel}
                footer={[
                    <Button key="close" onClick={onCancel}>
                        Close
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={isSaving}
                        onClick={handleSaveChanges}
                        disabled={purchaseData.length === 0}
                    >
                        Save Changes
                    </Button>
                ]}
                width={isNewFormat ? 900 : 600}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <ReloadOutlined spin />
                        <div>Loading details...</div>
                    </div>
                ) : isNewFormat ? (
                    <div>
                        <Table
                            size="small"
                            dataSource={purchaseData}
                            pagination={false}
                            rowKey={(record, index) => index}
                            columns={[
                                {
                                    title: 'Purchase ID',
                                    dataIndex: 'purchase_id',
                                    key: 'purchase_id',
                                    width: 120,
                                    render: (text) => <Tag color="blue">{text}</Tag>
                                },
                                {
                                    title: 'Customer',
                                    dataIndex: 'customer_name',
                                    key: 'customer_name',
                                    width: 120,
                                    render: (text) => <Text>{text || 'N/A'}</Text>
                                },
                                {
                                    title: 'Product',
                                    key: 'product',
                                    width: 150,
                                    render: (_, record) => (
                                        <Text>
                                            {record.metal || 'N/A'} - {record.product || 'N/A'} - {record.sub_product || 'N/A'}
                                        </Text>
                                    )
                                },
                                {
                                    title: 'Product Type',
                                    key: 'product_type',
                                    width: 120,
                                    render: () => {
                                        const details = record?.metal_details ? JSON.parse(record.metal_details) : null;
                                        return <Tag color="gold">{record?.product_type || details?.conversion_type || 'old ornaments'}</Tag>;
                                    }
                                },
                                {
                                    title: 'Weight (g)',
                                    key: 'weight',
                                    width: 160,
                                    render: (_, record, index) => (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', width: '40px' }}>Gross:</span>
                                                <InputNumber
                                                    size="small"
                                                    value={record.gross_weight}
                                                    onChange={(val) => handleUpdatePurchaseItem(index, 'gross_weight', val)}
                                                    style={{ width: '90px' }}
                                                    step={0.001}
                                                    precision={3}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', width: '40px' }}>Net:</span>
                                                <InputNumber
                                                    size="small"
                                                    value={record.net_weight}
                                                    onChange={(val) => handleUpdatePurchaseItem(index, 'net_weight', val)}
                                                    style={{ width: '90px' }}
                                                    step={0.001}
                                                    precision={3}
                                                />
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Rate (₹/g)',
                                    key: 'rate',
                                    width: 120,
                                    render: (_, record, index) => (
                                        <InputNumber
                                            size="small"
                                            value={record.rate}
                                            onChange={(val) => handleUpdatePurchaseItem(index, 'rate', val)}
                                            style={{ width: '100px' }}
                                            precision={2}
                                        />
                                    )
                                },
                                {
                                    title: 'Amount (₹)',
                                    key: 'amount',
                                    width: 130,
                                    render: (_, record, index) => (
                                        <InputNumber
                                            size="small"
                                            value={record.amount}
                                            onChange={(val) => handleUpdatePurchaseItem(index, 'amount', val)}
                                            style={{ width: '110px' }}
                                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                            precision={2}
                                        />
                                    )
                                }
                            ]}
                            summary={() => (
                                <Table.Summary>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell colSpan={4}>
                                            <Text strong>Sub Total:</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell>
                                            <Text strong>{totalWeight}g</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell>
                                            <Text strong>₹{totalAmount}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                        <Divider />
                        <Row gutter={16}>
                            <Col span={8}>
                                <Text strong>CGST (1.5%) (₹): </Text>
                                <InputNumber
                                    size="small"
                                    value={cgst}
                                    onChange={setCgst}
                                    style={{ width: '100%' }}
                                    precision={2}
                                />
                            </Col>
                            <Col span={8}>
                                <Text strong>SGST (1.5%) (₹): </Text>
                                <InputNumber
                                    size="small"
                                    value={sgst}
                                    onChange={setSgst}
                                    style={{ width: '100%' }}
                                    precision={2}
                                />
                            </Col>
                            <Col span={8}>
                                <Text strong>Round Off (₹): </Text>
                                <InputNumber
                                    size="small"
                                    value={roundOff}
                                    onChange={setRoundOff}
                                    style={{ width: '100%' }}
                                    precision={2}
                                />
                            </Col>
                        </Row>
                        <div style={{ marginTop: 16, textAlign: 'right', paddingRight: '20px' }}>
                            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                Grand Total: ₹{(parseFloat(totalAmount) + parseFloat(cgst || 0) + parseFloat(sgst || 0) + parseFloat(roundOff || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Title>
                        </div>
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Text type="secondary">Total Products: {purchaseData.length}</Text>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Text strong>Linked Purchase IDs: </Text>
                        {purchaseData.map((id, index) => (
                            <Tag key={index} color="blue" style={{ margin: '4px' }}>
                                #{id}
                            </Tag>
                        ))}
                        <Divider />
                        <Text>Total Purchases: {purchaseData.length}</Text>
                    </div>
                )}
            </Modal>
        );
    };

    const fetchInitialData = async (page = 1, pageSize = 10) => {
        try {
            setIsTableLoading(true);
            const purchasesResponse = await getMeltingPurchase({
                page: page,
                limit: pageSize,
                search: purchaseFilters.search,
                metal: purchaseFilters.metal,
                // status: purchaseFilters.status
            });

            const purchasesWithMeltingStatus = (purchasesResponse.purchases || []).map(purchase => ({
                ...purchase,
                melting_status: purchase.melting_status || 0
            }));

            setPurchases(purchasesWithMeltingStatus);
            setFilteredPurchases(purchasesWithMeltingStatus);

            if (purchasesResponse.pagination) {
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: purchasesResponse.pagination.total
                }));
            }

        } catch (error) {
            message.error('Failed to load purchases data');
            console.error('Error loading purchases data:', error);
        } finally {
            setIsTableLoading(false);
        }
    };



    const handleModalTableChange = (newPagination, filters, sorter) => {
        const { current, pageSize } = newPagination;
        setModalPagination(prev => ({
            ...prev,
            current: current,
            pageSize: pageSize
        }));
    };

    const applyPurchaseFilters = async (page = 1, pageSize = pagination.pageSize) => {
        try {
            setIsTableLoading(true);
            const purchasesResponse = await getMeltingPurchase({
                page: page,
                limit: pageSize,
                search: purchaseFilters.search,
                metal: purchaseFilters.metal,
                status: purchaseFilters.status
            });

            setFilteredPurchases(purchasesResponse.purchases || []);

            if (purchasesResponse.pagination) {
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: purchasesResponse.pagination.total
                }));
            }

        } catch (error) {
            message.error('Failed to filter purchases');
            console.error('Error filtering purchases:', error);
        } finally {
            setIsTableLoading(false);
        }
    };

    useEffect(() => {
        applyPurchaseFilters(1);
    }, [purchaseFilters]);

    // Purchase selection functions
    const togglePurchaseSelection = (purchase) => {
        setSelectedPurchases(prev => {
            const isSelected = prev.some(p => p.id === purchase.id);
            if (isSelected) {
                return prev.filter(p => p.id !== purchase.id);
            } else {
                return [...prev, purchase];
            }
        });
    };

    const selectAllPurchases = () => {
        const availablePurchases = filteredPurchases.filter(p => p.melting_status === 0);
        setSelectedPurchases(availablePurchases);
    };

    const clearAllSelections = () => {
        setSelectedPurchases([]);
    };

    const getTotalSelectedWeight = () => {
        return selectedPurchases.reduce((total, purchase) => {
            const productWeight = purchase.products?.[0]?.gross_weight || 0;
            return total + parseFloat(productWeight);
        }, 0).toFixed(3);
    };

    const getTotalSelectedAmount = () => {
        return selectedPurchases.reduce((total, purchase) => {
            return total + parseFloat(purchase.total_amount || 0);
        }, 0).toFixed(2);
    };


    // Handle opening confirmation popup
    const handleSubmitAll = () => {
        if (selectedPurchases.length === 0) {
            message.warning('Please select at least one purchase to submit');
            return;
        }

        // Initialize all as selected in confirmation modal
        setConfirmationSelections(selectedPurchases.map(p => p.id));
        setIsConfirmationPopupVisible(true);
    };




    const startMeltingProcess = () => {
        if (filteredPurchases.filter(p => p.melting_status === 0).length === 0) {
            message.warning('No available purchases for melting');
            return;
        }
        setSelectedPurchases([]);
        setIsMeltingPopupVisible(true);
    };

    // Product Details Cell Component
    const ProductDetailsCell = ({ product }) => {
        const [details, setDetails] = useState({
            metalName: 'Loading...',
            productName: 'Loading...',
            subProductName: 'Loading...'
        });

        useEffect(() => {
            const fetchDetails = async () => {
                try {
                    const [metalRes, productRes] = await Promise.all([
                        getMetalById(product.metal),
                        getProductById(product.product)
                    ]);

                    setDetails({
                        metalName: metalRes?.metalname || 'N/A',
                        productName: productRes?.product_name || 'N/A',
                        subProductName: product.sub_product || 'N/A'
                    });
                } catch (error) {
                    console.error('Error fetching details:', error);
                    setDetails({
                        metalName: 'Error',
                        productName: 'Error',
                        subProductName: 'Error'
                    });
                }
            };

            if (product?.metal && product?.product) {
                fetchDetails();
            }
        }, [product]);

        return (
            <div>
                <div><Text strong>{details.metalName}</Text></div>
                <div>{details.productName} - {details.subProductName}</div>
            </div>
        );
    };

    // Calculate totals for summary
    const getTotalWeight = () => {
        return meltProducts.reduce((total, product) => {
            return total + (parseFloat(product.weight) || 0);
        }, 0).toFixed(3);
    };

    const getTotalMeltWeight = () => {
        return meltProducts.reduce((total, product) => {
            return total + (parseFloat(product.melt_weight) || 0);
        }, 0).toFixed(3);
    };

    const getTotalDustWeight = () => {
        return meltProducts.reduce((total, product) => {
            return total + (parseFloat(product.dust_weight) || 0);
        }, 0).toFixed(3);
    };

    const getTotalNetWeight = () => {
        return Object.values(calculations).reduce((total, calc) => {
            return total + (calc.netWeight || 0);
        }, 0).toFixed(3);
    };

    const getTotalFinalWeight = () => {
        return Object.values(calculations).reduce((total, calc) => {
            return total + (calc.finalWeight || 0);
        }, 0).toFixed(3);
    };

    const getTotalAmount = () => {
        return Object.values(calculations).reduce((total, calc) => {
            return total + (calc.amount || 0);
        }, 0).toFixed(2);
    };



    // Add these helper functions at the top of your component, after state declarations
    const getMetalNameById = (metalId) => {
        console.log(typeof metalId)
        const metal = metalOptions.find(m => m.id === Number(metalId));
        return metal?.name || 'N/A';
    };

    const getProductNameById = (productId) => {
        const product = productOptions.find(p => p.id === Number(productId));
        return product?.name || 'N/A';
    };

    const getSubProductNameById = (subProductId) => {
        // Flatten all subProductOptions and find the matching one
        const allSubProducts = Object.values(subProductOptions).flat();
        const subProduct = allSubProducts.find(sp => sp.id === subProductId);
        return subProduct?.name || 'N/A';
    };

    // Updated meltProductColumns with automatic name resolution
    // Updated meltProductColumns with calculated amount
    const meltProductColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (text) => <Tag color="blue">#AMAMELT{text}</Tag>
        },
        {
            title: 'Metal',
            dataIndex: 'metal',
            key: 'metal',
            width: 120,
            render: (text, record) => (
                record.status === 0 ? (
                    <Select
                        placeholder="Select Metal"
                        style={{ width: '100%' }}
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'metal', value)}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {metalOptions.map(metal => (
                            <Option key={metal.id} value={metal.id}>
                                {metal.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    <Text>{getMetalNameById(text)}</Text>
                )
            )
        },
        {
            title: 'Product',
            dataIndex: 'product',
            key: 'product',
            width: 120,
            render: (text, record) => (
                record.status === 0 ? (
                    <Select
                        placeholder="Select Product"
                        style={{ width: '100%' }}
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'product', value)}
                        disabled={!record.metal}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {productOptions
                            .filter(product => product.metalId === record.metal)
                            .map(product => (
                                <Option key={product.id} value={product.id}>
                                    {product.name}
                                </Option>
                            ))
                        }
                    </Select>
                ) : (
                    <Text>{getProductNameById(text)}</Text>
                )
            )
        },
        {
            title: 'Weight (g)',
            dataIndex: 'weight',
            key: 'weight',
            width: 120,
            render: (text) => <Text strong>{text || '0.000'}g</Text>
        },
        {
            title: 'Melt Weight (g)',
            dataIndex: 'melt_weight',
            key: 'melt_weight',
            width: 150,
            render: (text, record) => (
                record.status === 0 ? (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter melt weight"
                        value={text}
                        onChange={(value) => handleMeltProductUpdate(record.id, 'melt_weight', value)}
                        min={0}
                        step={0.001}
                        precision={3}
                    />
                ) : (
                    <Text>{text || '0.000'}g</Text>
                )
            )
        },
        // Calculation Columns
        {
            title: 'Net Weight (g)',
            key: 'net_weight',
            width: 120,
            render: (_, record) => (
                <Text strong>{(calculations[record.id]?.netWeight || 0).toFixed(3)}g</Text>
            )
        },
        {
            title: 'Margin Weight (g)',
            key: 'margin_weight',
            width: 120,
            render: (_, record) => (
                <Text type="secondary">{(calculations[record.id]?.marginWeight || 0).toFixed(3)}g</Text>
            )
        },
        {
            title: 'Final Weight (g)',
            key: 'final_weight',
            width: 120,
            render: (_, record) => (
                <Text strong style={{ color: "#52c41a" }}>
                    {(calculations[record.id]?.finalWeight || 0).toFixed(3)}g
                </Text>
            )
        },
        // NEW: Calculated Amount Column
        {
            title: 'Calculated Amount (₹)',
            key: 'calculated_amount',
            width: 150,
            render: (_, record) => {
                let baseAmount = calculations[record.id]?.amount || 0;
                let displayAmount = baseAmount.toFixed(2);
                let isFinalTotal = false;

                // 1. Check root total_amount
                if (record.total_amount && parseFloat(record.total_amount) > 0) {
                    displayAmount = parseFloat(record.total_amount).toFixed(2);
                    isFinalTotal = true;
                }
                // 2. Check payment_details
                else if (record.payment_details) {
                    try {
                        const details = typeof record.payment_details === 'string'
                            ? JSON.parse(record.payment_details)
                            : record.payment_details;
                        if (details.total_amount) {
                            displayAmount = parseFloat(details.total_amount).toFixed(2);
                            isFinalTotal = true;
                        } else if (details.round_off_amount) {
                            displayAmount = (baseAmount + parseFloat(details.round_off_amount)).toFixed(2);
                            isFinalTotal = true;
                        }
                    } catch (e) { }
                }

                // 3. Last fallback: Check root round_off_amount
                if (!isFinalTotal && record.round_off_amount) {
                    displayAmount = (baseAmount + parseFloat(record.round_off_amount)).toFixed(2);
                    isFinalTotal = true;
                }

                return (
                    <div>
                        <Text strong style={{ color: '#3f8600', fontSize: '14px' }}>
                            ₹{displayAmount}
                        </Text>
                        {!isFinalTotal && (
                            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                                @ ₹{liveGoldRate.toFixed(2)}/g
                            </div>
                        )}
                        {isFinalTotal && (
                            <div style={{ fontSize: '10px', color: '#1890ff' }}>
                                (Final Total)
                            </div>
                        )}
                    </div>
                );
            }
        },


        {
            title: 'Assigned To',
            dataIndex: 'assign_customer_name',
            key: 'assign_customer_name',
            width: 100,
            render: (assign_customer_name) => (
                <Tag >
                    {assign_customer_name}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'assign_customer',
            key: 'assign_customer',
            width: 100,
            render: (assign_customer) => (
                <Tag color={assign_customer > 0 ? 'green' : 'orange'}>
                    {assign_customer > 0 ? 'Assigned' : 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleViewPurchaseDetails(record)}
                        icon={<InfoCircleOutlined />}
                    >
                        Details
                    </Button>
                    {record.assign_customer > 0 && (
                        <>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => handleUpdatePayment(record)}
                                icon={<CheckCircleOutlined />}
                            >
                                Update Payment
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                icon={<FilePdfOutlined style={{ color: '#ff4d4f' }} />}
                                onClick={() => navigate(`/sales-receipt/${record.id}`)}
                            />
                        </>
                    )}

                    <Button
                        type="primary"
                        size="small"
                        disabled={record.assign_customer > 0}
                        onClick={() => handleAssignCustomer(record)}
                        style={{
                            background: record.assign_customer > 0 ? "#1890ff" : "#52c41a",
                            borderColor: record.assign_customer > 0 ? "#1890ff" : "#52c41a"
                        }}
                        icon={<UserOutlined />}
                    >
                        {record.assign_customer > 0 ? 'Assigned' : 'Assign Customer'}
                    </Button>
                </Space>
            )
        }
    ];


    // Add these handler functions
    const handleEditMeltProduct = (record) => {
        // Implement edit functionality
        message.info('Edit product functionality to be implemented');
    };

    const handleViewPaymentDetails = (record) => {
        // Implement view payment details functionality
        message.info('View payment details functionality to be implemented');
    };



    // Add this debug function
    const debugCalculations = () => {
        console.log('=== DEBUG CALCULATIONS ===');
        console.log('Live Gold Rate:', liveGoldRate);
        console.log('Melt Products Count:', meltProducts.length);
        console.log('Calculations Object:', calculations);

        if (meltProducts.length > 0) {
            meltProducts.forEach((product, index) => {
                const calc = calculations[product.id];
                console.log(`Product ${index + 1} (ID: ${product.id}):`);
                console.log('  - Weight:', product.weight);
                console.log('  - Melt Weight:', product.melt_weight);
                console.log('  - Dust Weight:', product.dust_weight);
                console.log('  - Purity:', product.purity);
                console.log('  - Final Weight from calc:', calc?.finalWeight);
                console.log('  - Calculated Amount:', calc?.amount);
                console.log('  - Live Gold Rate used:', calc?.rate);
            });
        }
    };

    // Call this in your useEffect
    // Add this useEffect to handle gold rate changes
    useEffect(() => {
        // Update the ref whenever liveGoldRate changes
        liveGoldRateRef.current = liveGoldRate;

        // Recalculate if we have products and a valid gold rate
        if (liveGoldRate > 0 && meltProducts.length > 0) {
            console.log('Gold rate changed, recalculating...', liveGoldRate);
            const updatedCalculations = {};
            meltProducts.forEach(product => {
                updatedCalculations[product.id] = calculateProductValues(product);
            });
            setCalculations(updatedCalculations);
        }
    }, [liveGoldRate]);

    return (
        <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
            {/* Header with Create Button */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                    <Col span={12}>
                        <Title level={3} style={{ margin: 0 }}>Sales</Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                            Live Gold Rate: <Text strong style={{ color: '#52c41a' }}>₹{liveGoldRate.toFixed(2)}/g (24K)</Text>
                            {liveGoldRate === 0 && (
                                <Text type="warning" style={{ marginLeft: 8 }}>
                                    (Loading...)
                                </Text>
                            )}
                        </Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Space size="middle">
                            <Select
                                showSearch
                                placeholder={
                                    <span>
                                        <SearchOutlined style={{ marginRight: 6, color: '#bfbfbf' }} />
                                        Select product type
                                    </span>
                                }
                                value={purchaseFilters.productType || undefined}
                                onChange={(value) => setPurchaseFilters({ ...purchaseFilters, productType: value })}
                                allowClear
                                style={{
                                    width: 200,
                                    borderRadius: 8,
                                    textAlign: 'left'
                                }}
                                filterOption={(input, option) =>
                                    option?.children?.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                <Option value="22k">22k</Option>
                                <Option value="24K">24K</Option>
                                <Option value="old ornaments">old ornaments</Option>
                            </Select>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefreshGoldRate}
                                loading={loading}
                            >
                                Refresh Gold Rate
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>
            {/* Purchase Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search purchases..."
                            prefix={<SearchOutlined />}
                            value={purchaseFilters.search}
                            onChange={(e) => setPurchaseFilters({ ...purchaseFilters, search: e.target.value })}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            placeholder="Filter by Metal"
                            value={purchaseFilters.metal}
                            onChange={(value) => setPurchaseFilters({ ...purchaseFilters, metal: value })}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {metals.map(metal => (
                                <Option key={metal.id} value={metal.id}>{metal.metalname}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            placeholder="Melting Status"
                            value={purchaseFilters.status}
                            onChange={(value) => setPurchaseFilters({ ...purchaseFilters, status: value })}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="1">Melted</Option>
                            <Option value="0">Not Melted</Option>
                        </Select>
                    </Col>

                    <Col xs={24} sm={24} md={4}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                setPurchaseFilters({ search: '', metal: '', status: '' });
                                setDateRange([]);
                                fetchMeltProducts(1, meltPagination.pageSize);
                            }}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Main Melt Product Table */}
            <Card>
                <Table
                    columns={meltProductColumns}
                    dataSource={filteredMeltProducts}
                    pagination={{
                        current: meltPagination.current,
                        pageSize: meltPagination.pageSize,
                        total: meltPagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                    onChange={handleMeltTableChange}
                    scroll={{ x: 1500 }}
                    rowKey="id"
                    loading={isMeltTableLoading}
                />
            </Card>
            <PurchaseDetailsModal
                purchasesJson={selectedPurchasesJson}
                visible={purchaseDetailsVisible}
                onCancel={handleClosePurchaseDetails}
                record={selectedMeltRecord}
            />
            <PaymentModal />
            <CustomerAssignmentModal />
            <UpdatePaymentModal />
            <CreatePaymentModal />
        </div>
    );
};

export default Sales;