import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();
autoTable(doc, {
  head: [['Name']],
  body: [['Test']]
});

console.log("lastAutoTable:", !!doc.lastAutoTable);
if (doc.lastAutoTable) {
  console.log("finalY:", doc.lastAutoTable.finalY);
} else {
  console.log("NO lastAutoTable!");
}
