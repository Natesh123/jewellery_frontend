import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo.jpg';
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
  Radio,
  InputNumber,
  Image,
  Badge,
  Statistic,
  Steps,
  Spin,
  Alert,
  DatePicker
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
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined, EnvironmentOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  generateQuotationPDF,
  getMCXRates,
  requestMarginApproval,
  approveMarginChange,
  rejectMarginChange,
  getPendingApprovals,
  getApprovalHistory,
} from '../../api/services/quatationService';
import { roots } from '../../colorConstant';
import { statesList } from '../../utils/stateList';
import Webcam from "react-webcam";
import pledgeService from '../../api/services/pledgeService';
import {
  getCustomers,
} from '../../api/services/customerServices';
import { getMetals } from '../../api/services/metalService';
import { getProducts } from '../../api/services/productService';
import { getSubProducts } from '../../api/services/subProductServices';
import { generateDetailedPledgePDF, generatePledgesPDF } from './pledgePdf';

const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;
const referenceOptions = [
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'sales_executive', label: 'Sales Executive' },
  { value: 'manager', label: 'Manager' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' }
];
// Mock data
const metalOptions = ['Gold', 'Silver', 'Platinum', 'Palladium'];
const productOptions = ['Ring', 'Chain', 'Bangle', 'Earring', 'Pendant'];
const subProductOptions = {
  'Ring': ['Plain', 'Stone', 'Antique'],
  'Chain': ['Rope', 'Figaro', 'Box'],
  'Bangle': ['Solid', 'Hollow', 'Kada'],
  'Earring': ['Stud', 'Hoop', 'Jhumka'],
  'Pendant': ['Plain', 'Stone', 'Custom']
};

