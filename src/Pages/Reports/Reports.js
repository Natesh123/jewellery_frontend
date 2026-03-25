import React, { useState } from 'react';
import { Card, Table, Typography, Space, Button, Tag, DatePicker, Input, message } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import { roots } from '../../colorConstant';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../../api/apiConfig/apiClient';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Static Data for the table
const STATIC_PURCHASES = [
  { id: 1, title: 'Purchase' },
  { id: 2, title: 'Pledge Quotation' },
  { id: 3, title: 'Sales' }
];

const Reports = () => {
  const [purchaseList, setPurchaseList] = useState(STATIC_PURCHASES);
  const [rowDates, setRowDates] = useState({}); // To store dates per row ID
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RangePicker
            size="middle"
            onChange={(values) => setRowDates({ ...rowDates, [record.id]: values })}
            value={rowDates[record.id]}
            format="DD-MM-YYYY"
            placeholder={['Start Date', 'End Date']}
            style={{ width: '100%', maxWidth: '280px', borderRadius: '8px', border: '1px solid #d9d9d9', transition: 'all 0.3s' }}
            onClick={(e) => e.stopPropagation()}
          />
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
          loading={loading && (record.title === 'Purchase' || record.title === 'Pledge Quotation')}
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