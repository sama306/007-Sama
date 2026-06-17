import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order } from '@/types/cart';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: 'Completado',
    pending: 'Pendiente',
    refunded: 'Reembolsado',
  };
  return labels[status] ?? status;
}

export function generateOrderPDF(order: Order): void {
  const doc = new jsPDF();

  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('007-Sama', 15, 16);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprobante de Pedido', doc.internal.pageSize.getWidth() - 15, 16, { align: 'right' });

  let y = 55;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  doc.text('Nro. de Pedido:', 15, y);
  doc.setFont('helvetica', 'bold');
  doc.text(order.id.slice(-8).toUpperCase(), 45, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha:', 15, y);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(order.date), 29, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Estado:', 15, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(getStatusLabel(order.status), 31, y);

  y = 55;
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ID de transacción Stripe:', doc.internal.pageSize.getWidth() / 2 + 5, y);

  y += 6;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const maxChars = Math.floor((doc.internal.pageSize.getWidth() / 2 - 20) / 3.5);
  if (order.id.length > maxChars) {
    for (let i = 0; i < order.id.length; i += maxChars) {
      doc.text(order.id.slice(i, i + maxChars), doc.internal.pageSize.getWidth() / 2 + 5, y);
      y += 4;
    }
  } else {
    doc.text(order.id, doc.internal.pageSize.getWidth() / 2 + 5, y);
  }

  const startY = 90;
  autoTable(doc, {
    startY,
    head: [['Producto', 'Plataforma', 'Cant.', 'Precio U.', 'Subtotal']],
    body: order.items.map((item) => [
      item.title,
      item.platform,
      item.quantity.toString(),
      `$${item.price.toFixed(2)}`,
      `$${(item.price * item.quantity).toFixed(2)}`,
    ]),
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [60, 60, 60] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 75, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
    theme: 'plain',
    styles: { lineColor: [220, 220, 220], lineWidth: 0.1 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const iva = order.total - order.subtotal;
  const totalsX = doc.internal.pageSize.getWidth() - 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Subtotal:', totalsX - 50, finalY);
  doc.text(`$${order.subtotal.toFixed(2)}`, totalsX, finalY, { align: 'right' });

  doc.text('IVA (21%):', totalsX - 50, finalY + 7);
  doc.text(`$${iva.toFixed(2)}`, totalsX, finalY + 7, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Total:', totalsX - 50, finalY + 16);
  doc.text(`$${order.total.toFixed(2)}`, totalsX, finalY + 16, { align: 'right' });

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, footerY, doc.internal.pageSize.getWidth() - 15, footerY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('Este documento es un comprobante de tu pedido en 007-Sama.', doc.internal.pageSize.getWidth() / 2, footerY + 5, { align: 'center' });
  doc.text('Los pagos son procesados en modo test. Ningún cargo real fue realizado.', doc.internal.pageSize.getWidth() / 2, footerY + 9, { align: 'center' });
  doc.text('Para consultas: soporte@007sama.com', doc.internal.pageSize.getWidth() / 2, footerY + 13, { align: 'center' });

  const dateStr = new Date(order.date).toISOString().slice(0, 10);
  doc.save(`order-007sama-${order.id.slice(-8)}-${dateStr}.pdf`);
}
