import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define status mappings for better display
const statusMappings = {
  '1': 'Collected',
  '0': 'Not Collected',
  '2': 'Pending',
  'null': 'Pending',
  null: 'Pending',
};

const approvalMappings = {
  '1': 'Not Assigned',
  '2': 'Assigned',
  '3': 'Success',
  '4': 'Rejected',
  '5': 'Processing',
};

const acceptStatusMappings = {
  '1': 'Accepted',
  '0': 'Not Accepted',
  null: 'Pending',
};

export const generatePledgesPDF = async (
  pledges,
  filters,
  fileName = 'pledges_report.pdf'
) => {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Pledges Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 40;

  // Add filters information
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  
  const filterTexts = [];
  if (filters.dateRange && filters.dateRange.length === 2) {
    filterTexts.push(`Date Range: ${filters.dateRange[0]} to ${filters.dateRange[1]}`);
  }
  if (filters.search) filterTexts.push(`Search: ${filters.search}`);
  if (filters.metal) filterTexts.push(`Metal: ${filters.metal}`);
  if (filters.status) filterTexts.push(`Status: ${filters.status}`);
  
  if (filterTexts.length > 0) {
    doc.text(`Filters Applied: ${filterTexts.join(', ')}`, margin, yPos);
    yPos += 30;
  }

  // Add generated date
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPos);
  yPos += 40;

  // Add summary statistics
  const totalPledges = pledges.length;
  const totalAmount = pledges.reduce((sum, pledge) => sum + (parseFloat(pledge.amount) || 0), 0);
  const totalPledgeAmount = pledges.reduce((sum, pledge) => sum + (parseFloat(pledge.pledge_amount) || 0), 0);

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Summary', margin, yPos);
  yPos += 25;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Pledges: ${totalPledges}`, margin, yPos);
  doc.text(`Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 200, yPos);
  doc.text(`Total Pledge Amount: ₹${totalPledgeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 400, yPos);
  yPos += 30;

  // Create table headers
  const headers = [
    { header: 'Pledge ID', width: 80 },
    { header: 'Date', width: 70 },
    { header: 'Customer', width: 100 },
    { header: 'Metal', width: 60 },
    { header: 'Weight (g)', width: 80 },
    { header: 'Amount (₹)', width: 90 },
    { header: 'Pledge (₹)', width: 90 },
    { header: 'Status', width: 70 },
    { header: 'Created By', width: 80 },
  ];

  // Draw table header
  doc.setFillColor(245, 158, 11); // Gold color for header
  doc.rect(margin, yPos, contentWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  let xPos = margin;
  headers.forEach((col, index) => {
    doc.text(col.header, xPos + 5, yPos + 17);
    if (index < headers.length - 1) {
      // Draw vertical line
      doc.setDrawColor(200, 200, 200);
      doc.line(xPos + col.width, yPos, xPos + col.width, yPos + 25);
    }
    xPos += col.width;
  });

  yPos += 25;

  // Add table data
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  pledges.forEach((pledge, rowIndex) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      yPos = margin;
      
      // Redraw headers on new page
      doc.setFillColor(245, 158, 11);
      doc.rect(margin, yPos, contentWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      xPos = margin;
      headers.forEach((col, index) => {
        doc.text(col.header, xPos + 5, yPos + 17);
        xPos += col.width;
      });
      
      yPos += 25;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, yPos, contentWidth, 25, 'F');

    // Draw row data
    xPos = margin;
    
    // Pledge ID
    doc.text(pledge.pledge_id || 'N/A', xPos + 5, yPos + 17);
    xPos += headers[0].width;
    
    // Date
    doc.text(pledge.date || new Date(pledge.created_at).toLocaleDateString(), xPos + 5, yPos + 17);
    xPos += headers[1].width;
    
    // Customer
    const customerText = pledge.customer_name || pledge.customer_data?.customer_name || 'N/A';
    doc.text(customerText.substring(0, 15) + (customerText.length > 15 ? '...' : ''), xPos + 5, yPos + 17);
    xPos += headers[2].width;
    
    // Metal
    const metal = Array.isArray(pledge.product_details) 
      ? pledge.product_details[0]?.metal || 'Multiple'
      : 'N/A';
    doc.text(typeof metal === 'object' ? 'Gold' : metal, xPos + 5, yPos + 17);
    xPos += headers[3].width;
    
    // Weight
    const weight = parseFloat(pledge.net_weight || 0).toFixed(3);
    doc.text(weight, xPos + 5, yPos + 17);
    xPos += headers[4].width;
    
    // Amount
    const amount = parseFloat(pledge.amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    doc.text(`₹${amount}`, xPos + 5, yPos + 17);
    xPos += headers[5].width;
    
    // Pledge Amount
    const pledgeAmount = parseFloat(pledge.pledge_amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    doc.text(`₹${pledgeAmount}`, xPos + 5, yPos + 17);
    xPos += headers[6].width;
    
    // Status
    const status = approvalMappings[pledge.approval] || 'Unknown';
    doc.text(status, xPos + 5, yPos + 17);
    xPos += headers[7].width;
    
    // Created By
    const createdBy = pledge.created_user?.username || 'N/A';
    doc.text(createdBy, xPos + 5, yPos + 17);
    
    yPos += 25;
    
    // Draw horizontal line between rows
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, margin + contentWidth, yPos);
  });

  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 100, doc.internal.pageSize.getHeight() - 20);
  }

  // Save the PDF
  doc.save(fileName);
};

export const generateDetailedPledgePDF = async (pledge) => {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let yPos = margin;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(245, 158, 11); // Gold color
  doc.text('PLEDGE DETAILS', pageWidth / 2, yPos, { align: 'center' });
  yPos += 50;

  // Pledge ID
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(`Pledge ID: ${pledge.pledge_id || 'N/A'}`, margin, yPos);
  yPos += 30;

  // Customer Information
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Customer Information', margin, yPos);
  yPos += 25;

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  const customer = pledge.customer_data || {};
  
  const customerInfo = [
    `Name: ${customer.customer_name || 'N/A'}`,
    `Customer ID: ${customer.customer_id || 'N/A'}`,
    `Aadhar: ${customer.aadhar_no || 'N/A'}`,
    `PAN: ${customer.pan_no || 'N/A'}`,
    `Phone: ${customer.phoneno || pledge.phone_number || 'N/A'}`,
    `Address: ${customer.address_1 || ''} ${customer.address_2 || ''}, ${customer.city || ''}`,
    `State: ${customer.state || ''}, Pincode: ${customer.pincode || ''}`
  ];

  customerInfo.forEach(info => {
    doc.text(info, margin, yPos);
    yPos += 20;
  });

  yPos += 10;

  // Product Details
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Product Details', margin, yPos);
  yPos += 25;

  if (Array.isArray(pledge.product_details) && pledge.product_details.length > 0) {
    const productHeaders = ['Metal', 'Product', 'Sub Product', 'Gross Wt (g)', 'Net Wt (g)', 'Rate (₹/g)', 'Amount (₹)'];
    const colWidths = [60, 70, 90, 80, 80, 80, 90];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Draw table header
    doc.setFillColor(245, 158, 11);
    doc.rect(margin, yPos, tableWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    
    let xPos = margin;
    productHeaders.forEach((header, index) => {
      doc.text(header, xPos + 5, yPos + 17);
      xPos += colWidths[index];
    });

    yPos += 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    pledge.product_details.forEach((product, index) => {
      if (yPos > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        yPos = margin;
      }

      xPos = margin;
      const rowData = [
        typeof product.metal === 'object' ? product.metal.name || 'Gold' : 'Gold',
        typeof product.product === 'object' ? product.product.name || 'N/A' : 'N/A',
        product.sub_product || 'N/A',
        parseFloat(product.gross_weight || 0).toFixed(3),
        parseFloat(product.net_weight || 0).toFixed(3),
        `₹${parseFloat(product.rate || 0).toFixed(2)}`,
        `₹${parseFloat(product.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      ];

      rowData.forEach((data, colIndex) => {
        doc.text(data, xPos + 5, yPos + 17);
        xPos += colWidths[colIndex];
      });

      yPos += 25;
    });
  } else {
    doc.text('No product details available', margin, yPos);
    yPos += 20;
  }

  yPos += 20;

  // Financial Summary
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Financial Summary', margin, yPos);
  yPos += 25;

  doc.setFontSize(12);
  const financialInfo = [
    `Total Amount: ₹${parseFloat(pledge.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    `Pledge Amount: ₹${parseFloat(pledge.pledge_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    `Interest Rate: ${parseFloat(pledge.interest_rate || 0).toFixed(2)}%`,
    `Current Interest: ₹${parseFloat(pledge.current_interest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    `Total Payment: ₹${parseFloat(pledge.total_payment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  ];

  financialInfo.forEach(info => {
    doc.text(info, margin, yPos);
    yPos += 20;
  });

  yPos += 20;

  // Status Information
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Status Information', margin, yPos);
  yPos += 25;

  doc.setFontSize(12);
  const statusInfo = [
    `Overall Status: ${approvalMappings[pledge.approval] || 'Unknown'}`,
    `Accounts Status: ${statusMappings[pledge.accounts_status] || 'Pending'}`,
    `Bank Collection: ${statusMappings[pledge.bank_collection_status] || 'Pending'}`,
    `Finance Status: ${statusMappings[pledge.finance_status] || 'Pending'}`,
    `Gold Collection: ${statusMappings[pledge.gold_collect_status] || 'Pending'}`
  ];

  statusInfo.forEach(info => {
    doc.text(info, margin, yPos);
    yPos += 20;
  });

  // Add footer with date
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 
    pageWidth / 2, doc.internal.pageSize.getHeight() - 30, { align: 'center' });

  doc.save(`${pledge.pledge_id || 'pledge'}_details.pdf`);
};