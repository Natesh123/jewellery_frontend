const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const doc = new jsPDF();
doc.autoTable({
  head: [['Name', 'Email']],
  body: [['John', 'john@example.com']]
});
console.log("lastAutoTable:", !!doc.lastAutoTable);
console.log("autoTable.previous:", !!doc.autoTable.previous);
