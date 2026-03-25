import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Table,
  Space,
  Popconfirm,
  message,
  Modal,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Upload,
  Avatar,
  Descriptions,
  Divider,
  InputNumber,
  Image,
  Badge,
  Statistic,
  Spin,
  Alert,
  Tabs, DatePicker
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
  CameraOutlined,
  FilePdfOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import Webcam from "react-webcam";
import logo from '../../assets/logo.jpg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  createQuotation,
  getPledgeQuotations,
  getAllFinalQuotations,
  getPledgeQuotationById,
  updateQuotation,
  deleteQuotation,
  generateQuotationPDF,
  getMCXRates,
  requestMarginApproval,
  approveMarginChange,
  rejectMarginChange,
  getPendingApprovals,
  getApprovalHistory,
  getPledgeFinalQuotationById,
} from '../../api/services/pledgeQuotationService';
import { getCustomerById, getCustomers } from '../../api/services/customerServices';
import { getMetals } from '../../api/services/metalService';
import { getProducts, getProductById } from '../../api/services/productService';
import { getSubProducts } from '../../api/services/subProductServices';
import { uploadConfigUrl } from '../../api/apiUrl';
import api from '../../api/apiConfig/apiClient';
import autoTable from 'jspdf-autotable';
import { getMarginSettingsByRoleId } from '../../api/services/marginSettingsService';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;



const referenceOptions = [
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'sales_executive', label: 'Sales Executive' },
  { value: 'manager', label: 'Manager' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' }
];

const approvalStatusColors = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red'
};

