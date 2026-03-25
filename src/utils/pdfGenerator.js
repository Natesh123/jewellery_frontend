import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
export const generateRegionalPurchasePDF = (tt,data, filters, metals) => {
    console.log(data)
    // Create PDF in landscape orientation
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    console.log('autoTable available:', typeof autoTable);

    // Set primary colors
    const primaryColor = [66, 139, 202]; // Blue
    const secondaryColor = [255, 193, 7]; // Gold
    const darkColor = [51, 51, 51]; // Dark gray

    // Add header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 20, 'F'); // Full width header

    // Company title
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AMAYA GOLD POINT', 148, 12, { align: 'center' });

    // Report title  REGIONAL PURCHASE REPORT
    doc.setFontSize(14);
    doc.text(tt, 148, 25, { align: 'center' });

    // Filters information
    doc.setFontSize(8);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');

    let filterText = 'All Regional Purchases';
    if (filters.startDate && filters.endDate) {
        filterText = `Date Range: ${filters.startDate} to ${filters.endDate}`;
    }
    if (filters.search) {
        filterText += ` | Search: ${filters.search}`;
    }
    if (filters.metal) {
        const metalName = metals.find(m => m.id === filters.metal)?.metalname || filters.metal;
        filterText += ` | Metal: ${metalName}`;
    }
    if (filters.status) {
        filterText += ` | Status: ${filters.status === "1" ? "Sent" : "Not Sent"}`;
    }

    doc.text(filterText, 15, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 40);
    doc.text(`Total Records: ${data.length}`, 250, 40, { align: 'right' });

    // Prepare table data
    const tableData = data.map((purchase, index) => [
        index + 1,
        purchase.purchase_id || 'N/A',
        purchase.quotation_id || 'N/A',
        purchase.customer_name || 'N/A',
        purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'N/A',
        purchase.products?.[0]?.metal || 'N/A',
        purchase.products?.[0]?.product || 'N/A',
        purchase.products?.[0]?.gross_weight || '0.000',
        purchase.products?.[0]?.net_weight || '0.000',
        `Rs.${purchase.products?.[0]?.rate || '0.00'}`,
        `Rs.${purchase.total_amount || '0.00'}`,
        formatPaymentMethod(purchase.payment_method),
      
    ]);

    // AutoTable configuration for landscape
    autoTable(doc,
        {
            startY: 45,
            head: [[
                '#',
                'Purchase ID',
                'Quotation ID',
                'Customer Name',
                'Date',
                'Metal',
                'Product',
                'Gross Wt (g)',
                'Net Wt (g)',
                'Rate (Rs./g)',
                'Amount (Rs.)',
                'Payment Method',
                
            ]],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 6,
                cellPadding: 1.5,
                textColor: darkColor,
                font: 'helvetica'
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 7
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { top: 45 },
            tableWidth: 'wrap',
            columnStyles: {
                0: { cellWidth: 8 },  // #
                1: { cellWidth: 20 }, // Purchase ID
                2: { cellWidth: 20 }, // Quotation ID
                3: { cellWidth: 25 }, // Customer Name
                // 4: { cellWidth: 20 }, // Customer ID
                5: { cellWidth: 15 }, // Date
                6: { cellWidth: 15 }, // Metal
                7: { cellWidth: 20 }, // Product
                8: { cellWidth: 15 }, // Gross Weight
                9: { cellWidth: 35 }, // Net Weight
                10: { cellWidth: 35 }, // Rate
                11: { cellWidth: 30 }, // Amount
                12: { cellWidth: 20 }, // Payment Method
                
            },
            didDrawPage: function (data) {
                // Footer on each page
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text(
                    `Page ${doc.internal.getNumberOfPages()}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );

                // Report title on each page
                doc.setFontSize(10);
                doc.setTextColor(...darkColor);
                doc.text(
                    'Regional Purchase Report',
                    doc.internal.pageSize.width / 2,
                    30,
                    { align: 'center' }
                );
            }
        }
    );

    // Add summary section
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY < 180) { // Ensure there's space for summary
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('SUMMARY', 15, finalY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);

        const totalAmount = data.reduce((sum, purchase) => sum + (parseFloat(purchase.total_amount) || 0), 0);
        const sentCount = data.filter(p => p.regional_status === "1").length;
        const approvedCount = data.filter(p => p.accounts_status === "1").length;

        doc.text(`Total Purchases: ${data.length}`, 15, finalY + 8);
        doc.text(`Sent to Accounts: ${sentCount}`, 15, finalY + 16);
        doc.text(`Approved by Accounts: ${approvedCount}`, 15, finalY + 24);
        doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 200, finalY + 8, { align: 'right' });
        doc.text(`Average Amount: Rs.${(totalAmount / data.length).toFixed(2)}`, 200, finalY + 16, { align: 'right' });
    }

    return doc;
};

export const generateAccountsPurchasePDF = (tt,data, filters, metals) => {
    console.log(data)
    // Create PDF in landscape orientation
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    console.log('autoTable available:', typeof autoTable);

    // Set primary colors
    const primaryColor = [66, 139, 202]; // Blue
    const secondaryColor = [255, 193, 7]; // Gold
    const darkColor = [51, 51, 51]; // Dark gray

    // Add header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 20, 'F'); // Full width header

    // Company title
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AMAYA GOLD POINT', 148, 12, { align: 'center' });

    // Report title  REGIONAL PURCHASE REPORT
    doc.setFontSize(14);
    doc.text(tt, 148, 25, { align: 'center' });

    // Filters information
    doc.setFontSize(8);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');

    let filterText = 'All Regional Purchases';
    if (filters.startDate && filters.endDate) {
        filterText = `Date Range: ${filters.startDate} to ${filters.endDate}`;
    }
    if (filters.search) {
        filterText += ` | Search: ${filters.search}`;
    }
    if (filters.metal) {
        const metalName = metals.find(m => m.id === filters.metal)?.metalname || filters.metal;
        filterText += ` | Metal: ${metalName}`;
    }
    if (filters.status) {
        filterText += ` | Status: ${filters.status === "1" ? "Sent" : "Not Sent"}`;
    }

    doc.text(filterText, 15, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 40);
    doc.text(`Total Records: ${data.length}`, 250, 40, { align: 'right' });

    // Prepare table data
    const tableData = data.map((purchase, index) => [
        index + 1,
        purchase.purchase_id || 'N/A',
        purchase.quotation_id || 'N/A',
        purchase.customer_name || 'N/A',
        purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'N/A',
        purchase.products?.[0]?.metal || 'N/A',
        purchase.products?.[0]?.product || 'N/A',
        purchase.products?.[0]?.gross_weight || '0.000',
        purchase.products?.[0]?.net_weight || '0.000',
        `Rs.${purchase.products?.[0]?.rate || '0.00'}`,
        `Rs.${purchase.total_amount || '0.00'}`,
        formatPaymentMethod(purchase.payment_method),
      
    ]);

    // AutoTable configuration for landscape
    autoTable(doc,
        {
            startY: 45,
            head: [[
                '#',
                'Purchase ID',
                'Quotation ID',
                'Customer Name',
                'Date',
                'Metal',
                'Product',
                'Gross Wt (g)',
                'Net Wt (g)',
                'Rate (Rs./g)',
                'Amount (Rs.)',
                'Payment Method',
                
            ]],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 6,
                cellPadding: 1.5,
                textColor: darkColor,
                font: 'helvetica'
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 7
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            margin: { top: 45 },
            tableWidth: 'wrap',
            columnStyles: {
                0: { cellWidth: 8 },  // #
                1: { cellWidth: 20 }, // Purchase ID
                2: { cellWidth: 20 }, // Quotation ID
                3: { cellWidth: 25 }, // Customer Name
                // 4: { cellWidth: 20 }, // Customer ID
                5: { cellWidth: 15 }, // Date
                6: { cellWidth: 15 }, // Metal
                7: { cellWidth: 20 }, // Product
                8: { cellWidth: 15 }, // Gross Weight
                9: { cellWidth: 35 }, // Net Weight
                10: { cellWidth: 35 }, // Rate
                11: { cellWidth: 30 }, // Amount
                12: { cellWidth: 20 }, // Payment Method
                
            },
            didDrawPage: function (data) {
                // Footer on each page
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text(
                    `Page ${doc.internal.getNumberOfPages()}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );

                // Report title on each page
                doc.setFontSize(10);
                doc.setTextColor(...darkColor);
                doc.text(
                    'Regional Purchase Report',
                    doc.internal.pageSize.width / 2,
                    30,
                    { align: 'center' }
                );
            }
        }
    );

    // Add summary section
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY < 180) { // Ensure there's space for summary
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('SUMMARY', 15, finalY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);

        const totalAmount = data.reduce((sum, purchase) => sum + (parseFloat(purchase.total_amount) || 0), 0);
        const sentCount = data.filter(p => p.collected_status === "1").length;
        const approvedCount = data.filter(p => p.accounts_status === "1").length;

        doc.text(`Total Purchases: ${data.length}`, 15, finalY + 8);
        doc.text(`Sent to Accounts: ${sentCount}`, 15, finalY + 16);
        doc.text(`Approved by Accounts: ${approvedCount}`, 15, finalY + 24);
        doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 200, finalY + 8, { align: 'right' });
        doc.text(`Average Amount: Rs.${(totalAmount / data.length).toFixed(2)}`, 200, finalY + 16, { align: 'right' });
    }

    return doc;
};