const AllPledges = () => {
  const [dateRange, setDateRange] = useState([]);
  const { RangePicker } = DatePicker;
  const [exportLoading, setExportLoading] = useState(false);

  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fileListBill, setFileListBill] = useState([]);
  const [fileListOrnament, setFileListOrnament] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [showOtherReference, setShowOtherReference] = useState(false);
  const [showReferencePerson, setShowReferencePerson] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [subProducts, setSubProducts] = useState([]);
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pledgeFilters, setPledgeFilters] = useState({
    search: '',
    metal: '',
    status: '',
    dateRange: []
  });
  const [filteredPledges, setFilteredPledges] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [productDetailsVisible, setProductDetailsVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [productFields, setProductFields] = useState([{
    id: 1,
    metal: '',
    product: '',
    sub_product: ''
  }]);
  const [metalOptions, setMetalOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [subProductOptions, setSubProductOptions] = useState({});
  const [mcxRates, setMcxRates] = useState({});

  const webcamRef = useRef(null);

  const [filters, setFilters] = useState({
    search: '',
    state: ''
  });

  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const fetchManagers = async () => {

  };
  const showProductDetails = (products) => {
    setSelectedProducts(products);
    setProductDetailsVisible(true);
  };
  const handleTableChange = (pagination) => {
    setPagination(pagination);
    // Call your API here with the new pagination parameters
    fetchCustomers(pagination.current, pagination.pageSize);
  };
  const fetchCustomers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getCustomers(page, pageSize);

      if (!response) {
        throw new Error('No response received');
      }

      // Adjust based on actual response structure
      const customersData = response.customers || response.data?.customers || [];
      const paginationData = response.pagination || response.data?.pagination || {};

      setCustomers(customersData);
      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || pageSize,
        total: paginationData.total || 0,
      });

    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error(error.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const exportPledgesToPDF = async () => {
    try {
      setExportLoading(true);

      // Prepare parameters for export
      const params = {
        page: 1,
        limit: 10000, // Get all data
      };

      // Add search filters
      if (pledgeFilters.search.trim()) {
        params.search = pledgeFilters.search.trim();
      }

      // Add status filter
      if (pledgeFilters.status) {
        params.approval = pledgeFilters.status;
      }

      // Add date range if selected - IMPORTANT: use the correct parameter names
      if (dateRange && dateRange[0] && dateRange[1]) {
        // Use the exact parameter names your API expects
        params.fromDate = dateRange[0].format('YYYY-MM-DD');
        params.toDate = dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Exporting pledges with params:', params);

      // Call API with date parameters
      const response = await pledgeService.getPledges(1, 10000, params);
      const exportData = response.data?.data || response.data || [];

      if (exportData.length === 0) {
        message.warning('No data found for the selected filters');
        setExportLoading(false);
        return;
      }

      // Transform data for PDF
      const transformedData = transformPledgeData(exportData);

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
      doc.text('PLEDGE MANAGEMENT REPORT', 148.5, 12, { align: 'center' });

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
      if (pledgeFilters.search) filterInfo += `Search: ${pledgeFilters.search} | `;
      if (pledgeFilters.status) {
        const statusMap = {
          '0': 'Not Assigned',
          '1': 'Closed',
          '2': 'Pending Approval',
          '3': 'Active',
          '4': 'Rejected',
          '5': 'Processing'
        };
        filterInfo += `Status: ${statusMap[pledgeFilters.status] || pledgeFilters.status}`;
      }

      if (filterInfo) {
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.text(filterInfo, 148.5, 22, { align: 'center' });
      }

      // Table columns for summary view
      const tableColumn = [
        'Pledge ID',
        'Date',
        'Customer Name',
        'Customer ID',
        'Product',
        'Gross Wt(g)',
        'Net Wt(g)',
        'Pledge Amount (Rs.)',
        'Status'
      ];

      const tableRows = [];
      let totalPledges = transformedData.length;
      let totalAmount = 0;
      let totalGrossWeight = 0;
      let totalNetWeight = 0;
      let statusCounts = {
        '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
      };

      transformedData.forEach((pledge) => {
        const amount = parseFloat(pledge.pledge_amount) || 0;
        const grossWeight = parseFloat(pledge.gross_weight) || 0;
        const netWeight = parseFloat(pledge.net_weight) || 0;

        totalAmount += amount;
        totalGrossWeight += grossWeight;
        totalNetWeight += netWeight;

        // Count status
        if (pledge.approval) {
          statusCounts[pledge.approval] = (statusCounts[pledge.approval] || 0) + 1;
        }

        // Get status text
        let statusText = '';
        switch (pledge.approval) {
          case '0': statusText = 'Not Assigned'; break;
          case '1': statusText = 'Closed'; break;
          case '2': statusText = 'Pending Approval'; break;
          case '3': statusText = 'Active'; break;
          case '4': statusText = 'Rejected'; break;
          case '5': statusText = 'Processing'; break;
          default: statusText = 'Unknown';
        }

        // Get main product
        let mainProduct = 'Multiple';
        if (pledge.products && pledge.products.length > 0) {
          mainProduct = pledge.products[0].sub_product || pledge.products[0].product || 'Multiple';
        }

        const pledgeData = [
          pledge.pledge_id || 'N/A',
          pledge.date || new Date(pledge.created_at).toLocaleDateString('en-IN'),
          pledge.customer_name || 'N/A',
          pledge.customer_id || 'N/A',
          mainProduct,
          grossWeight.toFixed(3),
          netWeight.toFixed(3),
          `Rs.${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          statusText
        ];

        tableRows.push(pledgeData);
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
          fillColor: [212, 175, 55], // Gold color
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
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 25 },
          8: { cellWidth: 25 },
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
      doc.rect(10, finalY, 277, 40, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, finalY, 277, 40, 'S');

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('SUMMARY', 20, finalY + 8);
      doc.setFont(undefined, 'normal');

      const col1 = 20;
      const col2 = 80;
      const col3 = 140;
      const col4 = 200;

      doc.text(`Total Pledges: ${totalPledges}`, col1, finalY + 15);
      doc.text(`Not Assigned: ${statusCounts['0']}`, col1, finalY + 22);
      doc.text(`Closed: ${statusCounts['1']}`, col1, finalY + 29);
      doc.text(`Pending: ${statusCounts['2']}`, col2, finalY + 15);
      doc.text(`Active: ${statusCounts['3']}`, col2, finalY + 22);
      doc.text(`Rejected: ${statusCounts['4']}`, col2, finalY + 29);
      doc.text(`Total Amount: Rs.${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col3, finalY + 15);
      doc.text(`Gross Weight: ${totalGrossWeight.toFixed(3)}g`, col3, finalY + 22);
      doc.text(`Net Weight: ${totalNetWeight.toFixed(3)}g`, col3, finalY + 29);
      doc.text(`Avg Amount: Rs.${totalPledges > 0 ? (totalAmount / totalPledges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`, col4, finalY + 15);
      doc.text(`Avg Gross Wt: ${totalPledges > 0 ? (totalGrossWeight / totalPledges).toFixed(3) : '0.000'}g`, col4, finalY + 22);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const footerY = doc.internal.pageSize.height - 15;
      doc.text('Generated by: Pledge Management System', 10, footerY);
      doc.text(`Records: ${totalPledges}`, 270, footerY, { align: 'right' });
      doc.text(new Date().toLocaleString('en-IN'), 148.5, footerY, { align: 'center' });

      // Save PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `Pledge-Report-${timestamp}.pdf`;
      doc.save(fileName);

      message.success(`PDF exported successfully! (${totalPledges} records)`);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Add useEffect to fetch pledges when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPledges(1, pagination.pageSize);
    }, 500);

    return () => clearTimeout(timer);
  }, [pledgeFilters.search, pledgeFilters.status, dateRange]);

  // Also update the date range change handler
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    // No need to update pledgeFilters.dateRange separately
    // The useEffect will handle the fetch when dateRange changes
  };

  // Update the reset filters function
  const resetPledgeFilters = () => {
    setPledgeFilters({
      search: '',
      status: '',
    });
    setDateRange([]); // Also reset date range
  };

  // Add individual pledge PDF export function
  const exportSinglePledgePDF = (pledge) => {
    try {
      // Create PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header with logo (if available)
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, 210, 30, 'F');

      // Add logo if available
      if (logo) {
        doc.addImage(logo, 'JPEG', 10, 5, 30, 20);
      }

      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('PLEDGE DETAILS', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Amaya Gold Point - Pledge Management', 105, 22, { align: 'center' });

      let yPos = 40;

      // Pledge ID and Date
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Pledge ID: ${pledge.pledge_id}`, 10, yPos);
      doc.text(`Date: ${pledge.date}`, 150, yPos);
      yPos += 10;

      // Customer Information
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('CUSTOMER INFORMATION', 10, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      doc.setFontSize(10);
      doc.text(`Name: ${pledge.customer_name || 'N/A'}`, 10, yPos);
      doc.text(`Customer ID: ${pledge.customer_id || 'N/A'}`, 100, yPos);
      yPos += 6;

      if (pledge.user_data) {
        doc.text(`Created By: ${pledge.user_data.name || 'N/A'}`, 10, yPos);
        yPos += 6;
      }

      // Product Details
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('PRODUCT DETAILS', 10, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      // Table header
      doc.setFillColor(212, 175, 55);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Metal', 12, yPos + 5);
      doc.text('Product', 45, yPos + 5);
      doc.text('Gross Wt(g)', 85, yPos + 5);
      doc.text('Net Wt(g)', 120, yPos + 5);
      doc.text('Rate(Rs./g)', 150, yPos + 5);
      doc.text('Amount(Rs.)', 180, yPos + 5);

      yPos += 8;
      doc.setTextColor(0, 0, 0);

      // Product rows
      if (pledge.products && Array.isArray(pledge.products)) {
        pledge.products.forEach((product, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(9);
          doc.text(product.metal || 'N/A', 12, yPos + 5);
          doc.text(product.sub_product || product.product || 'N/A', 45, yPos + 5);
          doc.text(parseFloat(product.gross_weight || 0).toFixed(3), 85, yPos + 5);
          doc.text(parseFloat(product.net_weight || 0).toFixed(3), 120, yPos + 5);
          doc.text(`Rs.${parseFloat(product.rate || 0).toFixed(2)}`, 150, yPos + 5);
          doc.text(`Rs.${parseFloat(product.amount || 0).toFixed(2)}`, 180, yPos + 5);
          yPos += 8;
        });
      }

      // Summary
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('FINANCIAL SUMMARY', 10, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      doc.setFontSize(10);
      doc.text(`Total Pledge Amount: Rs.${parseFloat(pledge.pledge_amount || 0).toFixed(2)}`, 10, yPos);
      yPos += 6;
      doc.text(`Interest Rate: ${pledge.interest_rate || 0}%`, 10, yPos);
      yPos += 6;

      if (pledge.current_interest) {
        doc.text(`Current Interest: Rs.${parseFloat(pledge.current_interest || 0).toFixed(2)}`, 10, yPos);
        yPos += 6;
      }

      if (pledge.total_payment) {
        doc.text(`Total Payment: Rs.${parseFloat(pledge.total_payment || 0).toFixed(2)}`, 10, yPos);
        yPos += 6;
      }

      // Status Information
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('STATUS INFORMATION', 10, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;

      doc.setFontSize(10);
      const statusMap = {
        '1': ['Not Assigned', 'blue'],
        '2': ['Pending Approval', 'orange'],
        '3': ['Active', 'green'],
        '4': ['Rejected', 'red'],
        '5': ['Processing', 'gray']
      };

      const [statusText, statusColor] = statusMap[pledge.approval] || ['Unknown', 'gray'];
      doc.text(`Overall Status: ${statusText}`, 10, yPos);
      yPos += 6;

      // Additional statuses if available
      if (pledge.accounts_status) {
        doc.text(`Accounts Status: ${pledge.accounts_status === '1' ? 'Approved' : 'Pending'}`, 10, yPos);
        yPos += 6;
      }

      if (pledge.manager_approval_status) {
        doc.text(`Manager Approval: ${pledge.manager_approval_status === '1' ? 'Accepted' : 'Pending'}`, 10, yPos);
        yPos += 6;
      }

      // Remarks
      if (pledge.remarks) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('REMARKS', 10, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 7;

        doc.setFontSize(9);
        const remarksLines = doc.splitTextToSize(pledge.remarks || '', 180);
        doc.text(remarksLines, 10, yPos);
      }

      // Footer
      const footerY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated on: ' + new Date().toLocaleString(), 10, footerY);
      doc.text('Page 1 of 1', 190, footerY, { align: 'right' });

      // Save PDF
      const fileName = `Pledge-${pledge.pledge_id}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      message.success('PDF downloaded successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  const fetchPledges = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);

      // Prepare filter params
      const params = {
        page,
        limit: pageSize
      };

      // Add date filters if available - corrected format
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.fromDate = dateRange[0].format('YYYY-MM-DD');
        params.toDate = dateRange[1].format('YYYY-MM-DD');
      }

      // Add status filter if available
      if (pledgeFilters.status) {
        params.approval = pledgeFilters.status;
      }

      // Add search filter
      if (pledgeFilters.search) {
        params.search = pledgeFilters.search;
      }

      console.log('Fetching pledges with params:', params);

      const response = await pledgeService.getPledges(page, pageSize, params);
      const pledgesData = response.data?.data || response.data || [];
      const paginationData = response.data?.pagination || {
        current: response.data?.page || page,
        pageSize: response.data?.limit || pageSize,
        total: response.data?.total || 0,
      };

      const transformedPledges = transformPledgeData(pledgesData);
      setPledges(transformedPledges);
      setFilteredPledges(transformedPledges); // Set filtered pledges as well
      setPagination({
        current: paginationData.current || paginationData.page || page,
        pageSize: paginationData.pageSize || paginationData.limit || pageSize,
        total: paginationData.total || 0,
      });

    } catch (error) {
      console.error('Error fetching pledges:', error);
      message.error('Failed to fetch pledges');
    } finally {
      setLoading(false);
    }
  };
  const getStatusFilterValue = (statusText) => {
    switch (statusText) {
      case 'active': return '3';
      case 'closed': return '1';
      case 'pending_approval': return '2';
      case 'rejected': return '4';
      default: return statusText;
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
      const response = await getProducts();
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
    try {
      const response = await getSubProducts();
      const subs = response.subProducts.filter(sub => sub.product_id === productId);

      setSubProductOptions(prev => ({
        ...prev,
        [productId]: subs.map(sub => ({
          id: sub.id,
          name: sub.sub_product_name,
          code: sub.sub_product_code
        }))
      }));

      return subs;
    } catch (error) {
      message.error('Failed to fetch sub product options');
      return [];
    }
  };

  const fetchMCXRates = async () => {
    try {
      const response = await getMCXRates();
      setMcxRates(response.data.rates);
    } catch (error) {
      message.error('Failed to fetch MCX rates');
    }
  };
  // Load mock data
  useEffect(() => {
    fetchCustomers(1, 10);
    fetchPledges(1, 10);
    fetchManagers();
    fetchMetalOptions();
    fetchProductOptions();
    const mockCustomers = [

    ];

    const mockPledges = [

    ];

    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
    setPledges(mockPledges);
    setFilteredPledges(mockPledges);
  }, []);
  // Add this useEffect to verify state updates
  useEffect(() => {
    console.log('Current managers state:', managers);
  }, [managers]);
  // Apply customer filters
  useEffect(() => {
    applyCustomerFilters();
  }, [filters, customers]);

  useEffect(() => {
    applyPledgeFilters();
  }, [pledgeFilters, pledges]);

  const applyCustomerFilters = () => {
    let filtered = [...customers];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.aadhar_no?.includes(searchTerm) ||
        item.pan_no?.includes(searchTerm)
      );
    }

    if (filters.state) {
      filtered = filtered.filter(item =>
        item.state?.toLowerCase() === filters.state.toLowerCase()
      );
    }

    setFilteredCustomers(filtered);
  };

  const applyPledgeFilters = () => {
    let filtered = [...pledges];

    if (pledgeFilters.search) {
      const searchTerm = pledgeFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.pledge_id?.toLowerCase().includes(searchTerm)
      );
    }

    if (pledgeFilters.metal) {
      filtered = filtered.filter(item =>
        item.metal?.toLowerCase() === pledgeFilters.metal.toLowerCase()
      );
    }

    if (pledgeFilters.status) {
      filtered = filtered.filter(item =>
        item.status?.toLowerCase() === pledgeFilters.status.toLowerCase()
      );
    }

    if (pledgeFilters.dateRange && pledgeFilters.dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const pledgeDate = new Date(item.date);
        return pledgeDate >= pledgeFilters.dateRange[0] &&
          pledgeDate <= pledgeFilters.dateRange[1];
      });
    }

    setFilteredPledges(filtered);
  };
  const handleExportPDF = () => {
    const filteredData = applyFiltersForExport();

    // Create filename with filters
    let fileName = 'pledges_report';
    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].format('YYYY-MM-DD');
      const end = dateRange[1].format('YYYY-MM-DD');
      fileName = `pledges_${start}_to_${end}`;
    }
    if (pledgeFilters.metal) {
      fileName += `_${pledgeFilters.metal}`;
    }
    if (pledgeFilters.status) {
      fileName += `_${pledgeFilters.status}`;
    }
    fileName += '.pdf';

    generatePledgesPDF(filteredData, {
      dateRange: dateRange && dateRange.length === 2
        ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')]
        : null,
      ...pledgeFilters
    }, fileName);
  };

  const handleExportSinglePDF = (pledge) => {
    generateDetailedPledgePDF(pledge);
  };


  const applyFiltersForExport = () => {
    let filtered = [...pledges];

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const pledgeDate = new Date(item.created_at);
        return pledgeDate >= dateRange[0].toDate() &&
          pledgeDate <= dateRange[1].toDate();
      });
    }

    if (pledgeFilters.search) {
      const searchTerm = pledgeFilters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm) ||
        item.customer_id?.toLowerCase().includes(searchTerm) ||
        item.pledge_id?.toLowerCase().includes(searchTerm)
      );
    }

    if (pledgeFilters.metal) {
      filtered = filtered.filter(item => {
        const itemMetal = Array.isArray(item.product_details)
          ? item.product_details[0]?.metal
          : item.metal;
        return itemMetal?.toString().toLowerCase().includes(pledgeFilters.metal.toLowerCase());
      });
    }

    if (pledgeFilters.status) {
      filtered = filtered.filter(item => {
        let statusCode = '';
        switch (pledgeFilters.status) {
          case 'active': statusCode = '3'; break;
          case 'closed': statusCode = '1'; break;
          case 'pending_approval': statusCode = '2'; break;
          case 'rejected': statusCode = '4'; break;
          default: statusCode = pledgeFilters.status;
        }
        return item.approval === statusCode;
      });
    }

    return filtered;
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

  const handleReferenceChange = (value) => {
    setShowOtherReference(value === 'other');
    setShowReferencePerson(value === 'sales_executive' || value === 'manager');
    form.setFieldsValue({
      reference_person: undefined,
      other_reference: undefined
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileListBill([]);
    setFileListOrnament([]);
    setShowWebcam(false);
    setCurrentStep(0);
    setOtpSent(false);
    setOtpVerified(false);
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

  const handleCustomerCancel = () => {
    setIsCustomerModalVisible(false);
  };

  const selectCustomer = (record) => {
    setSelectedCustomer(record);
    console.log('Selected customer:', record);
    setIsCustomerModalVisible(false);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      customer_id: record.customer_id,
      customer_name: record.customer_name,
      adhar_number: record.aadhar_no,
      pan_number: record.pan_no,
      phone_number: record.phoneno,
      interest_rate: 2,// Default interest
    });
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setIsModalVisible(false);
    setCurrentStep(0);
    setOtpSent(false);
    setOtpVerified(false);
  };

  const handleUpload = (file, fileList, setFileList) => {
    const newFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
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

  const handleProductChange = async (value, fieldId) => {
    // Fetch sub-products for the selected product
    const subs = await fetchSubProductOptions(value);

    // Update the form with the first sub-product if available
    const currentProducts = form.getFieldValue('products') || [];
    const updatedProducts = currentProducts.map((product, idx) => {
      if (idx === fieldId) {
        return {
          ...product,
          product: value,
          sub_product: subs.length > 0 ? subs[0].id : undefined
        };
      }
      return product;
    });

    form.setFieldsValue({ products: updatedProducts });
  };

  const calculateValues = (name) => {
    // Get all form values
    const values = form.getFieldsValue();

    // Get the current product values
    const productValues = values.products?.[name] || {};

    const grossWeight = productValues.gross_weight || 0;
    const dustWeight = productValues.dust_weight || 0;
    const stoneWeight = productValues.stone_weight || 0;
    const rate = productValues.rate || 0;
    const interestRate = values.interest_rate || 0;

    // Calculate net weight
    const netWeight = grossWeight - dustWeight - stoneWeight;

    // Calculate amount (loan amount)
    const amount = netWeight * rate;

    // Calculate pledge amount (75% of amount as per RBI guidelines)
    const pledgeAmount = amount * 0.75;

    // Calculate current interest (1 month interest)
    const currentInterest = (pledgeAmount * interestRate) / 100;

    // Calculate total payment asking (pledge amount + interest)
    const totalPayment = pledgeAmount + currentInterest;

    // Update the form fields for this product
    form.setFieldsValue({
      products: {
        [name]: {
          net_weight: netWeight.toFixed(3),
          amount: amount.toFixed(2)
        }
      },
      pledge_amount: pledgeAmount.toFixed(2),
      current_interest: currentInterest.toFixed(2),
      total_payment: totalPayment.toFixed(2)
    });
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();

    // Convert to blob for consistent handling
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });

        setCapturedImage(imageSrc);
        setFileListOrnament([{
          uid: '-1',
          name: 'captured.jpg',
          status: 'done',
          url: imageSrc,
          originFileObj: file
        }]);
        setShowWebcam(false);
      });
  };

  const sendOtp = () => {
    setSendingOtp(true);
    // Simulate API call
    setTimeout(() => {
      setSendingOtp(false);
      setOtpSent(true);
      message.success('OTP sent to registered mobile number');
      setCurrentStep(1);
    }, 1500);
  };

  const verifyOtp = () => {
    const otp = form.getFieldValue('otp');
    if (!otp || otp.length !== 6) {
      message.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    // Simulate API verification
    setTimeout(() => {
      setVerifyingOtp(false);
      if (otp === '123456') { // Mock verification
        setOtpVerified(true);
        message.success('Aadhar OTP verified successfully');
        setCurrentStep(2);
      } else {
        message.error('Invalid OTP. Please try again.');
      }
    }, 1500);
  };

  const handleFinalSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log(fileListBill)
      console.log(fileListOrnament)
      // Prepare step 1 data (customer info)
      const step1Data = {
        customer_id: selectedCustomer.customer_id,
        adhar_number: values.aadhar_number || selectedCustomer.aadhar_no,
        pan_number: values.pan_number || selectedCustomer.pan_no,
        phone_number: values.phone_number || selectedCustomer.phoneno,
        role_id: localStorage.getItem("userRoleId"),
        created_user: localStorage.getItem("userId")
      };
      const formData = new FormData();
      // Prepare step 2 data (pledge details)
      formData.append('product_details', JSON.stringify(values.products));
      formData.append('interest_rate', values.interest_rate);
      formData.append('pledge_amount', values.pledge_amount);
      formData.append('current_interest', values.current_interest);
      formData.append('total_payment', values.total_payment);
      formData.append('remarks', values.remarks || '');

      if (fileListBill.length > 0 && fileListBill[0].originFileObj) {
        formData.append('bill', fileListBill[0].originFileObj);
      }

      // Handle ornament file upload
      if (fileListOrnament.length > 0 && fileListOrnament[0].originFileObj) {
        formData.append('ornament_photo', fileListOrnament[0].originFileObj);
      } else if (capturedImage) {
        // Convert captured image (base64) to blob if no uploaded file
        const blob = await fetch(capturedImage).then(res => res.blob());
        formData.append('ornament_photo', blob, 'captured.jpg');
      }

      // First create the pledge record
      const createdPledge = await pledgeService.createPledge(step1Data);

      // Then update with product details
      const updatedPledge = await pledgeService.updatePledge(
        createdPledge.id,
        formData
      );

      message.success('Pledge created successfully!');
      window.location.reload();
      handleCancel();
    } catch (error) {
      console.error('Error:', error);
      message.error(error.response?.data?.message || 'Failed to create pledge');
    }
  };



  const onFinish = (values) => {
    handleFinalSubmit();
  };

  const uploadProps = (fileList, setFileList) => ({
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      handleUpload(file, fileList, setFileList);
      return false;
    },
    fileList,
    listType: "picture-card",
    onPreview: handlePreview,
    accept: "image/*",
    maxCount: 1
  });

  const handleEditPledge = (record) => {
    const customer = customers.find(c => c.customer_id === record.customer_id);
    if (customer) {
      setSelectedCustomer(customer);
      setIsModalVisible(true);
      setCurrentStep(2);
      setOtpVerified(record.aadhar_verified);

      form.setFieldsValue({
        ...record,
        customer_id: record.customer_id,
        customer_name: record.customer_name,
        products: record.products || [{}]
      });

      if (record.bill_copy) {
        setFileListBill([{
          uid: '-1',
          name: 'bill.jpg',
          status: 'done',
          url: record.bill_copy
        }]);
      }

      if (record.ornament_photo) {
        setFileListOrnament([{
          uid: '-2',
          name: 'ornament.jpg',
          status: 'done',
          url: record.ornament_photo
        }]);
      }
    } else {
      message.error('Customer not found for this pledge');
    }
  };

  const handleDeletePledge = (key) => {
    setPledges(prev => prev.filter(item => item.key !== key));
    message.success('Pledge deleted successfully');
  };


  const generatePledgePDF = (record) => {
    message.success(`Generating PDF for pledge ${record.pledge_id}`);
    // PDF generation logic would go here
  };

  const updatePledgeStatus = (key, status) => {
    setPledges(prev => prev.map(item =>
      item.key === key ? { ...item, status } : item
    ));
    message.success(`Pledge status updated to ${status}`);
  };

  const pledgeColumns = [
    {
      title: 'Pledge ID',
      dataIndex: 'pledge_id',
      key: 'pledge_id',
      width: 120,
      fixed: 'left',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 150,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customer_id}</Text>
        </div>
      )
    },
    {
      title: 'Product Details',
      key: 'product_details',
      width: 200,
      render: (_, record) => (
        <div
          onClick={() => showProductDetails(record.products)}
          style={{ cursor: 'pointer', padding: '8px' }}
        >
          {record.products.length === 1 ? (
            <>
              <div><Text strong>{record.products[0].metal}</Text></div>
              <div> {record.products[0].sub_product}</div>
            </>
          ) : (
            <>
              <div><Text strong>Multiple Metals</Text></div>
              <div>{record.products.length} items (click to view)</div>
            </>
          )}
        </div>
      )
    },
    {
      title: 'Weight (g)',
      key: 'weight',
      width: 120,
      render: (_, record) => (
        <div>
          <div>Gross: {record.gross_weight.toFixed(3)}</div>
          <div>Net: {record.net_weight.toFixed(3)}</div>
        </div>
      )
    },
    {
      title: 'Amounts',
      key: 'amounts',
      width: 180,
      render: (_, record) => (
        <div>
          <div>Amount: Rs.{record.amount.toFixed(2)}</div>
          <div>Pledge: Rs.{record.pledge_amount}</div>
        </div>
      )
    },
    {
      title: 'Overall Status',
      key: 'approval',
      width: 120,
      render: (_, record) => {
        let color, text;
        switch (record.approval) {
          case '1':
            color = 'blue';
            text = 'Not Assigned';
            break;
          case '2':
            color = 'orange';
            text = 'Assigned';
            break;
          case '3':
            color = 'green';
            text = 'Success';
            break;
          case '4':
            color = 'red';
            text = 'Rejected';
            break;
          case '5':
            color = 'gray';
            text = 'Processing';
            break;
          default:
            color = 'gray';
            text = 'Unknown';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    // Money Request Status and Location
    {
      title: 'Money Request Status',
      key: 'money_rquest_status',
      width: 150,
      render: (_, record) => getMoneyStatusTag(record.money_rquest_status)
    },
    {
      title: 'Money Request Location',
      key: 'money_request_location',
      width: 150,
      render: (_, record) => {
        if (record.money_request_lat && record.money_requet_lng) {
          return (
            <Button
              type="link"
              icon={<EnvironmentOutlined />}
              onClick={() => openMapLocation(record.money_request_lat, record.money_requet_lng, 'Money Request Location')}
              style={{ color: roots.gold[500] }}
              title="View Money Request Location on Map"
            >
              View Location
            </Button>
          );
        }
        return <Tag color="gray">No Location</Tag>;
      }
    },
    // Accounts Status
    {
      title: 'Accounts Status',
      key: 'accounts_status',
      width: 120,
      render: (_, record) => getStatusTag(record.accounts_status)
    },
    // Bank Collection Status and Location
    {
      title: 'Bank Collection Status',
      key: 'bank_collection_status',
      width: 150,
      render: (_, record) => getMoneyStatusTag(record.bank_collection_status)
    },
    {
      title: 'Bank Collection Location',
      key: 'bank_collection_location',
      width: 150,
      render: (_, record) => {
        if (record.bank_collection_lat && record.bank_collection_lng) {
          return (
            <Button
              type="link"
              icon={<EnvironmentOutlined />}
              onClick={() => openMapLocation(record.bank_collection_lat, record.bank_collection_lng, 'Bank Collection Location')}
              style={{ color: roots.gold[500] }}
              title="View Bank Collection Location on Map"
            >
              View Location
            </Button>
          );
        }
        return <Tag color="gray">No Location</Tag>;
      }
    },
    // Finance Status and Location
    {
      title: 'Finance Status',
      key: 'finance_status',
      width: 120,
      render: (_, record) => getMoneyStatusTag(record.finance_status)
    },
    {
      title: 'Finance Location',
      key: 'finance_location',
      width: 150,
      render: (_, record) => {
        if (record.finance_lat && record.finance_lng) {
          return (
            <Button
              type="link"
              icon={<EnvironmentOutlined />}
              onClick={() => openMapLocation(record.finance_lat, record.finance_lng, 'Finance Location')}
              style={{ color: roots.gold[500] }}
              title="View Finance Location on Map"
            >
              View Location
            </Button>
          );
        }
        return <Tag color="gray">No Location</Tag>;
      }
    },
    // Gold Collection Status and Location
    {
      title: 'Gold Collection Status',
      key: 'gold_collect_status',
      width: 150,
      render: (_, record) => getMoneyStatusTag(record.gold_collect_status)
    },
    {
      title: 'Gold Collection Location',
      key: 'gold_collect_location',
      width: 150,
      render: (_, record) => {
        if (record.gold_collect_lat && record.gold_collect_lng) {
          return (
            <Button
              type="link"
              icon={<EnvironmentOutlined />}
              onClick={() => openMapLocation(record.gold_collect_lat, record.gold_collect_lng, 'Gold Collection Location')}
              style={{ color: roots.gold[500] }}
              title="View Gold Collection Location on Map"
            >
              View Location
            </Button>
          );
        }
        return <Tag color="gray">No Location</Tag>;
      }
    },
    // Manager Approval Status
    {
      title: 'Manager Approval Status',
      key: 'manager_approval_status',
      width: 150,
      render: (_, record) => getAcceptStatusTag(record.manage_approval_status)
    },
    // Regional Status
    {
      title: 'Regional Status',
      key: 'regional_status',
      width: 120,
      render: (_, record) => getAcceptStatusTag(record.regional_status)
    },
    // Approval Accounts Status
    {
      title: 'Approval Accounts Status',
      key: 'approval_accounts_status',
      width: 150,
      render: (_, record) => getAcceptStatusTag(record.approval_accounts_status)
    },
    // Regional Manager Status
    {
      title: 'Regional Manager Status',
      key: 'regional_manager_status',
      width: 150,
      render: (_, record) => getAcceptStatusTag(record.regional_manager_status)
    },
    // Manage Approval Status
    {
      title: 'Manager Approval Status',
      key: 'manage_approval_status',
      width: 150,
      render: (_, record) => getAcceptStatusTag(record.manage_approval_status)
    },
    // Add this to the pledgeColumns array (as the last column):
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleExportSinglePDF(record)}
            title="Download PDF"
          />
        </Space>
      )
    }

  ];
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapLocation, setMapLocation] = useState({ lat: null, lng: null, title: '' });

  // Function to handle opening the map location
  const openMapLocation = (latitude, longitude, title) => {
    // Check if coordinates are valid
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      message.error('Invalid location coordinates');
      return;
    }

    // Open in Google Maps
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    // Open in a new tab
    window.open(googleMapsUrl, '_blank');
  };

  // Function to show map modal (optional)
  const showMapModal = (lat, lng, title) => {
    setMapLocation({ lat, lng, title });
    setMapModalVisible(true);
  };

  // Function to get status tag for different approval types
  const getStatusTag = (status) => {
    if (status === "1") return <Tag color="green">Approved</Tag>;
    if (status === "0") return <Tag color="red">Rejected</Tag>;
    if (status === null) return <Tag color="orange">Pending</Tag>;
    return <Tag color="gray">Unknown</Tag>;
  };

  const getMoneyStatusTag = (status) => {
    if (status === "1") return <Tag color="green">Collected</Tag>;
    if (status === "0") return <Tag color="red">Not Collected</Tag>;
    if (status === null) return <Tag color="orange">Pending</Tag>;
    return <Tag color="gray">Unknown</Tag>;
  };

  const getAcceptStatusTag = (status) => {
    if (status === "1") return <Tag color="green">Accepted</Tag>;
    if (status === "0") return <Tag color="red">Not Accepted</Tag>;
    if (status === null) return <Tag color="orange">Pending</Tag>;
    return <Tag color="gray">Unknown</Tag>;
  };
  const transformPledgeData = (pledgeData) => {
    return pledgeData.map(pledge => ({
      key: pledge.id,
      pledge_id: pledge.pledge_id,
      date: new Date(pledge.created_at).toLocaleDateString(),
      customer_name: pledge.customer_data?.customer_name,
      customer_id: pledge.customer_id,
      metal: pledge.product_details?.[0]?.metal || 'Multiple',
      product: pledge.product_details?.[0]?.product || 'Multiple',
      sub_product: pledge.product_details?.[0]?.sub_product || 'Multiple',
      gross_weight: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.gross_weight) || 0), 0),
      net_weight: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.net_weight) || 0), 0),
      amount: pledge.product_details?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      pledge_amount: pledge.pledge_amount,
      approval: pledge.approval || '1',
      bill_copy: pledge.bill,
      ornament_photo: pledge.ornament_photo,
      products: pledge.product_details || [],
      interest_rate: pledge.interest_rate,
      current_interest: pledge.current_interest,
      total_payment: pledge.total_payment,
      remarks: pledge.remarks,
      user_data: pledge.user_data,
      // Status fields
      money_rquest_status: pledge.money_rquest_status,
      money_request_lat: pledge.money_request_lat,
      money_requet_lng: pledge.money_requet_lng,
      accounts_status: pledge.accounts_status,
      bank_collection_status: pledge.bank_collection_status,
      bank_collection_lat: pledge.bank_collection_lat,
      bank_collection_lng: pledge.bank_collection_lng,
      finance_status: pledge.finance_status,
      finance_lat: pledge.finance_lat,
      finance_lng: pledge.finance_lng,
      gold_collect_status: pledge.gold_collect_status,
      gold_collect_lat: pledge.gold_collect_lat,
      gold_collect_lng: pledge.gold_collect_lng,
      manager_approval_status: pledge.manager_approval_status,
      regional_status: pledge.regional_status,
      approval_accounts_status: pledge.approval_accounts_status,
      regional_manager_status: pledge.regional_manager_status,
      manage_approval_status: pledge.manage_approval_status
    }));
  };

  const customerColumns = [
    {
      title: 'Customer ID',
      dataIndex: 'customer_id',
      key: 'customer_id',
      width: 120,
      render: (text) => <strong style={{ color: roots.text.primary }}>{text}</strong>
    },
    {
      title: 'Photo',
      dataIndex: 'customer_photo',
      key: 'customer_photo',
      width: 80,
      render: (photo) => (
        <Avatar
          src={photo}
          size="large"
          icon={<CameraOutlined />}
          style={{ backgroundColor: roots.gold[400] }}
        />
      )
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
    .pledge-table {
      margin-top: 24px;
    }
    .steps-container {
      margin-bottom: 24px;
    }
    .otp-section {
      margin: 16px 0;
      padding: 16px;
      background: ${roots.ebony[50]};
      border-radius: 8px;
    }
  `;

  return (
    <div style={{ padding: '24px', backgroundColor: roots.background.default, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />



      {/* Pledge Filters */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Search by customer or pledge ID"
              prefix={<SearchOutlined />}
              value={pledgeFilters.search}
              onChange={(e) => setPledgeFilters(prev => ({ ...prev, search: e.target.value }))}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={pledgeFilters.status}
              onChange={(value) => setPledgeFilters(prev => ({ ...prev, status: value }))}
              allowClear
            >
              <Option value="3">Active</Option>
              <Option value="1">Closed</Option>
              <Option value="2">Pending Approval</Option>
              <Option value="4">Rejected</Option>
              <Option value="5">Processing</Option>
            </Select>

          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={pledgeFilters.status}
              onChange={(value) => setPledgeFilters(prev => ({ ...prev, status: value }))}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="closed">Closed</Option>
              <Option value="pending_approval">Pending Approval</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => handleDateRangeChange(dates)}
              format="YYYY-MM-DD"
              value={dateRange}
            />
          </Col>
          <Col span={6}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={resetPledgeFilters}
            >
              Reset Filters
            </Button>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <Statistic
              title="Total Pledges"
              value={filteredPledges.length}
              prefix={<FilePdfOutlined />}
              valueStyle={{ color: roots.gold[500] }}
            />
          </Col>
          <Col span={6}>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportPledgesToPDF}
              loading={exportLoading}
              style={{ background: roots.gradient.gold, border: 'none' }}
            >
              Export PDF
            </Button></Col>
        </Row>
      </Card>

      {/* Pledge Table */}
      <div className="pledge-table">
        <Table
          columns={pledgeColumns}
          dataSource={filteredPledges}
          scroll={{ x: 1500 }}
          rowKey="key"
          bordered
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              fetchPledges(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              fetchPledges(current, size);
            }
          }}
        />
      </div>

      {/* Customer Selection Modal */}
      <Modal
        title="Select Customer"
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
          rowKey="id" // Changed from 'key' to 'id' to match your API response
          bordered
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
          }}
          onChange={handleTableChange}
        />
      </Modal>

      {/* Pledge Modal */}
      <Modal
        title={`Pledge - ${selectedCustomer?.customer_name || ''}`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div className="steps-container">
          <Steps current={currentStep}>
            <Step title="Customer Info" />
            <Step title="Aadhar Verification" />
            <Step title="Pledge Details" />
          </Steps>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {/* Always show customer info at the top */}
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
                <Input readOnly />
              </Form.Item>
            </Col>
          </Row>

          {currentStep === 0 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Aadhar Number"
                    name="adhar_number"  // Instead of aadhar_no
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
                    name="pan_number"    // Instead of pan_no
                    rules={[
                      { required: true, message: 'Please input PAN number!' },
                      { len: 10, message: 'PAN must be 10 characters!' }
                    ]}
                  >
                    <Input maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Phone Number"
                    name="phone_number"
                    rules={[
                      { required: true, message: 'Please input phone number!' },
                      { len: 10, message: 'Phone must be 10 digits!' }
                    ]}
                  >
                    <Input maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={() => setCurrentStep(1)}>
                  Next: Aadhar Verification
                </Button>
              </Form.Item>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="otp-section">
                <Alert
                  message="Aadhar Verification Required"
                  description="Please verify the customer's Aadhar details by sending OTP to their registered mobile number."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {!otpSent ? (
                  <div>
                    <Button
                      type="primary"
                      onClick={sendOtp}
                      loading={sendingOtp}
                    >
                      Send OTP to Registered Mobile
                    </Button>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      OTP will be sent to the mobile number linked with Aadhar
                    </Text>
                  </div>
                ) : (
                  <div>
                    <Form.Item
                      label="Enter OTP"
                      name="otp"
                      rules={[
                        { required: true, message: 'Please enter OTP!' },
                        { len: 6, message: 'OTP must be 6 digits!' }
                      ]}
                    >
                      <Input maxLength={6} />
                    </Form.Item>

                    <Space>
                      <Button
                        type="primary"
                        onClick={verifyOtp}
                        loading={verifyingOtp}
                        disabled={otpVerified}
                      >
                        {otpVerified ? 'Verified' : 'Verify OTP'}
                      </Button>
                      {otpVerified && <CheckOutlined style={{ color: roots.status.success.main, fontSize: 18 }} />}
                    </Space>
                  </div>
                )}
              </div>

              <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(2)}
                    disabled={!otpVerified}
                  >
                    Next: Pledge Details
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}

          {currentStep === 2 && (
            <>
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

              <Divider orientation="left">Product Details</Divider>


              <Form.List name="products">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="product-field" style={{ marginBottom: 16, position: 'relative' }}>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => remove(name)}
                            style={{ position: 'absolute', right: 0, top: 0 }}
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
                                  <Option key={subProduct.name} value={subProduct.name}>
                                    {subProduct.name}
                                  </Option>
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
                                onChange={() => calculateValues(name)}
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
                                onChange={() => calculateValues(name)}
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
                                onChange={() => calculateValues(name)}
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
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Rate (Rs./g)"
                              name={[name, 'rate']}
                              rules={[{ required: true, message: 'Please input rate!' }]}
                            >
                              <InputNumber
                                min={0}
                                step={1}
                                precision={2}
                                style={{ width: '100%' }}
                                onChange={() => calculateValues(name)}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              label="Amount (Rs.)"
                              name={[name, 'amount']}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
                          add({
                            metal: 'Gold', // Default value
                            product: '',
                            sub_product: '',
                            gross_weight: 0,
                            dust_weight: 0,
                            stone_weight: 0,
                            net_weight: 0,
                            rate: 0,
                            amount: 0
                          });
                        }}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add Product
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Interest Rate (%)"
                    name="interest_rate"
                    rules={[{ required: true, message: 'Please input interest rate!' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      step={0.1}
                      style={{ width: '100%' }}
                      onChange={() => {
                        const values = form.getFieldsValue();
                        if (Array.isArray(values.products)) {
                          values.products.forEach((_, index) => {
                            calculateValues(index);
                          });
                        }
                      }}

                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Pledge Amount (Rs.)"
                    name="pledge_amount"
                  >
                    <InputNumber

                      style={{ width: '100%' }}
                      formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Remarks"
                name="remarks"
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item style={{ marginTop: '32px', textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{
                      background: roots.gradient.gold,
                      border: 'none',
                      boxShadow: roots.shadow.gold
                    }}
                  >
                    Wait for Approval
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
      {/* Map Modal */}
      <Modal
        title={`Location: ${mapLocation.title}`}
        visible={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width={800}
        height={600}
      >
        <div style={{ height: '500px', width: '100%' }}>
          <div style={{
            height: '100%',
            width: '100%',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '4px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: '48px', color: roots.gold[500] }} />
              <p>Map integration would go here</p>
              <p>Coordinates: {mapLocation.lat}, {mapLocation.lng}</p>
              <Button
                type="primary"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mapLocation.lat},${mapLocation.lng}`, '_blank')}
              >
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>
      </Modal>
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

export default AllPledges;