const PledgeQuotation = () => {
  const { RangePicker } = DatePicker;
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fileListBill, setFileListBill] = useState([]);
  const [fileListOrnament, setFileListOrnament] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quotationFilters, setQuotationFilters] = useState({
    search: '',
    metal: '',
    status: '',
    dateRange: []
  });
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const webcamRef = useRef(null);
  const [filters, setFilters] = useState({
    search: '',
    state: ''
  });
  const [metalOptions, setMetalOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [subProductOptions, setSubProductOptions] = useState({});
  const [mcxRates, setMcxRates] = useState({});
  const [liveGoldRate, setLiveGoldRate] = useState(0.0);
  const [showOtherReference, setShowOtherReference] = useState(false);
  const [showReferencePerson, setShowReferencePerson] = useState(false);
  const [productFields, setProductFields] = useState([{ id: 1 }]);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalHistoryModalVisible, setApprovalHistoryModalVisible] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [currentApproval, setCurrentApproval] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewQuotationModalVisible, setViewQuotationModalVisible] = useState(false);
  const [viewQuotationData, setViewQuotationData] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const handleTableChange = (newPagination, filters, sorter) => {
    // Keep current filters when changing page
    fetchQuotations(newPagination.current, newPagination.pageSize);
  };

  const [dateRange, setDateRange] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userRoleId');

  // Role-based margin percentage settings
  // const getMarginPercentage = () => {
  //   switch (userRole) {
  //     case 'superadmin': return { min: 0.5, max: 200, defaultValue: 0.5 };
  //     case 'office exe': return { min: 5, max: 7, defaultValue: 5 };
  //     case 'general': return { min: 4, max: 5, defaultValue: 4 };
  //     case 'Regional Manager': return { min: 3, max: 4, defaultValue: 3 };
  //     default: return { min: 0, max: 3, defaultValue: 3 };
  //   }
  // };

  const [minMarginValue, setMinMarginValue] = useState();
  const [maxMarginValue, setMaxMarginValue] = useState();

  const getMarginPercentage = async () => {
    try {
      const response = await getMarginSettingsByRoleId(userId);

      const min = Number(response?.data?.[0]?.min_percent ?? 0);
      const max = Number(response?.data?.[0]?.max_percent ?? 10);

      setMinMarginValue(min);
      setMaxMarginValue(max);

      form.setFieldsValue({
        margin_percent1: max
      });

    } catch (err) {
      console.log("Failed to fetch margin settings", err);
    }
  }


  const canApproveMargin = ['superadmin', 'office exe', 'general', 'Regional Manager'].includes(userRole);

  useEffect(() => {
    fetchInitialData();
    getMarginPercentage();
  }, []);

  useEffect(() => {
    applyCustomerFilters();
  }, [filters, customers]);

  useEffect(() => {
    applyQuotationFilters();
  }, [quotationFilters, quotations]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCustomers(),
        fetchQuotations(),
        fetchMetalOptions(),
        fetchProductOptions(),
        fetchMCXRates(),
        canApproveMargin ? fetchPendingApprovals() : Promise.resolve()
      ]);
    } catch (error) {
      message.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetalOptions = async () => {
    try {
      const response = await getMetals();
      setMetalOptions(response.metals.map(metal => ({
        id: metal.id,
        name: metal.metalname,
        code: metal.metal_code
      })));
    } catch (error) {
      message.error('Failed to fetch metal options');
    }
  };

  const fetchProductOptions = async () => {
    try {
      const response = await getProducts(1, 1000);
      setProductOptions(response.products.map(product => ({
        id: product.id,
        name: product.product_name,
        code: product.product_code,
        metalId: product.metal_id
      })));
    } catch (error) {
      message.error('Failed to fetch product options');
    }
  };

  const fetchSubProductOptions = async (productId) => {
    console.log(productId)
    try {
      const response = await getSubProducts(1, 1000);
      const subs = response.subProducts.filter(sub => sub.product_id === productId);
      setSubProductOptions(prev => ({
        ...prev,
        [productId]: subs
      }));
      return subs;
    } catch (error) {
      message.error('Failed to fetch sub product options');
      return [];
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to first page when filters change
      fetchQuotations(1, pagination.pageSize, {
        search: quotationFilters.search,
        metal: quotationFilters.metal,
        status: quotationFilters.status,
      });
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [quotationFilters.search, quotationFilters.metal, quotationFilters.status, dateRange]);
  const exportQuotationsToPDF = async () => {
    try {
      setExportLoading(true);

      // Prepare parameters for export (get all data)
      const params = {
        page: 1,
        limit: 100000, // Get all data
      };

      // Add search filters
      if (quotationFilters.search.trim()) {
        params.search = quotationFilters.search.trim();
      }

      if (quotationFilters.metal) {
        params.metal = quotationFilters.metal;
      }

      if (quotationFilters.status) {
        params.status = quotationFilters.status;
      }

      // Add date range if selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Exporting quotations with params:', params);

      const response = await getAllFinalQuotations(params);
      const exportData = response.data?.quotations || response.quotations || [];

      if (exportData.length === 0) {
        message.warning('No data found for the selected filters');
        setExportLoading(false);
        return;
      }

      // Create PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, 297, 25, 'F');

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('PLEDGE QUOTATIONS REPORT', 148.5, 12, { align: 'center' });

      // Date range info
      let dateRangeText = '';
      if (dateRange && dateRange[0] && dateRange[1]) {
        dateRangeText = `Date Range: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}`;
      } else {
        dateRangeText = 'All Dates';
      }

      doc.setFontSize(9);
      doc.text(dateRangeText, 148.5, 18, { align: 'center' });

      // Filter info
      let filterInfo = '';
      if (quotationFilters.search) filterInfo += `Search: ${quotationFilters.search} | `;
      if (quotationFilters.metal) filterInfo += `Metal: ${quotationFilters.metal} | `;
      if (quotationFilters.status) filterInfo += `Status: ${quotationFilters.status}`;

      if (filterInfo) {
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.text(filterInfo, 148.5, 22, { align: 'center' });
      }

      // Table columns
      const tableColumn = [
        'Quotation ID',
        'Pledge ID',
        'Date',
        'Customer Name',
        'Customer ID',
        'Products Count',
        'Total Amount (Rs.)',
        'Finance Amount (Rs.)',
        'Status',
        'Margin %'
      ];

      const tableRows = [];
      let totalAmount = 0;
      let totalQuotations = exportData.length;
      let activeQuotations = 0;
      let totalFinanceAmount = 0;

      exportData.forEach((quotation) => {
        // Parse products
        let productsData = quotation.products;
        if (typeof productsData === 'string') {
          try {
            productsData = JSON.parse(productsData);
          } catch (e) {
            productsData = [];
          }
        }

        const amount = parseFloat(quotation.total_amount) || 0;
        const financeAmount = parseFloat(quotation.pledge_data?.accounts_amount) || 0;

        totalAmount += amount;
        totalFinanceAmount += financeAmount;

        if (quotation.status === 'active') activeQuotations++;

        const productsCount = Array.isArray(productsData) ? productsData.length : 0;

        const quotationData = [
          quotation.quotation_id || 'N/A',
          `#PLED00${quotation.pledge_id || 'N/A'}`,
          new Date(quotation.created_at).toLocaleDateString('en-IN'),
          quotation.customer_name || 'N/A',
          quotation.customer_id || 'N/A',
          productsCount,
          `Rs.${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `Rs.${financeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          quotation.status === 'active' ? 'Active' : 'Expired',
          `${quotation.margin_percent || '0'}%`
        ];

        tableRows.push(quotationData);
      });

      // Add table using autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: [40, 40, 40],
        },
        headStyles: {
          fillColor: [212, 175, 55],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          lineWidth: 0.1,
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 },
          6: { cellWidth: 25 },
          7: { cellWidth: 25 },
          8: { cellWidth: 15 },
          9: { cellWidth: 15 },
        },
        margin: { top: 30, right: 10, bottom: 20, left: 10 },
        tableWidth: 'wrap',
        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });

      const finalY = doc.lastAutoTable.finalY + 15;

      // Summary section
      doc.setFillColor(245, 245, 245);
      doc.rect(10, finalY, 277, 30, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, finalY, 277, 30, 'S');

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('SUMMARY', 20, finalY + 8);
      doc.setFont(undefined, 'normal');

      const col1 = 20;
      const col2 = 80;
      const col3 = 140;
      const col4 = 200;

      doc.text(`Total Quotations: ${totalQuotations}`, col1, finalY + 15);
      doc.text(`Active: ${activeQuotations}`, col1, finalY + 22);
      doc.text(`Expired: ${totalQuotations - activeQuotations}`, col2, finalY + 15);
      doc.text(`Total Amount: Rs.${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col3, finalY + 15);
      doc.text(`Total Finance: Rs.${totalFinanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col3, finalY + 22);
      doc.text(`Average Amount: Rs.${totalQuotations > 0 ? (totalAmount / totalQuotations).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`, col4, finalY + 15);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const footerY = doc.internal.pageSize.height - 15;
      doc.text('Generated by: Pledge Quotation Management System', 10, footerY);
      doc.text(`Records: ${totalQuotations}`, 270, footerY, { align: 'right' });
      doc.text(new Date().toLocaleString(), 148.5, footerY, { align: 'center' });

      // Save PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `Pledge-Quotations-Report-${timestamp}.pdf`;
      doc.save(fileName);

      message.success(`PDF exported successfully! (${totalQuotations} records)`);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const fetchMCXRates = async () => {
    try {
      setLoading(true);
      const response = await getMCXRates();

      if (Array.isArray(response) && response.length > 0) {
        const goldRate = response[0].rate || 0;
        setLiveGoldRate(goldRate);

        const rates = {};
        response.forEach(item => {
          rates[item.metal] = item.rate;
        });

        setMcxRates(rates);
        message.success("MCX rates updated successfully!");

        // Also update form fields with new rates
        const currentProducts = form.getFieldValue('products') || [];
        if (currentProducts.length > 0) {
          const updatedProducts = currentProducts.map(product => {
            const metalId = product.metal;
            if (metalId) {
              const metal = metalOptions.find(m => m.id === metalId);
              if (metal && rates[metal.code]) {
                return {
                  ...product,
                  mcx_rate: rates[metal.code]
                };
              }
            }
            return product;
          });

          form.setFieldsValue({ products: updatedProducts });
        }
      } else {
        message.error("No rate data available");
        setLiveGoldRate(0);
        setMcxRates({});
      }
    } catch (error) {
      console.error("Error fetching MCX rates:", error);
      message.error("Failed to fetch MCX rates");
      setLiveGoldRate(0);
      setMcxRates({});
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getPledgeQuotations();
      setCustomers(response.quotations);
      setFilteredCustomers(response.quotations);
    } catch (error) {
      message.error('Failed to fetch customers');
    }
  };
  const fetchQuotations = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
      };

      // Add search filters
      if (quotationFilters.search.trim()) {
        params.search = quotationFilters.search.trim();
      }

      if (quotationFilters.metal) {
        params.metal = quotationFilters.metal;
      }

      if (quotationFilters.status) {
        params.status = quotationFilters.status;
      }

      // Add date range if selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Fetching quotations with params:', params);

      const response = await getAllFinalQuotations(params);
      const quotationsData = response.data?.quotations || response.quotations || [];
      const paginationData = response.data?.pagination || response.pagination || {};

      setQuotations(quotationsData);
      setFilteredQuotations(quotationsData);

      // Update pagination state
      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || pageSize,
        total: paginationData.total || 0,
      });

    } catch (error) {
      console.error('Error fetching quotations:', error);
      message.error('Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  }, [quotationFilters.search, quotationFilters.metal, quotationFilters.status, dateRange]);


  const fetchCustomerById = async (customerId) => {
    try {
      const response = await getCustomerById(customerId);
      return response.data;
    } catch (error) {
      message.error(`Failed to fetch customer with ID: ${customerId}`);
      return null;
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await getPendingApprovals();
      setPendingApprovals(response.data);
    } catch (error) {
      message.error('Failed to fetch pending approvals');
    }
  };

  const fetchApprovalHistory = async (quotationId) => {
    try {
      setLoading(true);
      const response = await getApprovalHistory(quotationId);
      setApprovalHistory(response.data);
      setApprovalHistoryModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch approval history');
    } finally {
      setLoading(false);
    }
  };

  const applyCustomerFilters = () => {
    let filtered = [...customers];
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.aadhar_no?.includes(searchTerm) ||
        item.pan_no?.includes(searchTerm)
      )
    }
    if (filters.state) {
      filtered = filtered.filter(item =>
        item.state?.toLowerCase() === filters.state.toLowerCase()
      );
    }
    setFilteredCustomers(filtered);
  };

  const applyQuotationFilters = () => {
    let filtered = [...quotations];
    if (quotationFilters.search) {
      const searchTerm = quotationFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.quotation_id?.toLowerCase().includes(searchTerm)
      );
    }
    if (quotationFilters.metal) {
      filtered = filtered.filter(item =>
        item.metal?.toLowerCase() === quotationFilters.metal.toLowerCase()
      );
    }
    if (quotationFilters.status) {
      filtered = filtered.filter(item =>
        item.status?.toLowerCase() === quotationFilters.status.toLowerCase()
      );
    }
    if (quotationFilters.dateRange && quotationFilters.dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const quotationDate = new Date(item.date);
        return quotationDate >= quotationFilters.dateRange[0] &&
          quotationDate <= quotationFilters.dateRange[1];
      });
    }
    setFilteredQuotations(filtered);
  };

  const handleCustomerSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleStateFilter = (value) => {
    setFilters(prev => ({ ...prev, state: value }));
  };

  const resetCustomerFilters = () => {
    setFilters({ search: '', state: '' });
  };

  const showCustomerModal = () => {
    setIsCustomerModalVisible(true);
  };

  const handleApproveMargin = async (approvalId) => {
    try {
      setLoading(true);
      await approveMarginChange(approvalId, userId, approvalNotes);
      message.success('Margin change approved successfully');
      fetchQuotations();
      fetchPendingApprovals();
      setApprovalModalVisible(false);
      setApprovalNotes('');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to approve margin change');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMargin = async (approvalId) => {
    try {
      setLoading(true);
      await rejectMarginChange(approvalId, userId, rejectionReason);
      message.success('Margin change rejected');
      fetchQuotations();
      fetchPendingApprovals();
      setApprovalModalVisible(false);
      setRejectionReason('');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject margin change');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileListBill([]);
    setFileListOrnament([]);
    setShowWebcam(false);
    setEditingQuotation(null);
    setCapturedImage('');
    setShowOtherReference(false);
    setShowReferencePerson(false);
    setProductFields([{ id: 1 }]);
  };

  const handleCustomerCancel = () => {
    setIsCustomerModalVisible(false);
  };
  const selectProductsId = async (id) => {
    const response = await getProductById(id);
    console.log(response)
    return response?.product_name ?? "N/A";
  };

  const selectCustomer = async (record) => {
    try {
      setLoading(true);
      const response = await getPledgeQuotationById(record.id);

      // Check the actual response structure
      console.log('API Response:', response);

      // The customer data might be in different places depending on the API response
      const customer = response.data || response.quotation || response;

      if (!customer) {
        message.error('Failed to load customer details');
        return;
      }

      setSelectedCustomer(customer);
      setIsCustomerModalVisible(false);
      setIsModalVisible(true);
      if (customer.pledge_data.bill) {
        setFileListBill([{
          uid: '-1',
          name: 'bill.jpg',
          status: 'done',
          url: `${uploadConfigUrl}/uploads/pledge_items/${customer.pledge_data.bill}`
        }]);
      } else {
        setFileListBill([]);
      }

      if (customer.pledge_data.ornament_photo) {
        setFileListOrnament([{
          uid: '-2',
          name: 'ornament.jpg',
          status: 'done',
          url: `${uploadConfigUrl}/uploads/pledge_items/${customer.pledge_data.ornament_photo}`
        }]);
        setCapturedImage('');
      } else {
        setFileListOrnament([]);
      }
      let products = [];
      let products2 = [];
      var count = 1;
      var count2 = 1;

      // Check if customer.products exists and is an array
      if (customer.products && Array.isArray(customer.products)) {
        for (let i of customer.products) {
          const grossWeight = parseFloat(i.gross_weight) || 0;
          const dustWeight = parseFloat(i.dust_weight) || 0;
          const stoneWeight = parseFloat(i.stone_weight) || 0;
          const marginPercent = parseFloat(form.getFieldValue('margin_percent')) || 0;
          const purity = parseFloat(i.purity) || 100;
          const netWeight = parseFloat(grossWeight - dustWeight - stoneWeight).toFixed(3);
          const marginWeight = (netWeight * marginPercent) / 100;
          const finalWeight = parseFloat(netWeight * (purity / 100)).toFixed(3);
          const currentRate = parseFloat(i.mcx_rate) || 0;
          const rate = currentRate;

          const amount = finalWeight * rate;
          const obj = {
            id: count++,
            metal: i.metal,
            purity: i.purity,
            product: i.product,
            sub_product: i.sub_product,
            gross_weight: i.gross_weight,
            dust_weight: i.dust_weight,
            stone_weight: i.stone_weight,
            net_weight: netWeight,
            mcx_rate: i.mcx_rate,
            rate,
            margin_weight: marginWeight,
            final_weight: finalWeight,
            amount
          };

          products.push(obj);

          // Await the product name correctly
          const productName = await selectProductsId(i.product);

          const obj2 = {
            id: count2++,
            metal: i.metal,
            purity: i.purity,
            product: productName,
            sub_product: i.sub_product,
            gross_weight: 0,
            dust_weight: 0,
            stone_weight: 0,
            net_weight: 0,
            mcx_rate: liveGoldRate,
            rate: 0,
            margin_weight: 0,
            final_weight: 0,
            amount: 0
          };

          products2.push(obj2);
        }
        const totalAmount = products2.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        form.setFieldsValue({ total_amount: parseFloat(totalAmount.toFixed(2)) });
        const totalAmount1 = products.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        form.setFieldsValue({ total_amount1: parseFloat(totalAmount1.toFixed(2)) });
      } else {
        // If no products, add a default product
        products = [{
          id: 1,
          metal: '',
          purity: 100,
          product: '',
          sub_product: '',
          gross_weight: 0,
          dust_weight: 0,
          stone_weight: 0,
          net_weight: 0,
          mcx_rate: 0,
          rate: 0,
          margin_weight: 0,
          final_weight: 0,
          amount: 0
        }];
      }

      // Set product fields based on the number of products
      setProductFields(products2.map(p => ({ id: p.id })));

      form.setFieldsValue({
        customer_id: record.customer_id,
        pledge_id: record.pledge_id,
        purchase_id: record.purchase_id,
        quotation_id: record.quotation_id,
        customer_name: customer.customer_name,
        aadhar_no: customer.aadhar_no,
        pan_no: customer.pan_no !== "undefined" ? customer.pan_no : "",
        margin_percent1: customer.margin_percent || 0,
        finance_amt: customer.pledge_data.accounts_amount,
        products1: products,
        products: products2
      });
    } catch (error) {
      console.error('Error selecting customer:', error);
      message.error('Failed to select customer');
    } finally {
      setLoading(false);
    }
  };
  const clearSelection = () => {
    setSelectedCustomer(null);
    setIsModalVisible(false);
  };

  const handleUpload = (file, fileList, setFileList) => {
    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file),
      originFileObj: file
    };
    setFileList([newFile]);
    return false;
  };

  const handleRemove = (file, fileList, setFileList) => {
    const newFileList = fileList.filter(f => f.uid !== file.uid);
    setFileList(newFileList);
  };

  const handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleMetalChange = (value, fieldId) => {
    const metal = metalOptions.find(m => m.id === value);
    if (metal && mcxRates[metal.code]) {
      form.setFieldsValue({
        products: form.getFieldValue('products').map(p => {
          if (p.id === fieldId) {
            return { ...p, mcx_rate: mcxRates[metal.code] };
          }
          return p;
        })
      });
      calculateValues(fieldId);
    }
  };

  const handleProductChange = async (value, fieldId) => {
    const subs = await fetchSubProductOptions(value);
    form.setFieldsValue({
      products: form.getFieldValue('products').map(p => {
        if (p.id === fieldId) {
          return { ...p, sub_product: undefined };
        }
        return p;
      })
    });
  };

  const calculateValues = (fieldId) => {
    const products = form.getFieldValue('products');
    const productIndex = products.findIndex(p => p.id === fieldId);
    if (productIndex === -1) return;

    const product = products[productIndex];
    const grossWeight = parseFloat(product.gross_weight) || 0;
    const dustWeight = parseFloat(product.dust_weight) || 0;
    const stoneWeight = parseFloat(product.stone_weight) || 0;
    const marginPercent = parseFloat(form.getFieldValue('margin_percent')) || 0;
    const purity = parseFloat(product.purity) || 100;

    // Get current rate - use form value if available, otherwise use live rate
    let currentRate = parseFloat(product.mcx_rate) || 0;
    if (currentRate === 0) {
      // If no specific rate in form, use live gold rate
      const metalId = product.metal;
      if (metalId) {
        const metal = metalOptions.find(m => m.id === metalId);
        if (metal && mcxRates[metal.code]) {
          currentRate = mcxRates[metal.code];
        } else {
          currentRate = liveGoldRate;
        }
      } else {
        currentRate = liveGoldRate;
      }
    }

    // ✅ Step 1: Net weight after dust & stone
    const netWeight = grossWeight - dustWeight - stoneWeight;

    // ✅ Step 2: Margin deduction
    const marginWeight = (netWeight * marginPercent) / 100;

    // ✅ Step 3: Final weight after margin
    // const finalWeight = netWeight - marginWeight;
    const finalWeight = (grossWeight - dustWeight - stoneWeight) * (purity / 100);

    // ✅ Step 4: Adjusted rate based on purity
    const rate = currentRate;

    // ✅ Step 5: Amount
    const amount = finalWeight * rate;

    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      net_weight: parseFloat(netWeight.toFixed(3)),
      margin_weight: parseFloat(marginWeight.toFixed(3)),
      final_weight: parseFloat(finalWeight.toFixed(3)),
      rate: parseFloat(rate.toFixed(2)),
      amount: parseFloat(amount.toFixed(2)),
      mcx_rate: parseFloat(currentRate.toFixed(2)) // store the actual rate used
    };

    form.setFieldsValue({ products: updatedProducts });

    // ✅ Total amount
    const totalAmount = updatedProducts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const finalAmount = totalAmount - (totalAmount * marginPercent / 100);

    form.setFieldsValue({ total_amount: parseFloat(finalAmount.toFixed(2)) });
  };

  useEffect(() => {
    if (isModalVisible) {
      fetchMCXRates();
    }
  }, [isModalVisible]);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setFileListOrnament([{
      uid: '-1',
      name: 'ornament.jpg',
      status: 'done',
      url: imageSrc
    }]);
    setShowWebcam(false);
  };

  const handleReferenceChange = (value) => {
    setShowOtherReference(value === 'other');
    setShowReferencePerson(value === 'sales_executive' || value === 'manager');
    form.setFieldsValue({
      reference_person: undefined,
      other_reference: undefined
    });
  };
  const handleResetFilters = () => {
    // Reset quotation filters
    setQuotationFilters({
      search: '',
      metal: '',
      status: '',
    });

    // Reset date range
    setDateRange([]);

    // Reset pagination to first page
    setPagination({
      current: 1,
      pageSize: pagination.pageSize, // Keep the same page size
      total: pagination.total, // Keep total (will be updated on fetch)
    });

    // Fetch quotations with default parameters
    fetchQuotations(1, pagination.pageSize);

    message.success('Filters have been reset');
  };

  const addProductField = () => {
    const newId = productFields.length > 0 ? Math.max(...productFields.map(f => f.id)) + 1 : 1;
    setProductFields([...productFields, { id: newId }]);

    const currentProducts = form.getFieldValue('products') || [];
    form.setFieldsValue({
      products: [
        ...currentProducts,
        {
          id: newId,
          metal: '',
          purity: 100,
          product: '',
          sub_product: '',
          gross_weight: 0,
          dust_weight: 0,
          stone_weight: 0,
          net_weight: 0,
          mcx_rate: 0,
          rate: 0,
          margin_weight: 0,
          final_weight: 0,
          amount: 0
        }
      ]
    });
  };

  const removeProductField = (id) => {
    if (productFields.length <= 1) {
      message.warning('At least one product is required');
      return;
    }

    setProductFields(productFields.filter(field => field.id !== id));
    const currentProducts = form.getFieldValue('products') || [];
    form.setFieldsValue({
      products: currentProducts.filter(p => p.id !== id)
    });

    const updatedProducts = currentProducts.filter(p => p.id !== id);
    const totalAmount = updatedProducts.reduce((sum, p) => sum + (p.amount || 0), 0);
    form.setFieldsValue({ total_amount: parseFloat(totalAmount.toFixed(2)) });
  };

  const handleRequestApproval = async () => {
    try {
      const values = await form.validateFields();
      const currentMargin = values.margin_percent;

      // Create a form ref to manage the modal form
      const modalFormRef = React.createRef();

      Modal.confirm({
        title: 'Request Margin Approval',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>You are requesting to change the margin percentage from {currentMargin}% to a lower value.</p>
            <Form ref={modalFormRef}>
              <Form.Item
                name="new_margin"
                label="New Margin Percentage"
                rules={[
                  { required: true, message: 'Please input new margin percentage!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value < currentMargin) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('New margin must be lower than current margin'));
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0.1}
                  max={currentMargin - 0.1}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="reason"
                label="Reason for Request"
                rules={[{ required: true, message: 'Please provide a reason!' }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>
          </div>
        ),
        okText: 'Submit Request',
        cancelText: 'Cancel',
        onOk: () => {
          return new Promise((resolve, reject) => {
            modalFormRef.current?.validateFields()
              .then(values => {
                setLoading(true);
                return requestMarginApproval(editingQuotation.id, userId, {
                  old_margin: currentMargin,
                  new_margin: values.new_margin,
                  reason: values.reason
                });
              })
              .then(() => {
                message.success('Margin approval request submitted successfully');
                fetchQuotations();
                handleCancel();
                if (canApproveMargin) {
                  fetchPendingApprovals();
                }
                resolve();
              })
              .catch(error => {
                if (error.message) {
                  // This is a form validation error
                  message.error(error.message);
                } else {
                  // This is an API error
                  message.error(error.response?.data?.message || 'Failed to submit approval request');
                }
                reject();
              })
              .finally(() => {
                setLoading(false);
              });
          });
        }
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };
  const generatePurchaseId = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PUR${timestamp}${random}`;
  };
  const handleFinalSubmit = async (values) => {

    try {
      setLoading(true);

      const formData = new FormData();



      // Get user info from localStorage
      const userId = localStorage.getItem('userRoleId');
      const financialId = localStorage.getItem('financial_id'); // Adjust based on your storage

      // Create updated values with all required fields
      const updatedValues = {
        ...values,
        pledge_id: values.pledge_id,
        purchase_id: values.purchase_id,
        quotation_id: values.quotation_id,
        status: 'active', // Add default status
        margin_percent: values.margin_percent, // Default to 3% if not provided
        created_by: userId,
        updated_by: userId,
        financial_id: financialId || 1, // Default to 1 if not available
      };


      // Add all fields to formData
      Object.keys(updatedValues).forEach(key => {
        if (key !== 'products' && updatedValues[key] !== undefined && updatedValues[key] !== null) {
          // Convert to string if it's not a file
          if (typeof updatedValues[key] !== 'object' || updatedValues[key] instanceof File) {
            formData.append(key, updatedValues[key]);
          } else {
            formData.append(key, String(updatedValues[key]));
          }
        }
      });

      if (updatedValues.products) {
        formData.append('products', JSON.stringify(updatedValues.products));
      }

      if (fileListBill.length > 0 && fileListBill[0].originFileObj) {
        formData.append('bill_copy', fileListBill[0].originFileObj);
      }

      if (capturedImage) {
        const blob = await fetch(capturedImage).then(res => res.blob());
        formData.append('ornament_photo', blob, 'ornament.jpg');
      } else if (fileListOrnament.length > 0 && fileListOrnament[0].originFileObj) {
        formData.append('ornament_photo', fileListOrnament[0].originFileObj);
      }


      let response;
      if (editingQuotation !== null) {
        response = await updateQuotation(editingQuotation.id, formData);
        message.success('Quotation updated successfully!');
      } else {
        response = await createQuotation(values.customer_id, formData);
        message.success('Quotation generated successfully!');
      }

      fetchQuotations();
      handleCancel();
    } catch (error) {
      console.error('Error saving quotation:', error);
      message.error(error.response?.data?.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = (fileList, setFileList) => ({
    onRemove: (file) => handleRemove(file, fileList, setFileList),
    beforeUpload: (file) => handleUpload(file, fileList, setFileList),
    fileList,
    listType: "picture-card",
    onPreview: handlePreview,
    accept: "image/*",
    maxCount: 1
  });

  const handleEditQuotation = async (record) => {
    try {
      setLoading(true);
      const response = await getPledgeFinalQuotationById(record.id);
      const quotation = response.quotation || response;

      let customer = customers.find(c => c.customer_id === quotation.customer_id);
      if (!customer) {
        customer = await fetchCustomerById(quotation.customer_id);
        if (!customer) {
          message.error('Customer not found in database');
          return;
        }
        setCustomers(prev => [...prev, customer]);
      }

      setSelectedCustomer(customer);
      setEditingQuotation(record);
      setIsModalVisible(true);

      let productsData = quotation.products;
      if (typeof productsData === 'string') {
        try {
          productsData = JSON.parse(productsData);
        } catch (e) {
          console.error('Error parsing products:', e);
          productsData = [];
        }
      }

      if (productsData && productsData.length > 0) {
        const fields = productsData.map((p, index) => ({ id: index + 1 }));

        setProductFields(fields);
      } else {
        setProductFields([{ id: 1 }]);
      }

      const formValues = {
        ...quotation,
        customer_id: quotation.customer_id,
        customer_name: quotation.customer_name,
        products: productsData || [{
          id: 1,
          metal: '',
          purity: 100,
          product: '',
          sub_product: '',
          gross_weight: 0,
          dust_weight: 0,
          stone_weight: 0,
          net_weight: 0,
          mcx_rate: 0,
          rate: 0,
          margin_weight: 0,
          final_weight: 0,
          amount: 0
        }]
      };

      form.setFieldsValue(formValues);
      form.setFieldsValue({ total_amount: productsData.total_amount.toFixed(2) });

      const reference = quotation.reference;
      setShowOtherReference(reference === 'other');
      setShowReferencePerson(reference === 'sales_executive' || reference === 'manager');


      if (quotation.pledge_data.bill) {
        setFileListBill([{
          uid: '-1',
          name: 'bill.jpg',
          status: 'done',
          url: `${uploadConfigUrl}/uploads/pledge_items/${quotation.pledge_data.bill}`
        }]);
      } else {
        setFileListBill([]);
      }

      if (quotation.pledge_data.ornament_photo) {
        setFileListOrnament([{
          uid: '-2',
          name: 'ornament.jpg',
          status: 'done',
          url: `${uploadConfigUrl}/uploads/pledge_items/${quotation.pledge_data.ornament_photo}`
        }]);
        setCapturedImage('');
      } else {
        setFileListOrnament([]);
      }

    } catch (error) {
      console.error('Error fetching quotation:', error);
      message.error(error.message || 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuotation = async (id) => {
    try {
      setLoading(true);
      await deleteQuotation(id);
      message.success('Quotation deleted successfully');
      fetchQuotations();
    } catch (error) {
      message.error('Failed to delete quotation');
    } finally {
      setLoading(false);
    }
  };

  const resetQuotationFilters = () => {
    setQuotationFilters({
      search: '',
      metal: '',
      status: '',
      dateRange: []
    });
  };

  const handleGeneratePDF = async (record) => {
    try {
      setLoading(true);

      const response = await getPledgeFinalQuotationById(record.id);
      const quotation = response.quotation || response;

      // Parse products if they're stored as string
      let productsData = quotation.products;
      if (typeof productsData === 'string') {
        productsData = JSON.parse(productsData);
      }

      // Format date
      const formattedDate = new Date(quotation.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Create a temporary div to hold the HTML content
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '300px'; // 3 inches
      tempDiv.style.padding = '10px';
      tempDiv.style.fontFamily = 'Arial Narrow, Arial, sans-serif';
      tempDiv.style.fontSize = '9px';
      tempDiv.style.color = '#333';

      tempDiv.innerHTML = `
        <div class="company-header" style="text-align: center; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 2px dashed #d4af37;">
        <img style="width: 300px;height: 100px;" src=${logo}/>
          <div style="height: 40px; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center;">
            <strong style="font-size: 12px; color: #d4af37;">AMAYA GOLD POINT</strong>
          </div>
          <div style="font-size: 7px; margin: 2px 0; color: #666;">
            123 Jewel Street | +91 9876543210<br>
            SRIVILLIPUTTHUR,TamilNadu-626117.
          </div>
        </div>
  
        <div class="document-title" style="text-align: center; font-size: 11px; font-weight: bold; margin: 5px 0;">QUOTATION</div>
  
        <div class="section" style="margin: 8px 0;">
          <div class="section-title" style="font-weight: bold; font-size: 10px; border-bottom: 1px solid #d4af37; padding-bottom: 2px; margin-bottom: 4px;">QUOTATION DETAILS</div>
          <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Quotation #:</span> ${quotation.quotation_id || 'N/A'}</div>
          <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Date:</span> ${formattedDate}</div>
          <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Margin:</span> ${quotation.margin_percent || 0}%</div>
        </div>
  
        <div class="section" style="margin: 8px 0;">
          <div class="section-title" style="font-weight: bold; font-size: 10px; border-bottom: 1px solid #d4af37; padding-bottom: 2px; margin-bottom: 4px;">CUSTOMER DETAILS</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 8px;">
            <div>
              <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Name:</span> ${quotation.customer_name || 'N/A'}</div>
              <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Phone:</span> ${quotation.customer_phone || 'N/A'}</div>
            </div>
            <div>
              <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Aadhar:</span> ${quotation.aadhar_no || 'N/A'}</div>
              <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">PAN:</span> ${quotation.pan_no && quotation.pan_no !== "undefined" ? quotation.pan_no : 'N/A'}</div>
            </div>
          </div>
          <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Address:</span> ${quotation.customer_address || 'N/A'}</div>
        </div>
  
        <div class="section" style="margin: 8px 0;">
          <div class="section-title" style="font-weight: bold; font-size: 10px; border-bottom: 1px solid #d4af37; padding-bottom: 2px; margin-bottom: 4px;">PRODUCT DETAILS</div>
          <table style="width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 8px;">
            <thead>
              <tr>
                <th style="background-color: #f5f5f5; padding: 4px; text-align: left; font-weight: bold; border-bottom: 1px solid #ddd;">S.No</th>
                <th style="background-color: #f5f5f5; padding: 4px; text-align: left; font-weight: bold; border-bottom: 1px solid #ddd;">Item</th>
                <th style="background-color: #f5f5f5; padding: 4px; text-align: right; font-weight: bold; border-bottom: 1px solid #ddd;">Gross Weight(g)</th>
                <th style="background-color: #f5f5f5; padding: 4px; text-align: right; font-weight: bold; border-bottom: 1px solid #ddd;">Net Weight(g)</th>
                <th style="background-color: #f5f5f5; padding: 4px; text-align: right; font-weight: bold; border-bottom: 1px solid #ddd;">Rate</th>
                <th style="background-color: #f5f5f5; padding: 4px; text-align: right; font-weight: bold; border-bottom: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${productsData.map((product, index) => `
              <tr>
                <td style="padding: 4px; border-bottom: 1px solid #eee;">${index + 1}</td>
                <td style="padding: 4px; border-bottom: 1px solid #eee;">${product.sub_product || product.product || 'N/A'}</td>
                <td style="padding: 4px; border-bottom: 1px solid #eee; text-align: right;">${product.gross_weight || 0}</td>
                <td style="padding: 4px; border-bottom: 1px solid #eee; text-align: right;">${product.final_weight || 0}</td>
                <td style="padding: 4px; border-bottom: 1px solid #eee; text-align: right;">${product.rate || 0}</td>
                <td style="padding: 4px; border-bottom: 1px solid #eee; text-align: right;">Rs.${product.amount || 0}</td>
              </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f9f9f9;">
                <td colspan="5" style="padding: 4px; text-align: right;">TOTAL:</td>
                <td style="padding: 4px; text-align: right;">Rs.${quotation.total_amount || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>
  
        <div style="margin-top: 10px; font-size: 8px;">
          <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Prepared By:</span> ${quotation.prepared_by || localStorage.getItem('userName') || 'Staff'}</div>
          <div style="margin: 2px 0;"><span style="font-weight: bold; color: #d4af37;">Contact:</span> ${quotation.user_contact || localStorage.getItem('userContact') || 'N/A'}</div>
        </div>
  
        <div class="section" style="margin: 8px 0;">
          <div style="border-top: 1px solid #333; width: 60%; margin: 15px auto 5px;"></div>
          <div style="text-align: center;">Authorized Signature</div>
        </div>
  
        <div style="text-align: center; font-size: 7px; margin-top: 10px; padding-top: 5px; border-top: 1px dashed #d4af37; color: #666;">
          Thank you for your business!<br>
          AmayaGold Point.<br>
          Terms & Conditions Apply
        </div>
      `;

      // Append to body temporarily
      document.body.appendChild(tempDiv);

      // Convert to canvas then to PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Small receipt size
      });

      const imgWidth = 80;
      const pageHeight = 200;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`Quotation-${quotation.quotation_id || quotation.id}.pdf`);

      // Clean up
      document.body.removeChild(tempDiv);

      message.success('PDF downloaded successfully');

    } catch (error) {
      console.error('PDF generation error:', error);
      message.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };


  const showApprovalModal = (approval) => {
    setCurrentApproval(approval);
    setApprovalModalVisible(true);
  };

  const showApprovalHistory = (quotationId) => {
    fetchApprovalHistory(quotationId);
  };

  const handleViewQuotation = (record) => {
    try {
      let productsData = record.products;
      if (typeof productsData === 'string') {
        productsData = JSON.parse(productsData);
      }

      setViewQuotationData({
        ...record,
        products: productsData || []
      });
      setViewQuotationModalVisible(true);
    } catch (error) {
      console.error('Error parsing quotation data:', error);
      message.error('Failed to load quotation details');
    }
  };

  const quotationColumns = [
    {
      title: 'Quotation ID',
      dataIndex: 'quotation_id',
      key: 'quotation_id',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Pledge ID',
      dataIndex: 'pledge_id',
      key: 'pledge_id',
      width: 150,
      render: (text) => <Tag color="blue">#PLED00{text}</Tag>
    },
    // {
    //   title: 'Purchase ID',
    //   dataIndex: 'purchase_id',
    //   key: 'purchase_id',
    //   width: 150,
    //   render: (text) => <Tag color="blue">{text}</Tag>
    // },

    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (text) => text ? new Date(text).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text, record) => (
        <div>
          <div>{String(text || 'N/A')}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{String(record.customer_id || '')}</Text>
        </div>
      )
    },
    {
      title: 'Product Details',
      key: 'product_details',
      width: 200,
      render: (_, record) => {
        try {
          const products = record.products ? (typeof record.products === 'string' ? JSON.parse(record.products) : record.products) : [];
          if (!Array.isArray(products)) return <Text>No products</Text>;
          return (
            <div>
              {products.map((product, index) => (
                <div key={index} style={{ marginBottom: index < products.length - 1 ? 8 : 0 }}>
                  <div><Text strong>{String(product.metal || '')} ({product.purity || 0}%)</Text></div>
                  <div>{String(product.product || '')} - {String(product.sub_product || '')}</div>
                  <div>Amount: Rs.{typeof product.amount === 'number' ? product.amount.toFixed(2) : '0.00'}</div>
                </div>
              ))}
            </div>
          );
        } catch (error) {
          return <Text type="danger">Error displaying products</Text>;
        }
      }
    },
    {
      title: 'Bill',
      key: 'bill_copy',
      width: 80,
      render: (_, record) => {
        const photo = record?.pledge_data?.bill;
        const src = photo ? `${uploadConfigUrl}/uploads/pledge_items/${photo}` : null;
        return (
          <>
            <Avatar
              src={src}
              size="large"
              icon={!photo && <CameraOutlined />}
              style={{
                backgroundColor: photo ? 'transparent' : roots.gold[400],
                color: roots.text.inverse
              }}
              onClick={() => photo && setPreview(src)}
            />
            <Modal
              open={!!preview}
              footer={null}
              onCancel={() => setPreview(null)}
            >
              <img alt="preview" src={preview} style={{ width: '100%' }} />
            </Modal>
          </>
        );
      }
    },
    {
      title: 'Ornament Photo',
      key: 'ornament_photo',
      width: 80,
      render: (_, record) => {
        const photo = record?.pledge_data?.ornament_photo;
        const src = photo ? `${uploadConfigUrl}/uploads/pledge_items/${photo}` : null;
        return (
          <>
            <Avatar
              src={src}
              size="large"
              icon={!photo && <CameraOutlined />}
              style={{
                backgroundColor: photo ? 'transparent' : roots.gold[400],
                color: roots.text.inverse
              }}
              onClick={() => photo && setPreview(src)}
            />
            <Modal
              open={!!preview}
              footer={null}
              onCancel={() => setPreview(null)}
            >
              <img alt="preview" src={preview} style={{ width: '100%' }} />
            </Modal>
          </>
        );
      }
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (total_amount) => <Text strong>Rs. {total_amount}</Text>
    },
    {
      title: 'Finance Amount',
      key: 'rate_amount',
      width: 150,
      render: (_, record) => {
        const approved = Number(record?.pledge_data?.accounts_amount) || 0;
        const total = Number(record.total_amount) || 0;

        return (
          <div>
            <div>Finance Amount: Rs.{approved}/g</div>
            <div>Amount: Rs.{(total - approved).toFixed(2)}</div>
          </div>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.margin_approval_status === 'pending') {
          return (
            <Tag color="orange">
              <Badge status="processing" text="Pending Approval" />
            </Tag>
          );
        }
        return (
          <Tag color={record.status === 'active' ? 'green' : 'orange'}>
            {record.status === 'active' ? 'Active' : 'Expired'}
          </Tag>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewQuotation(record)}
          />
          <Button
            type="link"
            icon={<FilePdfOutlined />}
            onClick={() => handleGeneratePDF(record)}
            style={{ color: roots.status.error.main }}
          />
          {record.status === "active" && (<Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditQuotation(record)}
          />
          )}
          {/* {record.margin_approval_requested && (
            <Button
              type="link"
              icon={<ExclamationCircleOutlined />}
              onClick={() => showApprovalHistory(record.id)}
              style={{ color: roots.gold[500] }}
            />
          )} */}
          {/* <Popconfirm
            title="Are you sure to delete this quotation?"
            onConfirm={() => handleDeleteQuotation(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} danger />
          </Popconfirm> */}
        </Space>
      )
    }
  ];

  const approvalColumns = [
    {
      title: 'Quotation ID',
      dataIndex: 'quotation_id',
      key: 'quotation_id',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name'
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by_name',
      key: 'requested_by_name'
    },
    {
      title: 'Current Margin',
      dataIndex: 'old_margin',
      key: 'old_margin',
      render: (text) => `${text}%`
    },
    {
      title: 'Requested Margin',
      dataIndex: 'new_margin',
      key: 'new_margin',
      render: (text) => `${text}%`
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => showApprovalModal(record)}
        >
          Review
        </Button>
      )
    }
  ];
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productDetailsVisible, setProductDetailsVisible] = useState(false);
  const [preview, setPreview] = useState(null);
  const showProductDetails = (products) => {
    console.log(products)
    setSelectedProducts(JSON.parse(products));
    setProductDetailsVisible(true);
  };
  const customerColumns = [
    {
      title: ' ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Quotation ID',
      dataIndex: 'quotation_id',
      key: 'quotation_id',
      width: 150,
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Purchase ID',
      dataIndex: 'purchase_id',
      key: 'purchase_id',
      width: 150,
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
      title: 'Bill',
      key: 'bill',
      width: 80,
      render: (_, record) => {
        const photo = record?.pledge_data?.bill;
        const src = photo ? `${uploadConfigUrl}/uploads/pledge_items/${photo}` : null;
        return (
          <>
            <Avatar
              src={src}
              size="large"
              icon={!photo && <CameraOutlined />}
              style={{
                backgroundColor: photo ? 'transparent' : roots.gold[400],
                color: roots.text.inverse
              }}
              onClick={() => photo && setPreview(src)}
            />
            <Modal
              open={!!preview}
              footer={null}
              onCancel={() => setPreview(null)}
            >
              <img alt="preview" src={preview} style={{ width: '100%' }} />
            </Modal>
          </>
        );
      }
    },
    {
      title: 'Ornament Photo',
      key: 'ornament_photo',
      width: 80,
      render: (_, record) => {
        const photo = record?.pledge_data?.ornament_photo;
        const src = photo ? `${uploadConfigUrl}/uploads/pledge_items/${photo}` : null;
        return (
          <>
            <Avatar
              src={src}
              size="large"
              icon={!photo && <CameraOutlined />}
              style={{
                backgroundColor: photo ? 'transparent' : roots.gold[400],
                color: roots.text.inverse
              }}
              onClick={() => photo && setPreview(src)}
            />
            <Modal
              open={!!preview}
              footer={null}
              onCancel={() => setPreview(null)}
            >
              <img alt="preview" src={preview} style={{ width: '100%' }} />
            </Modal>
          </>
        );
      }
    },
    {
      title: 'Product Details',
      key: 'product_details',
      dataIndex: 'products',
      width: 200,
      render: (productsJson) => {
        try {
          const products = typeof productsJson === 'string' ? JSON.parse(productsJson) : productsJson;
          if (!Array.isArray(products) || products.length === 0) return 'No products';

          return (
            <div
              onClick={() => showProductDetails(productsJson)}
              style={{ cursor: 'pointer', padding: '8px' }}
            >
              {products.length === 1 ? (
                <>
                  <div><Text strong>{String(products[0].metal || '')}</Text></div>
                  <div>{String(products[0].sub_product || '')}</div>
                </>
              ) : (
                <>
                  <div><Text strong>Multiple Metals</Text></div>
                  <div>{products.length} items (click to view)</div>
                </>
              )}
            </div>
          );
        } catch (e) {
          return 'Error parsing products';
        }
      }
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 140
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => selectCustomer(record)}
        >
          Select
        </Button>
      )
    }
  ];

  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: 'Requested By',
      dataIndex: 'requested_by_name',
      key: 'requested_by_name'
    },
    {
      title: 'Old Margin',
      dataIndex: 'old_margin',
      key: 'old_margin',
      render: (text) => `${text}%`
    },
    {
      title: 'New Margin',
      dataIndex: 'new_margin',
      key: 'new_margin',
      render: (text) => `${text}%`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={approvalStatusColors[text]}>
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </Tag>
      )
    },
    {
      title: 'Approved/Rejected By',
      dataIndex: 'approved_by_name',
      key: 'approved_by_name',
      render: (text, record) => (
        record.status !== 'pending' ? text : '-'
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
    .upload-section {
      margin: 16px 0;
      border: 1px dashed ${roots.ebony[200]};
      padding: 16px;
      border-radius: 8px;
    }
    .upload-section-title {
      margin-bottom: 8px;
      font-weight: 500;
      color: ${roots.text.secondary};
    }
    .customer-card {
      border: 1px solid ${roots.ebony[200]};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: ${roots.ebony[50]};
    }
    .webcam-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 16px;
    }
    .webcam-buttons {
      margin-top: 16px;
    }
    .stats-card {
      border-left: 4px solid ${roots.gold[500]};
      border-radius: 4px;
    }
    .quotation-table {
      margin-top: 24px;
    }
    .margin-percent-input .ant-input-number-handler-wrap {
      opacity: ${userRole === 'sales_executive' ? 0.5 : 1};
      pointer-events: ${userRole === 'sales_executive' ? 'none' : 'auto'};
    }
    .product-field {
      position: relative;
      margin-bottom: 16px;
      padding: 16px;
      border: 1px solid ${roots.ebony[200]};
      border-radius: 8px;
      background: ${roots.ebony[50]};
    }
    .remove-product-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      color: ${roots.status.error.main};
    }
    .approval-card {
      margin-bottom: 16px;
      border-left: 4px solid ${roots.gold[500]};
    }
    .approval-actions {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .edit-modal-header {
      background: ${roots.gradient.gold} !important;
      border-bottom: 2px solid ${roots.gold[500]} !important;
    }
    .edit-modal-title {
      color: ${roots.text.inverse} !important;
      font-weight: 600;
    }
    .edit-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid ${roots.ebony[200]};
    }
    .amount-display {
      font-size: 16px;
      font-weight: 500;
      color: ${roots.text.primary};
    }
    .view-quotation-modal .ant-modal-body {
      padding: 0;
    }
    .view-quotation-header {
      background: ${roots.gold[400]};
      color: white;
      padding: 16px;
    }
    .view-quotation-content {
      padding: 16px;
    }
    .view-quotation-section {
      margin-bottom: 16px;
    }
    .view-quotation-section-title {
      font-weight: 500;
      margin-bottom: 8px;
      color: ${roots.text.secondary};
    }
    .view-quotation-product {
      padding: 8px;
      border: 1px solid ${roots.ebony[200]};
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .view-quotation-images {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    .view-quotation-image-container {
      width: 150px;
      height: 150px;
      border: 1px solid ${roots.ebony[200]};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .view-quotation-image {
      max-width: 100%;
      max-height: 100%;
    }
  `;
  const handleSearchChange = (e) => {
    // handleFilterChange({ search: e.target.value });
  };


  const handleStatusChange = (value) => {
    // handleFilterChange({ status: value });
  };

  const tablePagination = {
    current: pagination.current,    // ✅ Use 'current' not 'page'
    pageSize: pagination.pageSize,  // ✅ Use 'pageSize' not 'limit'
    total: pagination.total,       // ✅ Total records from server
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100', '200', '300'],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    onChange: handleTableChange,  // ✅ This now works
    onShowSizeChange: (current, size) => {
      // Handle page size changes
      fetchInitialData(1, size); // Go to first page with new size
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Spin spinning={loading}>
        {canApproveMargin && pendingApprovals.length > 0 && (
          <Card
            title="Pending Margin Approvals"
            style={{ marginBottom: 24 }}
            extra={
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={fetchPendingApprovals}
              >
                Refresh
              </Button>
            }
          >
            <Table
              columns={approvalColumns}
              dataSource={pendingApprovals}
              rowKey="id"
              size="small"
            />
          </Card>
        )}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showCustomerModal}
          className="add-button"
          style={{ marginBottom: 16 }}
        >
          Select Pledge Quotation
        </Button>

        <Card className="filter-card">
          <Row gutter={16} align="middle">
            <Col span={5}>
              <Input
                placeholder="Search by customer or quotation ID"
                prefix={<SearchOutlined />}
                value={quotationFilters.search}

                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Filter by metal"
                style={{ width: '100%' }}
                value={quotationFilters.metal}
                onChange={handleMetalChange}
                allowClear
              >
                {metalOptions.map(metal => (
                  <Option key={metal.id} value={metal.name}>{metal.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={quotationFilters.status}
                onChange={handleStatusChange}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="expired">Expired</Option>
                <Option value="pending_approval">Pending Approval</Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                allowClear
              />
            </Col>
            <Col span={5} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportQuotationsToPDF}
                  loading={exportLoading}
                >
                  Export PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <div className="quotation-table">
          <Table
            columns={quotationColumns}
            dataSource={filteredQuotations}
            scroll={{ x: 1300 }}
            rowKey="quotation_id"
            bordered
            loading={loading}
            pagination={tablePagination}
            // ❌ Remove this line - it's already in tablePagination.onChange
            onChange={handleTableChange}
          />
        </div>

        <Modal
          title="Select Quotation"
          open={isCustomerModalVisible}
          onCancel={handleCustomerCancel}
          footer={null}
          width={1000}
        >

          <Card className="filter-card">
            <Row gutter={16}>
              <Col span={12}>
                <Input
                  placeholder="Search by name, ID, Aadhar or PAN"
                  prefix={<SearchOutlined />}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Filter by state"
                  style={{ width: '100%' }}
                  value={filters.state}
                  onChange={handleStateFilter}
                  allowClear
                >
                  {statesList.map(state => (
                    <Option key={state} value={state}>{state}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={resetCustomerFilters}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Card>
          <Table
            columns={customerColumns}
            dataSource={filteredCustomers}
            scroll={{ x: 800 }}
            rowKey="id"
            bordered
            loading={loading}
          />
        </Modal>

        <Modal
          title={`${editingQuotation != null ? 'Edit' : 'Create'} Quotation - ${selectedCustomer?.customer_name || ''}`}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
          destroyOnClose
          className="edit-modal"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinalSubmit}
            initialValues={{
              margin_percent: 0,
              products: [{
                id: 1,
                purity: 100,
                gross_weight: 0,
                dust_weight: 0,
                stone_weight: 0,
                net_weight: 0,
                mcx_rate: 0,
                rate: 0,
                margin_weight: 0,
                final_weight: 0,
                amount: 0
              }]
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Customer ID"
                  name="customer_id"
                >
                  <Input readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Customer Name"
                  name="customer_name"
                >
                  <Input readOnly
                    addonAfter={!selectedCustomer && <Tag color="red">Not Found</Tag>}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Pledge ID"
                  name="pledge_id"
                >
                  <Input readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Purchase ID"
                  name="purchase_id"
                >
                  <Input readOnly
                    addonAfter={!selectedCustomer && <Tag color="red">Not Found</Tag>}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Quotation ID"
                  name="quotation_id"
                >
                  <Input readOnly />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Aadhar Number"
                  name="aadhar_no"
                  rules={[
                    { required: true, message: 'Please input Aadhar number!' },
                    { len: 12, message: 'Aadhar must be 12 digits!' }
                  ]}
                >
                  <Input maxLength={12} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="PAN Number"
                  name="pan_no"
                >
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
            </Row>

            <div className="upload-section">
              <div className="upload-section-title">Bill Copy</div>
              <Upload {...uploadProps(fileListBill, setFileListBill)}>
                {fileListBill.length >= 1 ? null : (
                  <div>
                    <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                    <div style={{ marginTop: 8 }}>Upload Bill Copy</div>
                  </div>
                )}
              </Upload>
            </div>

            <div className="upload-section">
              <div className="upload-section-title">Ornament Photo</div>
              {showWebcam ? (
                <div className="webcam-container">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: "environment"
                    }}
                  />
                  <div className="webcam-buttons">
                    <Button onClick={captureImage} type="primary" style={{ marginRight: 8 }}>
                      Capture Photo
                    </Button>
                    <Button onClick={() => setShowWebcam(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => setShowWebcam(true)}
                    icon={<CameraOutlined />}
                    style={{ marginBottom: 8 }}
                  >
                    Take Photo
                  </Button>
                  <Upload {...uploadProps(fileListOrnament, setFileListOrnament)}>
                    {fileListOrnament.length >= 1 ? null : (
                      <div>
                        <UploadOutlined style={{ fontSize: '24px', color: roots.text.tertiary }} />
                        <div style={{ marginTop: 8 }}>Upload Ornament Photo</div>
                      </div>
                    )}
                  </Upload>
                  {capturedImage && (
                    <Image
                      src={capturedImage}
                      width={100}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </>
              )}
            </div>
            {!editingQuotation && (
              <>
                <Divider orientation="left">Rough Product Details</Divider>
                <Form.List name="products1">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="product-field">

                          <Row gutter={16}>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Metal"
                                name={[name, 'metal']}
                                rules={[{ required: true, message: 'Please select metal!' }]}
                              >
                                <Select
                                  onChange={(value) => handleMetalChange(value, productFields[key].id)}
                                  disabled
                                  showSearch
                                  optionFilterProp="children"
                                  filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                  }
                                >
                                  {metalOptions.map(metal => (
                                    <Option key={metal.id} value={metal.id}>{metal.name}</Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Purity (%)"
                                name={[name, 'purity']}
                                rules={[{ required: true, message: 'Please input purity percentage!' }]}
                              >
                                <InputNumber
                                  min={0}
                                  max={100}
                                  disabled
                                  precision={2}
                                  style={{ width: '100%' }}
                                  onChange={() => calculateValues(productFields[key].id)}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Product"
                                name={[name, 'product']}
                                rules={[{ required: true, message: 'Please select product!' }]}
                              >
                                <Select
                                  onChange={(value) => handleProductChange(value, productFields[key].id)}
                                  showSearch
                                  disabled
                                  optionFilterProp="children"
                                  filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                  }
                                >
                                  {productOptions.map(product => (
                                    <Option key={product.id} value={product.id}>{product.name}</Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Sub Product"
                                name={[name, 'sub_product']}
                                rules={[{ required: true, message: 'Please select sub product!' }]}
                              >
                                <Select
                                  showSearch
                                  optionFilterProp="children"
                                  disabled
                                  filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                  }
                                >
                                  {subProductOptions[form.getFieldValue(['products', name, 'product'])]?.map(subProduct => (
                                    <Option key={subProduct.id} value={subProduct.sub_product_name}>{subProduct.sub_product_name}</Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Gross Weight (g)"
                                name={[name, 'gross_weight']}
                                rules={[{ required: true, message: 'Please input gross weight!' }]}
                              >
                                <InputNumber
                                  min={0}
                                  step={0.001}
                                  precision={3}
                                  disabled
                                  style={{ width: '100%' }}
                                  onChange={() => calculateValues(productFields[key].id)}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Dust Weight (g)"
                                name={[name, 'dust_weight']}
                                rules={[{ required: true, message: 'Please input dust weight!' }]}
                              >
                                <InputNumber
                                  min={0}
                                  step={0.001}
                                  disabled
                                  precision={3}
                                  style={{ width: '100%' }}
                                  onChange={() => calculateValues(productFields[key].id)}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Stone Weight (g)"
                                name={[name, 'stone_weight']}
                                rules={[{ required: true, message: 'Please input stone weight!' }]}
                              >
                                <InputNumber
                                  min={0}
                                  step={0.001}
                                  precision={3}
                                  disabled
                                  style={{ width: '100%' }}
                                  onChange={() => calculateValues(productFields[key].id)}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Net Weight (g)"
                                name={[name, 'net_weight']}
                              >
                                <InputNumber
                                  readOnly
                                  style={{ width: '100%' }}
                                  className="amount-display"
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="MCX Rate (Rs./g)"
                                name={[name, 'mcx_rate']}
                                rules={[{ required: true, message: 'Please input MCX rate!' }]}
                              >
                                <InputNumber
                                  min={0}
                                  disabled
                                  step={1}
                                  precision={2}
                                  style={{ width: '100%' }}
                                  onChange={() => calculateValues(productFields[key].id)}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                label="Rate (Rs./g)"
                                name={[name, 'rate']}
                              >
                                <InputNumber
                                  disabled
                                  style={{ width: '100%' }}
                                  className="amount-display"
                                />
                              </Form.Item>
                            </Col>
                            {/* <Col span={6}>
                          <Form.Item
                            label="Margin Weight (g)"
                            name={[name, 'margin_weight']}
                          >
                            <InputNumber
                              disabled
                              style={{ width: '100%' }}
                              className="amount-display"
                            />
                          </Form.Item>
                        </Col> */}
                            <Col span={6}>
                              <Form.Item
                                label="Final Weight (g)"
                                name={[name, 'final_weight']}
                              >
                                <InputNumber
                                  disabled
                                  style={{ width: '100%' }}
                                  className="amount-display"
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                label="Amount (Rs.)"
                                name={[name, 'amount']}
                              >
                                <InputNumber
                                  disabled
                                  style={{ width: '100%' }}
                                  formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  className="amount-display"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ))}
                      <Form.Item>
                      </Form.Item>
                    </>
                  )}
                </Form.List>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Margin %"
                      name="margin_percent1"
                      rules={[{ required: true, message: 'Please input margin %!' }]}
                    >
                      <InputNumber
                        min={minMarginValue}
                        max={maxMarginValue}
                        step={0.1}
                        style={{ width: '100%' }}
                        onChange={() => {
                          productFields.forEach(field => {
                            calculateValues(field.id);
                          });
                        }}
                        className="margin-percent-input"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Total Amount (Rs.)"
                      name="total_amount"
                    >
                      <InputNumber
                        disabled
                        style={{ width: '100%' }}
                        formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        className="amount-display"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Finance Amount (Rs.)"
                      name="finance_amt"
                    >
                      <InputNumber
                        disabled
                        style={{ width: '100%' }}
                        formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        className="amount-display"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}




            <Divider orientation="left">Product Details</Divider>

            <Form.List name="products">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="product-field">
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          className="remove-product-btn"
                          onClick={() => {
                            remove(name);
                            removeProductField(productFields[key].id);
                          }}
                        />
                      )}
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Metal"
                            name={[name, 'metal']}
                            rules={[{ required: true, message: 'Please select metal!' }]}
                          >
                            <Select
                              onChange={(value) => handleMetalChange(value, productFields[key].id)}
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                            >
                              {metalOptions.map(metal => (
                                <Option key={metal.id} value={metal.id}>{metal.name}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Purity (%)"
                            name={[name, 'purity']}
                            rules={[{ required: true, message: 'Please input purity percentage!' }]}
                          >
                            <InputNumber
                              min={0}
                              max={100}
                              precision={2}
                              style={{ width: '100%' }}
                              onChange={() => calculateValues(productFields[key].id)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Product"
                            name={[name, 'product']}
                            rules={[{ required: true, message: 'Please select product!' }]}
                          >
                            <Select
                              onChange={(value) => handleProductChange(value, productFields[key].id)}
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                            >
                              {productOptions.map(product => (
                                <Option key={product.id} value={product.id}>{product.name}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Sub Product"
                            name={[name, 'sub_product']}
                            rules={[{ required: true, message: 'Please select sub product!' }]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                            >
                              {subProductOptions[form.getFieldValue(['products', name, 'product'])]?.map(subProduct => (
                                <Option key={subProduct.id} value={subProduct.sub_product_name}>{subProduct.sub_product_name}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Gross Weight (g)"
                            name={[name, 'gross_weight']}
                            rules={[{ required: true, message: 'Please input gross weight!' }]}
                          >
                            <InputNumber
                              min={0}
                              step={0.001}
                              precision={3}
                              style={{ width: '100%' }}
                              onChange={() => calculateValues(productFields[key].id)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Dust Weight (g)"
                            name={[name, 'dust_weight']}
                            rules={[{ required: true, message: 'Please input dust weight!' }]}
                          >
                            <InputNumber
                              min={0}
                              step={0.001}
                              precision={3}
                              style={{ width: '100%' }}
                              onChange={() => calculateValues(productFields[key].id)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Stone Weight (g)"
                            name={[name, 'stone_weight']}
                            rules={[{ required: true, message: 'Please input stone weight!' }]}
                          >
                            <InputNumber
                              min={0}
                              step={0.001}
                              precision={3}
                              style={{ width: '100%' }}
                              onChange={() => calculateValues(productFields[key].id)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Net Weight (g)"
                            name={[name, 'net_weight']}
                          >
                            <InputNumber
                              readOnly
                              style={{ width: '100%' }}
                              className="amount-display"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="MCX Rate (Rs./g)"
                            name={[name, 'mcx_rate']}
                            rules={[{ required: true, message: 'Please input MCX rate!' }]}
                          >
                            <InputNumber
                              min={0}
                              step={1}
                              precision={2}
                              style={{ width: '100%' }}
                              readOnly
                              onChange={() => calculateValues(productFields[key].id)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            label="Rate (Rs./g)"
                            name={[name, 'rate']}
                          >
                            <InputNumber
                              readOnly
                              style={{ width: '100%' }}
                              className="amount-display"
                            />
                          </Form.Item>
                        </Col>
                        {/* <Col span={6}>
                          <Form.Item
                            label="Margin Weight (g)"
                            name={[name, 'margin_weight']}
                          >
                            <InputNumber
                              disabled
                              style={{ width: '100%' }}
                              className="amount-display"
                            />
                          </Form.Item>
                        </Col> */}
                        <Col span={6}>
                          <Form.Item
                            label="Final Weight (g)"
                            name={[name, 'final_weight']}
                          >
                            <InputNumber
                              readOnly
                              style={{ width: '100%' }}
                              className="amount-display"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            label="Amount (Rs.)"
                            name={[name, 'amount']}
                          >
                            <InputNumber
                              readOnly
                              style={{ width: '100%' }}
                              formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              className="amount-display"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => {
                        const newId = productFields.length > 0 ? Math.max(...productFields.map(f => f.id)) + 1 : 1;
                        setProductFields([...productFields, { id: newId }]);
                        add({
                          id: newId,
                          purity: 100,
                          gross_weight: 0,
                          dust_weight: 0,
                          stone_weight: 0,
                          net_weight: 0,
                          mcx_rate: 0,
                          rate: 0,
                          margin_weight: 0,
                          final_weight: 0,
                          amount: 0
                        });
                      }}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Product
                    </Button>
                  </Form.Item>


                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={fetchMCXRates}
                    style={{ marginRight: 12, marginBottom: 10 }}
                  >
                    Refresh Rates
                  </Button>

                  <Text strong style={{ fontSize: 16, lineHeight: '32px' }}>
                    Live Gold Rate: Rs.{liveGoldRate != null ? new Intl.NumberFormat('en-IN').format(liveGoldRate) : '—'}
                  </Text>


                </>
              )}
            </Form.List>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Margin %"
                  name="margin_percent"
                  rules={[{ required: true, message: 'Please input margin %!' }]}
                >
                  <InputNumber
                    min={0}
                    max={7}
                    step={0.1}
                    style={{ width: '100%' }}
                    onChange={() => {
                      productFields.forEach(field => {
                        calculateValues(field.id);
                      });
                    }}
                    className="margin-percent-input"
                    disabled={userRole === 'sales_executive'}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Total Amount (Rs.)"
                  name="total_amount"
                >
                  <InputNumber
                    readOnly
                    style={{ width: '100%' }}
                    formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    className="amount-display"
                  />
                </Form.Item>
              </Col>
            </Row>

            {editingQuotation != null && editingQuotation.margin_approval_status === 'pending' && (
              <Alert
                message="Margin Approval Pending"
                description={`This quotation has a pending margin approval request (Current: ${editingQuotation.margin_percent}%, Requested: ${editingQuotation.requested_margin}%)`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}



            <Form.Item
              label="Remarks"
              name="remarks"
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <div className="edit-modal-footer">
              <Button onClick={handleCancel} style={{ marginRight: '8px' }}>
                Cancel
              </Button>
              {editingQuotation != null && userRole === 'sales_executive' && (
                <Button
                  type="primary"
                  onClick={handleRequestApproval}
                  style={{
                    background: roots.gradient.orange,
                    border: 'none',
                    boxShadow: roots.shadow.orange
                  }}
                >
                  Request Margin Approval
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: roots.gradient.gold,
                  border: 'none',
                  boxShadow: roots.shadow.gold
                }}
              >
                {editingQuotation != null ? 'Update Quotation' : 'Generate Quotation'}
              </Button>
            </div>
          </Form>
        </Modal>

        <Modal
          title="Margin Approval Request"
          open={approvalModalVisible}
          onCancel={() => setApprovalModalVisible(false)}
          footer={null}
          width={600}
        >
          {currentApproval && (
            <div>
              <Card className="approval-card">
                <Descriptions column={1}>
                  <Descriptions.Item label="Quotation ID">{currentApproval.quotation_id}</Descriptions.Item>
                  <Descriptions.Item label="Customer">{currentApproval.customer_name}</Descriptions.Item>
                  <Descriptions.Item label="Requested By">{currentApproval.requested_by_name}</Descriptions.Item>
                  <Descriptions.Item label="Current Margin">{currentApproval.old_margin}%</Descriptions.Item>
                  <Descriptions.Item label="Requested Margin">{currentApproval.new_margin}%</Descriptions.Item>
                  <Descriptions.Item label="Reason">{currentApproval.reason}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Form layout="vertical">
                <Form.Item label="Approval Notes" name="approval_notes">
                  <Input.TextArea
                    rows={3}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Enter any additional notes for approval"
                  />
                </Form.Item>
                <Form.Item label="Rejection Reason" name="rejection_reason" style={{ display: 'none' }}>
                  <Input.TextArea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection"
                  />
                </Form.Item>
              </Form>

              <div className="approval-actions">
                <Button
                  danger
                  onClick={() => {
                    confirm({
                      title: 'Are you sure you want to reject this margin change?',
                      icon: <ExclamationCircleOutlined />,
                      content: (
                        <Input.TextArea
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide reason for rejection"
                        />
                      ),
                      onOk: () => handleRejectMargin(currentApproval.id),
                      okText: 'Reject',
                      okButtonProps: { danger: true },
                      cancelText: 'Cancel'
                    });
                  }}
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleApproveMargin(currentApproval.id)}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title="Margin Approval History"
          open={approvalHistoryModalVisible}
          onCancel={() => setApprovalHistoryModalVisible(false)}
          footer={null}
          width={800}
        >
          <Table
            columns={historyColumns}
            dataSource={approvalHistory}
            rowKey="id"
            bordered
            loading={loading}
          />
        </Modal>

        <Modal
          title="View Quotation Details"
          open={viewQuotationModalVisible}
          onCancel={() => setViewQuotationModalVisible(false)}
          footer={null}
          width={800}
          className="view-quotation-modal"
        >
          {viewQuotationData && (
            <div>
              <div className="view-quotation-header">
                <Title level={4} style={{ color: 'white', marginBottom: 0 }}>
                  {viewQuotationData.customer_name}
                </Title>
                <Text style={{ color: 'white' }}>Quotation ID: {viewQuotationData.quotation_id}</Text>
              </div>

              <div className="view-quotation-content">
                <div className="view-quotation-section">
                  <div className="view-quotation-section-title">Customer Details</div>
                  <Descriptions column={2}>
                    <Descriptions.Item label="Pledge ID">{viewQuotationData.customer_id}</Descriptions.Item>
                    <Descriptions.Item label="Aadhar No">{viewQuotationData.aadhar_no}</Descriptions.Item>
                    <Descriptions.Item label="PAN No">{viewQuotationData.pan_no != "undefined" ? viewQuotationData.pan_no : ""}</Descriptions.Item>
                    <Descriptions.Item label="Date">
                      {new Date(viewQuotationData.created_at).toLocaleDateString()}
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                <div className="view-quotation-section">
                  <div className="view-quotation-section-title">Products</div>
                  {viewQuotationData.products.map((product, index) => (
                    <div key={index} className="view-quotation-product">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text strong>Product {index + 1}</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.sub_product || 'N/A'}</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Metal:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.metal} ({product.purity.toFixed(3)}%)</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Gross Weight:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.gross_weight.toFixed(3)} GM</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Dust Weight:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.dust_weight.toFixed(3)} GM</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Stone Weight:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.stone_weight.toFixed(3)} GM</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Net Weight:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.net_weight.toFixed(3)} GM</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Pure Weight:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>{product.final_weight.toFixed(3)} GM</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Rate:</Text>
                        </Col>
                        <Col span={16}>
                          <Text>Rs.{product.rate.toFixed(2)}/GM</Text>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text>Amount:</Text>
                        </Col>
                        <Col span={16}>
                          <Text strong>Rs.{product.amount.toFixed(2)}</Text>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>

                <div className="view-quotation-section">
                  <div className="view-quotation-section-title">Summary</div>
                  <Descriptions column={2}>
                    <Descriptions.Item label="Total Amount">
                      <Text strong>Rs.{viewQuotationData.products.reduce((sum, product) =>
                        sum + parseFloat(product.amount || 0), 0)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Margin Percentage">
                      {viewQuotationData.margin_percent}% ({(viewQuotationData.products.reduce((sum, product) =>
                        sum + parseFloat(product.amount || 0), 0) * (viewQuotationData.margin_percent / 100)).toFixed(2)})
                    </Descriptions.Item>
                    <Descriptions.Item label="Reference">
                      {viewQuotationData.reference}
                    </Descriptions.Item>
                    <Descriptions.Item label="Final Amount">
                      <Text strong>Rs.{viewQuotationData.total_amount}</Text>
                    </Descriptions.Item>
                    {viewQuotationData.reference_person && (
                      <Descriptions.Item label="Reference Person">
                        {viewQuotationData.reference_person}
                      </Descriptions.Item>
                    )}
                    {viewQuotationData.other_reference && (
                      <Descriptions.Item label="Other Reference">
                        {viewQuotationData.other_reference}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Remarks">
                      {viewQuotationData.remarks || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={viewQuotationData.status === 'active' ? 'green' : 'orange'}>
                        {viewQuotationData.status === 'active' ? 'Active' : 'Expired'}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </div>

                {(viewQuotationData.bill_copy || viewQuotationData.ornament_photo) && (
                  <div className="view-quotation-section">
                    <div className="view-quotation-section-title">Attachments</div>
                    <div className="view-quotation-images">
                      {viewQuotationData.bill_copy && (
                        <div className="view-quotation-image-container">
                          <img
                            src={`${uploadConfigUrl}${viewQuotationData.bill_copy}`}
                            alt="Bill Copy"
                            className="view-quotation-image"
                          />
                        </div>
                      )}
                      {viewQuotationData.ornament_photo && (
                        <div className="view-quotation-image-container">
                          <img
                            src={`${uploadConfigUrl}${viewQuotationData.ornament_photo}`}
                            alt="Ornament Photo"
                            className="view-quotation-image"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        <Modal
          visible={previewVisible}
          title="Image Preview"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="preview" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </Spin>
      <Modal
        title="Product Details"
        visible={productDetailsVisible}
        onCancel={() => setProductDetailsVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={[
            {
              title: 'Metal',
              dataIndex: 'metal',
              key: 'metal',
              width: 100,
            },

            {
              title: 'Sub Product',
              dataIndex: 'sub_product',
              key: 'sub_product',
              width: 120,
            },
            {
              title: 'Gross Weight (g)',
              dataIndex: 'gross_weight',
              key: 'gross_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Net Weight (g)',
              dataIndex: 'net_weight',
              key: 'net_weight',
              width: 120,
              render: (value) => parseFloat(value).toFixed(3),
            },
            {
              title: 'Rate (Rs./g)',
              dataIndex: 'rate',
              key: 'rate',
              width: 100,
              render: (value) => `Rs.${parseFloat(value).toFixed(2)}`,
            },
            {
              title: 'Amount (Rs.)',
              dataIndex: 'amount',
              key: 'amount',
              width: 120,
              render: (value) => `Rs.${parseFloat(value).toFixed(2)}`,
            },
          ]}
          dataSource={selectedProducts}
          rowKey={(record) => `${record.metal}-${record.product}-${record.sub_product}`}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default PledgeQuotation;