export const generateDetailedPurchasePDF = (purchase, customer) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Colors
    const primaryColor = [66, 139, 202];
    const goldColor = [255, 193, 7];
    const darkColor = [51, 51, 51];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AMAYA GOLD POINT', 105, 15, { align: 'center' });

    doc.setFontSize(14);
    doc.text('PURCHASE RECEIPT', 105, 22, { align: 'center' });

    // Purchase Info
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');

    let yPosition = 40;

    doc.text(`Purchase ID: ${purchase.purchase_id}`, 20, yPosition);
    doc.text(`Date: ${new Date(purchase.created_at).toLocaleDateString()}`, 150, yPosition);
    yPosition += 8;

    doc.text(`Quotation ID: ${purchase.quotation_id || 'N/A'}`, 20, yPosition);
    yPosition += 15;

    // Customer Info
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION:', 20, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    if (customer) {
        doc.text(`Name: ${customer.customer_name}`, 20, yPosition);
        doc.text(`ID: ${customer.customer_id}`, 100, yPosition);
        yPosition += 5;

        doc.text(`Aadhar: ${customer.aadhar_no}`, 20, yPosition);
        doc.text(`PAN: ${customer.pan_no}`, 100, yPosition);
        yPosition += 5;

        doc.text(`Address: ${customer.address_1}, ${customer.city}, ${customer.state}`, 20, yPosition);
        yPosition += 5;

        doc.text(`Phone: ${customer.phoneno}`, 20, yPosition);
        yPosition += 10;
    }

    // Products Table
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT DETAILS:', 20, yPosition);
    yPosition += 6;

    const products = purchase.products || [];
    const tableData = products.map((product, index) => [
        index + 1,
        `${product.metal} ${product.product} (${product.sub_product})`,
        `${product.gross_weight || '0.000'}g`,
        `${product.dust_weight || '0.000'}g`,
        `${product.stone_weight || '0.000'}g`,
        `${product.net_weight || '0.000'}g`,
        `Rs.${product.rate || '0.00'}`,
        `Rs.${product.amount || '0.00'}`
    ]);

    doc.autoTable({
        startY: yPosition,
        head: [['#', 'Product Description', 'Gross Wt', 'Dust Wt', 'Stone Wt', 'Net Wt', 'Rate', 'Amount']],
        body: tableData,
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 }
    });

    // Total Amount
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`TOTAL AMOUNT: Rs.${purchase.total_amount || '0.00'}`, 150, finalY, { align: 'right' });

    // Payment Information
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${formatPaymentMethod(purchase.payment_method)}`, 20, finalY + 10);
    doc.text(`Regional Status: ${purchase.regional_status === "1" ? "Sent to Accounts" : "Not Sent"}`, 20, finalY + 16);
    // doc.text(`Accounts Status: ${purchase.accounts_status === "1" ? "Approved" : "Not Approved"}`, 20, finalY + 22);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', 105, 270, { align: 'center' });
    doc.text('This is a computer generated receipt', 105, 275, { align: 'center' });

    return doc;
};

const formatPaymentMethod = (method) => {
    const methods = {
        cash: 'Cash',
        bank_transfer: 'Bank Transfer',
        partial_cash: 'Partial Cash',
        partial_bank: 'Partial Bank',
        partial_both: 'Cash + Bank'
    };
    return methods[method] || method || 'N/A';
};

export const downloadPDF = (doc, filename) => {
    doc.save(filename);
};