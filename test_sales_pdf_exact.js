const moment = require('moment');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const data = [
  {
    "id": 7,
    "metal": "1",
    "product": "12",
    "sub_product": "31",
    "weight": "6.040",
    "melt_weight": "5.315",
    "status": "pending",
    "created_at": "2026-01-29T13:46:09.000Z",
    "assign_smith_name": "Natesh - S090001",
    "assign_customer": null,
    "assign_customer_name": null,
    "assign_customer_payment_type": null,
    "sales_payments": []
  }
];

try {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;

  const tableRows = data.map((item) => {
    const weight = parseFloat(item.weight) || 0;
    const dustWeight = parseFloat(item.dust_weight) || 0;
    const purity = parseFloat(item.purity) || 100;
    const netWeight = (weight - dustWeight) * (purity / 100);
    const marginWeight = (netWeight * 3) / 100;
    const finalWeight = netWeight - marginWeight;

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

  doc.autoTable({
    startY: 30,
    head: [['Receipt No', 'Customer Name', 'Date', 'Gross Wt (g)', 'Pure Wt (g)', 'Amount (Rs.)', 'Payment Type', 'Status']],
    body: tableRows,
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 0;
  
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

  doc.text(`Total Sales: ${totalSales}`, 20, finalY + 15);
  doc.text(`Total Weight: ${totalPureWeight.toFixed(3)} g (Pure)`, 100, finalY + 15);
  doc.text(`Total Value: Rs.${totalAmount.toLocaleString('en-IN')}`, 180, finalY + 15);

  console.log("SUCCESS!");
} catch (e) {
  console.log("ERROR!");
  console.error(e);
}
