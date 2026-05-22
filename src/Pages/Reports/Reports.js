import React, { useState } from 'react';
import { Card, Table, Typography, Space, Button, Tag, DatePicker, Input, message, Modal, Select } from 'antd';
import { DownloadOutlined, SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { roots } from '../../colorConstant';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../../api/apiConfig/apiClient';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Static Data for the table
const STATIC_PURCHASES = [
  { id: 1, title: 'Purchase' },
  { id: 2, title: 'Pledge Quotation' },
  { id: 3, title: 'Sales' },
  { id: 4, title: 'Stock Report' },
  { id: 5, title: 'Smith Payment Report' },
  { id: 6, title: 'Day Book' },
  { id: 7, title: 'Ledger' },
  { id: 8, title: 'Trial Balance' },
  { id: 9, title: 'Profit and Loss' }
];

const Reports = () => {
  const [purchaseList, setPurchaseList] = useState(STATIC_PURCHASES);
  const [rowDates, setRowDates] = useState({}); // To store dates per row ID
  const [rowAccountHeads, setRowAccountHeads] = useState({}); // To store account heads per row ID
  const [rowTrialBalanceTypes, setRowTrialBalanceTypes] = useState({}); // To store trial balance filter type (asOnDate/range)
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountHeads, setAccountHeads] = useState([]);

  // Fetch account heads for ledger
  React.useEffect(() => {
    const fetchAccountHeads = async () => {
      try {
        const response = await apiClient.get('/accounts/get_account_head');
        if (response.data) setAccountHeads(response.data);
      } catch (error) {
        console.error('Error fetching account heads:', error);
      }
    };
    fetchAccountHeads();
  }, []);

  // Local filtering for search
  const handleSearch = (value) => {
    setSearchText(value);
    const filteredData = STATIC_PURCHASES.filter(item =>
      (item.title && item.title.toLowerCase().includes(value.toLowerCase()))
    );
    setPurchaseList(filteredData);
  };

  const generatePurchasePDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header Section with Dark Blue Background
      doc.setFillColor(44, 62, 80); // Dark Blue
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('GOLD PURCHASE REPORT', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Date Range: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Table Data
      const tableRows = data.map((item) => [
        item.purchase_id || 'N/A',
        item.customer_name || 'N/A',
        item.created_at ? moment(item.created_at).format('D/M/YYYY') : 'N/A',
        item.items && item.items.length > 0 ? item.items.map(i => i.product_name).join(', ') : (item.purity || 'N/A'),
        parseFloat(item.total_gross_weight || 0).toFixed(3),
        parseFloat(item.total_net_weight || 0).toFixed(3),
        `Rs.${parseFloat(item.total_amount || 0).toLocaleString('en-IN')}`,
        item.payment_method || 'N/A',
        item.purchase_type === 'direct_purchase' ? 'Direct Purchase' : 'Pledge Purchase'
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Purchase ID', 'Customer Name', 'Date', 'Products', 'Gross Wt (g)', 'Net Wt (g)', 'Amount (Rs.)', 'Payment Method', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2, halign: 'left' },
        columnStyles: {
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' }
        }
      });

      // Summary Report Section
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFillColor(245, 245, 245);
      doc.rect(15, finalY, pageWidth - 30, 40, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, finalY, pageWidth - 30, 40, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('SUMMARY REPORT', 20, finalY + 8);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Calculations
      const totalPurchases = data.length;
      const cashPayments = data.filter(i => i.payment_method === 'cash').length;
      const bankTransfers = data.filter(i => i.payment_method === 'bank_transfer').length;
      const partialPayments = data.filter(i => i.payment_method === 'partial_both').length;
      const directPurchases = data.filter(i => i.purchase_type === 'direct_purchase').length;
      const pledgePurchases = data.filter(i => i.purchase_type === 'pledge_purchase').length;

      const totalGrossWeight = data.reduce((sum, i) => sum + parseFloat(i.total_gross_weight || 0), 0);
      const totalNetWeight = data.reduce((sum, i) => sum + parseFloat(i.total_net_weight || 0), 0);
      const totalAmount = data.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
      const weightDiff = totalGrossWeight - totalNetWeight;
      const avgAmount = totalPurchases > 0 ? totalAmount / totalPurchases : 0;
      const highestAmount = data.length > 0 ? Math.max(...data.map(i => parseFloat(i.total_amount || 0))) : 0;

      // Summary Column 1
      doc.text(`Total Purchases: ${totalPurchases}`, 20, finalY + 15);
      doc.text(`Cash Payments: ${cashPayments}`, 20, finalY + 22);
      doc.text(`Bank Transfers: ${bankTransfers}`, 20, finalY + 29);

      // Summary Column 2
      doc.text(`Partial Payments: ${partialPayments}`, 60, finalY + 15);
      doc.text(`Pledge Purchases: ${pledgePurchases}`, 60, finalY + 22);
      doc.text(`Direct Purchases: ${directPurchases}`, 60, finalY + 29);

      // Summary Column 3
      doc.text(`Total Gross Weight: ${totalGrossWeight.toFixed(3)} g`, 110, finalY + 15);
      doc.text(`Total Net Weight: ${totalNetWeight.toFixed(3)} g`, 110, finalY + 22);
      doc.text(`Weight Difference: ${weightDiff.toFixed(3)} g`, 110, finalY + 29);

      // Summary Column 4
      doc.text(`Total Amount: Rs.${totalAmount.toLocaleString('en-IN')}.00`, 160, finalY + 15);
      doc.text(`Average Amount: Rs.${avgAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 160, finalY + 22);
      doc.text(`Highest Amount: Rs.${highestAmount.toLocaleString('en-IN')}.00`, 160, finalY + 29);

      // Footer
      const footerY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by: System', 15, footerY);
      doc.text(`Page 1 of 1`, 40, footerY);
      doc.text('This is a computer-generated report. For any discrepancies, please contact the administration.', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Filtered Records: ${totalPurchases}`, pageWidth - 15, footerY, { align: 'right' });

      doc.save(`Purchase_Report_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Purchase report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateSalesPDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header Section
      doc.setFillColor(44, 62, 80); // Dark Blue
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('SALES REPORT', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Date Range: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Table Data
      const tableRows = data.map((item) => {
        // Calculation logic for weights (consistent with Sales dashboard)
        const weight = parseFloat(item.weight) || 0;
        const dustWeight = parseFloat(item.dust_weight) || 0;
        const purity = parseFloat(item.purity) || 100;
        const netWeight = (weight - dustWeight) * (purity / 100);
        const marginWeight = (netWeight * 3) / 100;
        const finalWeight = netWeight - marginWeight;

        // Sum payments for total amount if not explicitly present
        const totalPaid = Array.isArray(item.sales_payments)
          ? item.sales_payments.reduce((sum, p) => sum + parseFloat(p.completed_payment || 0), 0)
          : 0;
        const roundOff = Array.isArray(item.sales_payments)
          ? item.sales_payments.reduce((sum, p) => sum + parseFloat(p.pending_payment || 0), 0)
          : 0;

        const finalAmount = totalPaid + roundOff;

        return [
          `#AMAMELT${item.id}`,
          item.assign_customer_name || 'N/A',
          item.created_at ? moment(item.created_at).format('D/M/YYYY') : 'N/A',
          parseFloat(weight).toFixed(3),
          parseFloat(finalWeight).toFixed(3),
          `Rs.${finalAmount.toLocaleString('en-IN')}`,
          item.assign_customer_payment_type || 'N/A',
          'Assigned'
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [['Receipt No', 'Customer Name', 'Date', 'Gross Wt (g)', 'Pure Wt (g)', 'Amount (Rs.)', 'Payment Type', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2, halign: 'left' },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'center' },
          7: { halign: 'center' }
        }
      });

      // Summary
      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 30) + 10;
      doc.setFillColor(245, 245, 245);
      doc.rect(15, finalY, pageWidth - 30, 30, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, finalY, pageWidth - 30, 30, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('SALES SUMMARY', 20, finalY + 8);

      const totalSales = data.length;
      const totalAmount = data.reduce((sum, item) => {
        const totalPaid = Array.isArray(item.sales_payments) ? item.sales_payments.reduce((s, p) => s + parseFloat(p.completed_payment || 0), 0) : 0;
        const roundOff = Array.isArray(item.sales_payments) ? item.sales_payments.reduce((s, p) => s + parseFloat(p.pending_payment || 0), 0) : 0;
        return sum + (totalPaid + roundOff);
      }, 0);

      const totalPureWeight = data.reduce((sum, item) => {
        const weight = parseFloat(item.weight) || 0;
        const dustWeight = parseFloat(item.dust_weight) || 0;
        const purity = parseFloat(item.purity) || 100;
        const netWeight = (weight - dustWeight) * (purity / 100);
        return sum + (netWeight * 0.97); // 3% margin
      }, 0);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Sales: ${totalSales}`, 20, finalY + 15);
      doc.text(`Total Weight: ${totalPureWeight.toFixed(3)} g (Pure)`, 100, finalY + 15);
      doc.text(`Total Value: Rs.${totalAmount.toLocaleString('en-IN')}`, 180, finalY + 15);

      doc.save(`Sales_Report_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Sales report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generatePledgePDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header Section with Dark Blue Background
      doc.setFillColor(44, 62, 80); // Dark Blue
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('PLEDGE QUOTATIONS REPORT', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Date Range: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Table Data
      const tableRows = data.map((item) => {
        let pCount = 0;
        try {
          if (item.products) {
            const parsed = typeof item.products === 'string' ? JSON.parse(item.products) : item.products;
            pCount = Array.isArray(parsed) ? parsed.length : 0;
          }
        } catch (e) { pCount = 0; }

        const financeAmt = item.pledge_data?.total_payment || item.pledge_data?.accounts_amount || 0;

        return [
          item.quotation_id || 'N/A',
          item.pledge_id ? `#PLED0${item.pledge_id}` : 'N/A',
          item.created_at ? moment(item.created_at).format('D/M/YYYY') : 'N/A',
          item.customer_name || 'N/A',
          item.customer_id || '-',
          pCount,
          `Rs.${parseFloat(item.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `Rs.${parseFloat(financeAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          item.status || 'N/A',
          `${parseFloat(item.margin_percent || 0).toFixed(2)}%`
        ];
      });

      autoTable(doc, {
        startY: 30,
        head: [['Quotation ID', 'Pledge ID', 'Date', 'Customer Name', 'Customer ID', 'Products Count', 'Total Amount (Rs.)', 'Finance Amount (Rs.)', 'Status', 'Margin %']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2, halign: 'left' },
        columnStyles: {
          5: { halign: 'center' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'center' },
          9: { halign: 'center' }
        }
      });

      // Summary Section
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFillColor(245, 245, 245);
      doc.rect(15, finalY, pageWidth - 30, 30, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, finalY, pageWidth - 30, 30, 'S');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('SUMMARY', 20, finalY + 8);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Calculations
      const totalCount = data.length;
      const activeCount = data.filter(i => i.status?.toLowerCase() === 'active').length;
      const expiredCount = data.filter(i => i.status?.toLowerCase() === 'expired' || i.status?.toLowerCase() === 'closed').length;
      const totalAmount = data.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0);
      const totalFinance = data.reduce((sum, i) => sum + parseFloat(i.pledge_data?.total_payment || i.pledge_data?.accounts_amount || 0), 0);
      const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

      // Layout columns
      doc.text(`Total Quotations: ${totalCount}`, 20, finalY + 15);
      doc.text(`Active: ${activeCount}`, 20, finalY + 22);

      doc.text(`Expired: ${expiredCount}`, 80, finalY + 15);

      doc.text(`Total Amount: Rs.${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 140, finalY + 15);
      doc.text(`Total Finance: Rs.${totalFinance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 140, finalY + 22);

      doc.text(`Average Amount: Rs.${avgAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 220, finalY + 15);

      // Footer
      const footerY = doc.internal.pageSize.height - 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by: Pledge Quotation Management System', 15, footerY);
      doc.text(`${moment().format('D/M/YYYY, h:mm:ss A')}`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Records: ${totalCount}`, pageWidth - 40, footerY);
      doc.text(`Page 1 of 1`, pageWidth - 15, footerY, { align: 'right' });

      doc.save(`Pledge_Quotations_Report_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Pledge Quotations report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateStockReportPDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('STOCK REPORT', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Date Range: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Table Data
      const tableRows = data.map((item) => [
        item.description,
        item.opening,
        item.purchase,
        item.sales,
        item.closing
      ]);

      // Calculate Totals
      const totalOpening = data.reduce((sum, i) => sum + (parseFloat(i.opening) || 0), 0).toFixed(3);
      const totalPurchase = data.reduce((sum, i) => sum + (parseFloat(i.purchase) || 0), 0).toFixed(3);
      const totalSales = data.reduce((sum, i) => sum + (parseFloat(i.sales) || 0), 0).toFixed(3);
      const totalClosing = data.reduce((sum, i) => sum + (parseFloat(i.closing) || 0), 0).toFixed(3);

      tableRows.push([
        { content: 'Total', styles: { fontStyle: 'bold' } },
        { content: totalOpening, styles: { fontStyle: 'bold' } },
        { content: totalPurchase, styles: { fontStyle: 'bold' } },
        { content: totalSales, styles: { fontStyle: 'bold' } },
        { content: totalClosing, styles: { fontStyle: 'bold' } }
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Description', 'Opening', 'Purchase', 'Sales', 'Closing']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 10, cellPadding: 5, halign: 'center' },
        columnStyles: {
          0: { halign: 'left' }
        }
      });

      doc.save(`Stock_Report_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Stock report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateSmithPaymentPDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('SMITH PAYMENT REPORT', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Date Range: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Table Data
      const tableRows = [];
      data.forEach((item) => {
        // Debit entry (Smith)
        tableRows.push([
          moment(item.date).format('DD/MM/YYYY'),
          item.smith_name,
          parseFloat(item.amount).toFixed(2),
          'D',
          item.narration || '-'
        ]);
        // Credit entry (Cash/Mode)
        tableRows.push([
          moment(item.date).format('DD/MM/YYYY'),
          item.payment_mode || 'Cash',
          parseFloat(item.amount || 0).toFixed(2),
          'C',
          item.narration || '-'
        ]);
      });

      if (tableRows.length === 0) {
        message.warning('No data found for the selected date range');
        return;
      }

      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Particulars', 'Amount', 'Type', 'Narration']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3, halign: 'left' },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'center' }
        }
      });

      doc.save(`Smith_Payment_Report_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Smith payment report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateDayBookPDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('DAY BOOK', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Period: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Table Data
      const tableRows = [];
      
      // Add Initial Opening Balance Row
      tableRows.push([
        dateRange ? dateRange[0].format('DD/MM/YYYY') : '-',
        { content: 'Opening Balance (Accumulated)', styles: { fontStyle: 'bold' } },
        data.initialOpeningBalance > 0 ? parseFloat(data.initialOpeningBalance).toFixed(2) : '-',
        data.initialOpeningBalance < 0 ? Math.abs(parseFloat(data.initialOpeningBalance)).toFixed(2) : '-',
      ]);

      // Add Transactions
      if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(t => {
          tableRows.push([
            moment(t.date).format('DD/MM/YYYY'),
            t.description,
            t.debit > 0 ? parseFloat(t.debit).toFixed(2) : '-',
            t.credit > 0 ? parseFloat(t.credit).toFixed(2) : '-',
          ]);
        });
      }

      // Calculate Totals
      const totalDebit = (data.transactions || []).reduce((s, t) => s + (parseFloat(t.debit) || 0), data.initialOpeningBalance > 0 ? data.initialOpeningBalance : 0);
      const totalCredit = (data.transactions || []).reduce((s, t) => s + (parseFloat(t.credit) || 0), data.initialOpeningBalance < 0 ? Math.abs(data.initialOpeningBalance) : 0);
      const balance = totalDebit - totalCredit;

      tableRows.push([
        '',
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: totalDebit.toFixed(2), styles: { fontStyle: 'bold' } },
        { content: totalCredit.toFixed(2), styles: { fontStyle: 'bold' } },
      ]);

      tableRows.push([
        '',
        { content: 'BALANCE', styles: { fontStyle: 'bold', textColor: [255, 0, 0] } },
        { content: balance.toFixed(2), styles: { fontStyle: 'bold', textColor: [255, 0, 0] } },
        '',
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Description', 'Debit', 'Credit']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3, halign: 'left' },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      doc.save(`Day_Book_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Day Book generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateLedgerPDF = (data, accountName, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCOUNT LEDGER', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(14);
      doc.text(accountName || 'All Accounts', pageWidth / 2, 22, { align: 'center' });

      const dateText = dateRange ? `Period: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(dateText, pageWidth - 15, 32, { align: 'right' });

      // Table Data
      const tableRows = [];
      
      // Add Initial Opening Balance Row
      tableRows.push([
        dateRange ? dateRange[0].format('DD/MM/YYYY') : '-',
        { content: 'Opening Balance (Accumulated)', styles: { fontStyle: 'bold' } },
        data.initialOpeningBalance > 0 ? parseFloat(data.initialOpeningBalance).toFixed(2) : '-',
        data.initialOpeningBalance < 0 ? Math.abs(parseFloat(data.initialOpeningBalance)).toFixed(2) : '-',
      ]);

      // Add Transactions
      if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(t => {
          tableRows.push([
            moment(t.date).format('DD/MM/YYYY'),
            t.description,
            t.debit > 0 ? parseFloat(t.debit).toFixed(2) : '-',
            t.credit > 0 ? parseFloat(t.credit).toFixed(2) : '-',
          ]);
        });
      }

      // Calculate Totals
      const totalDebit = (data.transactions || []).reduce((s, t) => s + (parseFloat(t.debit) || 0), data.initialOpeningBalance > 0 ? data.initialOpeningBalance : 0);
      const totalCredit = (data.transactions || []).reduce((s, t) => s + (parseFloat(t.credit) || 0), data.initialOpeningBalance < 0 ? Math.abs(data.initialOpeningBalance) : 0);
      const balance = totalDebit - totalCredit;

      tableRows.push([
        '',
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: totalDebit.toFixed(2), styles: { fontStyle: 'bold' } },
        { content: totalCredit.toFixed(2), styles: { fontStyle: 'bold' } },
      ]);

      tableRows.push([
        '',
        { content: 'BALANCE', styles: { fontStyle: 'bold', textColor: [255, 0, 0] } },
        { content: balance.toFixed(2), styles: { fontStyle: 'bold', textColor: [255, 0, 0] } },
        '',
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Date', 'Description', 'Debit', 'Credit']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3, halign: 'left' },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      doc.save(`Ledger_${accountName}_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Ledger report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateTrialBalancePDF = (data, filterType, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('TRIAL BALANCE', pageWidth / 2, 15, { align: 'center' });

      const dateText = filterType === 'range' && dateRange 
        ? `Period: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` 
        : `As on Date: ${dateRange ? dateRange.format('DD/MM/YYYY') : moment().format('DD/MM/YYYY')}`;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Prepare Table Data
      const tableRows = [];
      let grandTotalDebit = 0;
      let grandTotalCredit = 0;

      Object.keys(data).forEach(groupName => {
        // Group Header
        tableRows.push([
          { content: groupName, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
        ]);

        data[groupName].forEach(account => {
          const debit = parseFloat(account.debit) || 0;
          const credit = parseFloat(account.credit) || 0;
          
          grandTotalDebit += debit;
          grandTotalCredit += credit;

          tableRows.push([
            `    ${account.head_name}`,
            debit > 0 ? debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-',
            credit > 0 ? credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'
          ]);
        });
      });

      // Grand Total Row
      tableRows.push([
        { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [212, 175, 55], textColor: [255, 255, 255] } },
        { content: grandTotalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { fontStyle: 'bold', fillColor: [212, 175, 55], textColor: [255, 255, 255], halign: 'right' } },
        { content: grandTotalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), styles: { fontStyle: 'bold', fillColor: [212, 175, 55], textColor: [255, 255, 255], halign: 'right' } }
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Description', 'Debit', 'Credit']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          1: { halign: 'right', width: 40 },
          2: { halign: 'right', width: 40 }
        }
      });

      // Footer Note
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      if (Math.abs(grandTotalDebit - grandTotalCredit) < 0.01) {
        doc.text('Both Totals are equal.', pageWidth / 2, finalY, { align: 'center' });
      } else {
        doc.text(`Difference: ${(grandTotalDebit - grandTotalCredit).toFixed(2)}`, pageWidth / 2, finalY, { align: 'center' });
      }

      doc.save(`Trial_Balance_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Trial Balance generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const generateProfitAndLossPDF = (data, dateRange) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;

      // Header - Dark Blue Block with White Text
      doc.setFillColor(44, 62, 80); // Dark Blue background
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255); // White text
      doc.setFont('helvetica', 'bold');
      doc.text('PROFIT AND LOSS', pageWidth / 2, 15, { align: 'center' });

      const dateText = dateRange ? `Period: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'Full Report';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, pageWidth / 2, 22, { align: 'center' });

      // Build Items for Trading Account
      const leftItems = [];
      const rightItems = [];

      // Left Side (Debit)
      leftItems.push({ title: 'Opening Balance', amount: data.openingStocks?.reduce((s, i) => s + i.amount, 0) || 0, details: data.openingStocks, isHeader: true });
      leftItems.push({ title: 'Purchase', amount: data.purchases?.reduce((s, i) => s + i.amount, 0) || 0, details: data.purchases, isHeader: true });
      leftItems.push({ title: 'Direct Expenses', amount: data.directExpenses?.reduce((s, i) => s + i.amount, 0) || 0, details: data.directExpenses, isHeader: true });

      // Right Side (Credit)
      rightItems.push({ title: 'Sales', amount: data.sales?.reduce((s, i) => s + i.amount, 0) || 0, details: data.sales, isHeader: true });
      rightItems.push({ title: 'Closing Balance', amount: data.closingStocks?.reduce((s, i) => s + i.amount, 0) || 0, details: data.closingStocks, isHeader: true });

      // Gross Profit Calculation
      const creditTotalGP = rightItems.reduce((s, i) => s + (i.amount || 0), 0);
      const debitTotalGP = leftItems.reduce((s, i) => s + (i.amount || 0), 0);
      const grossProfit = creditTotalGP - debitTotalGP;

      if (grossProfit >= 0) {
        leftItems.push({ title: 'Gross Profit', amount: grossProfit, isHeader: true });
      } else {
        rightItems.push({ title: 'Gross Loss', amount: Math.abs(grossProfit), isHeader: true });
      }

      const tradingTotal = Math.max(creditTotalGP, debitTotalGP);

      // Indirect section
      const leftIndirect = [];
      const rightIndirect = [];

      if (grossProfit >= 0) {
        rightIndirect.push({ title: 'Gross Profit c/f', amount: grossProfit, isHeader: true });
      } else {
        leftIndirect.push({ title: 'Gross Loss c/f', amount: Math.abs(grossProfit), isHeader: true });
      }

      leftIndirect.push({ title: 'Indirect Expenses', amount: data.indirectExpenses?.reduce((s, i) => s + i.amount, 0) || 0, details: data.indirectExpenses, isHeader: true });
      rightIndirect.push({ title: 'Other Income', amount: data.otherIncome?.reduce((s, i) => s + i.amount, 0) || 0, details: data.otherIncome, isHeader: true });

      const creditTotalNP = rightIndirect.reduce((s, i) => s + (i.amount || 0), 0);
      const debitTotalNP = leftIndirect.reduce((s, i) => s + (i.amount || 0), 0);
      const netProfit = creditTotalNP - debitTotalNP;

      if (netProfit >= 0) {
        leftIndirect.push({ title: 'Net Profit', amount: netProfit, isHeader: true });
      } else {
        rightIndirect.push({ title: 'Net Loss', amount: Math.abs(netProfit), isHeader: true });
      }

      const pnlTotal = Math.max(creditTotalNP, debitTotalNP);

      // Build Table Body
      const tableBody = [];
      
      const formatCurrency = (amt) => parseFloat(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

      const addTSection = (lItems, rItems) => {
        const maxRows = Math.max(lItems.length, rItems.length);
        
        // This is complex because each item can have multiple detail rows
        // We'll flatten them first
        const leftFlattened = [];
        lItems.forEach(item => {
            leftFlattened.push({ title: item.title, amount: item.amount, isHeader: true });
            if (item.details) {
                item.details.forEach(d => leftFlattened.push({ title: `    ${d.title}`, amount: d.amount }));
            }
        });

        const rightFlattened = [];
        rItems.forEach(item => {
            rightFlattened.push({ title: item.title, amount: item.amount, isHeader: true });
            if (item.details) {
                item.details.forEach(d => rightFlattened.push({ title: `    ${d.title}`, amount: d.amount }));
            }
        });

        const maxFlattened = Math.max(leftFlattened.length, rightFlattened.length);
        for (let i = 0; i < maxFlattened; i++) {
            const l = leftFlattened[i];
            const r = rightFlattened[i];
            tableBody.push([
                { content: l?.title || '', styles: { fontStyle: l?.isHeader ? 'bold' : 'normal' } },
                { content: l ? formatCurrency(l.amount) : '', styles: { halign: 'right', fontStyle: l?.isHeader ? 'bold' : 'normal' } },
                { content: r?.title || '', styles: { fontStyle: r?.isHeader ? 'bold' : 'normal' } },
                { content: r ? formatCurrency(r.amount) : '', styles: { halign: 'right', fontStyle: r?.isHeader ? 'bold' : 'normal' } }
            ]);
        }
      };

      // 1. Trading Account Section
      addTSection(leftItems, rightItems);
      
      // Total Row for Trading
      tableBody.push([
        { content: 'Total', styles: { fontStyle: 'bold', borderTop: [0, 0, 0] } },
        { content: formatCurrency(tradingTotal), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: 'Total', styles: { fontStyle: 'bold' } },
        { content: formatCurrency(tradingTotal), styles: { halign: 'right', fontStyle: 'bold' } }
      ]);

      tableBody.push([{ content: '', colSpan: 4, styles: { minHeight: 5 } }]); // Divider

      // 2. Profit and Loss Section
      addTSection(leftIndirect, rightIndirect);

      // Final Net Profit Total Row
      tableBody.push([
        { content: 'Net Profit', styles: { fontStyle: 'bold' } },
        { content: formatCurrency(pnlTotal), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '', styles: { borderTop: [0,0,0] } },
        { content: '', styles: { borderTop: [0,0,0] } }
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Debit', 'Amount', 'Credit', 'Amount']],
        body: tableBody,
        theme: 'plain', // Plain theme for manual control like the image
        headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [0, 0, 0], 
            fontStyle: 'bold', 
            halign: 'center',
            border: { bottom: 1, top: 1 } 
        },
        styles: { 
            fontSize: 11, 
            cellPadding: 2,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { width: 60 },
            1: { width: 35, halign: 'right' },
            2: { width: 60 },
            3: { width: 35, halign: 'right' }
        },
        didDrawCell: (data) => {
            // Draw a vertical line in the middle
            if (data.column.index === 1) {
                const x = data.cell.x + data.cell.width;
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);
                doc.line(x, data.cell.y, x, data.cell.y + data.cell.height);
            }
        }
      });

      doc.save(`Profit_and_Loss_${moment().format('YYYYMMDD')}.pdf`);
      message.success('Profit and Loss report generated successfully');
    } catch (error) {
      console.error('PDF error:', error);
      message.error('Failed to generate PDF');
    }
  };

  const handleExportPDF = async (record) => {
    const dates = rowDates[record.id];

    if (record.title === 'Purchase') {
      try {
        setLoading(true);
        const params = {
          page: 1,
          limit: 10000000,
        };

        if (dates) {
          params.start_date = dates[0].format('YYYY-MM-DD');
          params.end_date = dates[1].format('YYYY-MM-DD');
        }

        const response = await apiClient.get('/purchases', { params });

        console.log('API Response Structure:', response);

        let finalData = [];
        if (response && response.data && Array.isArray(response.data.purchases)) {
          finalData = response.data.purchases;
        } else if (response && Array.isArray(response.data)) {
          finalData = response.data;
        }

        if (finalData.length > 0) {
          // Add calculated totals if missing
          const processedData = finalData.map(item => {
            const total_gross = item.products ? item.products.reduce((s, p) => s + parseFloat(p.gross_weight || 0), 0) : (item.total_gross_weight || 0);
            const total_net = item.products ? item.products.reduce((s, p) => s + parseFloat(p.net_weight || 0), 0) : (item.total_net_weight || 0);
            return {
              ...item,
              total_gross_weight: total_gross,
              total_net_weight: total_net
            };
          });
          generatePurchasePDF(processedData, dates);
        } else {
          message.error('No data found for the selected date range');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch purchase data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Pledge Quotation') {
      try {
        setLoading(true);
        const params = {
          page: 1,
          limit: dates ? 10 : 100000,
        };

        if (dates) {
          params.start_date = dates[0].format('YYYY-MM-DD');
          params.end_date = dates[1].format('YYYY-MM-DD');
        }

        const response = await apiClient.get('/pledge_quotations/final_quotation', { params });
        console.log('Pledge API Response:', response);

        let finalData = [];
        // Extracting based on your specific response structure
        if (response && response.data && Array.isArray(response.data.quotations)) {
          finalData = response.data.quotations;
        } else if (response && response.data && Array.isArray(response.data.pledge_quotations)) {
          finalData = response.data.pledge_quotations;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          finalData = response.data.data;
        } else if (response && Array.isArray(response.data)) {
          finalData = response.data;
        }

        if (finalData.length > 0) {
          generatePledgePDF(finalData, dates);
        } else {
          message.error('No data found for the selected date range');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch pledge quotations');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Sales') {
      try {
        setLoading(true);
        const params = {
          page: 1,
          limit: 100000,
          isSales: true,
        };

        if (dates) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }

        const response = await apiClient.get('/melting_purchase/create_melts_receipt', { params });
        console.log('Sales API Response:', response);

        let finalData = [];
        if (response && response.data && Array.isArray(response.data.purchases)) {
          finalData = response.data.purchases;
        } else if (response && Array.isArray(response.data)) {
          finalData = response.data;
        }

        if (finalData.length > 0) {
          generateSalesPDF(finalData, dates);
        } else {
          message.error('No sales data found for the selected date range');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch sales data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Stock Report') {
      try {
        setLoading(true);
        const params = {};
        if (dates) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }
        const response = await apiClient.get('/reports/stock-report', { params });
        if (response.success) {
          generateStockReportPDF(response.data, dates);
        } else {
          message.error('Failed to fetch stock data');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Smith Payment Report') {
      try {
        setLoading(true);
        const params = {};
        if (dates) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }
        const response = await apiClient.get('/reports/smith-payment-report', { params });
        if (response.success) {
          generateSmithPaymentPDF(response.data, dates);
        } else {
          message.error('Failed to fetch payment data');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch payment data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Day Book') {
      try {
        setLoading(true);
        const params = {};
        if (dates) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }
        const response = await apiClient.get('/reports/day-book-report', { params });
        if (response && response.success) {
          generateDayBookPDF(response.data, dates);
        } else {
          message.error('Failed to fetch day book data');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch day book data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Trial Balance') {
      try {
        setLoading(true);
        const filterType = rowTrialBalanceTypes[record.id] || 'asOnDate';
        const dates = rowDates[record.id];
        const params = {};

        if (filterType === 'range' && dates) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        } else if (filterType === 'asOnDate' && dates) {
          params.endDate = dates.format('YYYY-MM-DD');
        }

        const response = await apiClient.get('/reports/trial-balance', { params });
        if (response && response.success) {
          generateTrialBalancePDF(response.data, filterType, dates);
        } else {
          message.error('Failed to fetch trial balance data');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch trial balance data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Ledger') {
      const selectedAccount = rowAccountHeads[record.id];
      const dates = rowDates[record.id];

      if (!selectedAccount) {
        message.warning('Please select an account head first');
        return;
      }

      if (!dates) {
        message.warning('Please select a date range');
        return;
      }

      try {
        setLoading(true);
        const params = {
          accountHead: selectedAccount
        };
        params.startDate = dates[0].format('YYYY-MM-DD');
        params.endDate = dates[1].format('YYYY-MM-DD');
        
        const response = await apiClient.get('/reports/ledger-report', { params });
        if (response && response.success) {
          generateLedgerPDF(response.data, selectedAccount, dates);
        } else {
          message.error('Failed to fetch ledger data');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch ledger data');
      } finally {
        setLoading(false);
      }
    } else if (record.title === 'Profit and Loss') {
      try {
        setLoading(true);
        const params = {};
        if (dates) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }
        const response = await apiClient.get('/reports/profit-and-loss', { params });
        if (response && response.data && response.data.success) {
            generateProfitAndLossPDF(response.data.data, dates);
        } else if (response && response.data) {
            generateProfitAndLossPDF(response.data, dates);
        } else {
          message.error('Failed to fetch profit and loss data');
        }
      } catch (error) {
        console.error('API Error:', error);
        message.error('Failed to fetch profit and loss data');
      } finally {
        setLoading(false);
      }
    } else {
      message.info(`${record.title} export is coming soon`);
    }
  };


  const columns = [
    {
      title: 's.no',
      key: 'sno',
      render: (text, record, index) => index + 1,
      width: 80,
      align: 'center',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      align: 'center',
      render: (text) => <Tag color="gold" style={{ fontWeight: '600', fontSize: '13px', background: '#fffbe6', border: '1px solid #ffe58f', color: '#d4a017' }}>{text || 'N/A'}</Tag>,
    },
    {
      title: 'Date',
      key: 'date',
      align: 'center',
      render: (text, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {record.title === 'Ledger' && !rowAccountHeads[record.id] ? (
            <Select
              placeholder="Select Account Head"
              style={{ width: '100%', maxWidth: '280px' }}
              onChange={(value) => setRowAccountHeads({ ...rowAccountHeads, [record.id]: value })}
              showSearch
              optionFilterProp="children"
              className="premium-select"
            >
              {accountHeads.map(head => (
                <Option key={head.id} value={head.head_name}>{head.head_name}</Option>
              ))}
            </Select>
          ) : record.title === 'Trial Balance' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => {
                  setRowTrialBalanceTypes({ ...rowTrialBalanceTypes, [record.id]: 'asOnDate' });
                  setRowDates({ ...rowDates, [record.id]: null });
                }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #c99918', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(rowTrialBalanceTypes[record.id] || 'asOnDate') === 'asOnDate' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c99918' }} />}
                  </div>
                  <span style={{ fontSize: '12px' }}>As on date</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => {
                  setRowTrialBalanceTypes({ ...rowTrialBalanceTypes, [record.id]: 'range' });
                  setRowDates({ ...rowDates, [record.id]: null });
                }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #c99918', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {rowTrialBalanceTypes[record.id] === 'range' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#c99918' }} />}
                  </div>
                  <span style={{ fontSize: '12px' }}>From to date</span>
                </div>
              </div>
              
              {rowTrialBalanceTypes[record.id] === 'range' ? (
                <RangePicker
                  size="middle"
                  onChange={(values) => setRowDates({ ...rowDates, [record.id]: values })}
                  value={rowDates[record.id]}
                  format="DD-MM-YYYY"
                  placeholder={['Start Date', 'End Date']}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              ) : (
                <DatePicker
                  size="middle"
                  onChange={(value) => setRowDates({ ...rowDates, [record.id]: value })}
                  value={rowDates[record.id]}
                  format="DD-MM-YYYY"
                  placeholder="Select Date"
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '280px', gap: '4px' }}>
              <RangePicker
                size="middle"
                onChange={(values) => setRowDates({ ...rowDates, [record.id]: values })}
                value={rowDates[record.id]}
                format="DD-MM-YYYY"
                placeholder={['Start Date', 'End Date']}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #d9d9d9', transition: 'all 0.3s' }}
                onClick={(e) => e.stopPropagation()}
              />
              {record.title === 'Ledger' && rowAccountHeads[record.id] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#c99918', fontWeight: '600' }}>
                    A/C: {rowAccountHeads[record.id]}
                  </span>
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    icon={<CloseCircleOutlined style={{ fontSize: '12px' }} />}
                    style={{ fontSize: '11px', padding: 0, height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      const newAccountHeads = { ...rowAccountHeads };
                      delete newAccountHeads[record.id];
                      setRowAccountHeads(newAccountHeads);
                      
                      // Also clear dates for a full reset
                      const newDates = { ...rowDates };
                      delete newDates[record.id];
                      setRowDates(newDates);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      align: 'center',
      render: (text, record) => (
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          style={{
            backgroundColor: '#52c41a', // Green background like your screenshot
            borderColor: '#52c41a',
            borderRadius: '6px',
            padding: '4px 20px',
            height: '35px',
            fontWeight: '600',
            width: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onClick={() => handleExportPDF(record)}
          loading={loading && (record.title === 'Purchase' || record.title === 'Pledge Quotation' || record.title === 'Ledger' || record.title === 'Trial Balance')}
        >
          Export
        </Button>
      ),
    },
  ];

  return (
    <div className="reports-container" style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Card
        bordered={false}
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Title level={3} style={{ margin: 0, color: roots.gold[800], fontWeight: '700' }}>Report</Title>
              <Tag color="gold" style={{ borderRadius: '10px', padding: '0 10px', fontWeight: '600' }}>{purchaseList.length} total</Tag>
            </div>

            <Space size="middle" wrap>
              <Input
                placeholder="Search Title"
                prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 220, borderRadius: '8px', borderColor: '#d9d9d9', transition: 'all 0.3s' }}
                allowClear
              />
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={purchaseList}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ marginTop: '5px' }}
          className="premium-table"
        />
      </Card>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .premium-table .ant-table-thead > tr > th {
          background-color: #c99918 !important; /* Gold header background */
          color: #ffffff !important; /* White text for header */
          font-weight: 600 !important;
          text-transform: capitalize !important;
          font-size: 13px !important;
          letter-spacing: 0.3px !important;
          border-bottom: none !important;
          height: 45px !important;
          padding: 10px 16px !important;
          position: relative;
        }
        .premium-table .ant-table-thead > tr > th:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 25%;
          height: 50%;
          width: 1px;
          background-color: rgba(255, 255, 255, 0.3);
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          font-size: 14px !important;
          color: #424242 !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background-color: #fdfaf0 !important;
        }
        .ant-btn-primary:hover {
          background-color: #389e0d !important;
          border-color: #389e0d !important;
          opacity: 0.9;
        }
        .ant-picker-range:hover, .ant-picker-range-focused,
        .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper-focused {
          border-color: #c99918 !important;
          box-shadow: 0 0 0 2px rgba(201, 153, 24, 0.2) !important;
        }
        .ant-tag-gold {
          background-color: #fffbe6;
          border-color: #ffe58f;
          color: #d4a017;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Reports;