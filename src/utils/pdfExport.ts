import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  firmName?: string;
  firmCode?: string;
  generatedBy?: string;
}

export function createPdfDocument(options: PdfHeaderOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const firm = options.firmName || 'LAW FIRM REGISTRY';
  const code = options.firmCode || 'LFR-001';
  const title = options.title || 'Official Report';
  const subtitle = options.subtitle || '';
  const author = options.generatedBy || 'Authorized Officer';
  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Top Accent Gold Bar
  doc.setFillColor(201, 162, 39); // #C9A227
  doc.rect(0, 0, 210, 5, 'F');

  // Header Box
  doc.setFillColor(8, 23, 41); // #081729
  doc.rect(0, 5, 210, 28, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(firm.toUpperCase(), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(201, 162, 39);
  doc.text(`FIRM CODE: ${code} | ADVOCATES & COMMISSIONERS FOR OATHS`, 14, 22);

  doc.setTextColor(180, 195, 210);
  doc.setFontSize(8);
  doc.text(`Date Generated: ${today} | Author: ${author}`, 14, 28);

  // Divider Line
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.5);
  doc.line(14, 37, 196, 37);

  // Sub-Header Title
  doc.setTextColor(8, 23, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 45);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 51);
  }

  return { doc, startY: subtitle ? 56 : 50 };
}

export function exportTableToPdf(
  headerOptions: PdfHeaderOptions,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  summaryCards?: { label: string; value: string | number }[]
) {
  const { doc, startY } = createPdfDocument(headerOptions);
  let currentY = startY;

  // Add Summary KPI Cards if present
  if (summaryCards && summaryCards.length > 0) {
    const cardWidth = Math.min(42, (182 - (summaryCards.length - 1) * 4) / summaryCards.length);
    summaryCards.forEach((card, idx) => {
      const xPos = 14 + idx * (cardWidth + 4);
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(220, 226, 235);
      doc.roundedRect(xPos, currentY, cardWidth, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), xPos + 3, currentY + 5);

      doc.setFontSize(10);
      doc.setTextColor(8, 23, 41);
      doc.text(String(card.value), xPos + 3, currentY + 11);
    });

    currentY += 19;
  }

  // Render Table
  autoTable(doc, {
    startY: currentY,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [8, 23, 41],
      textColor: [201, 162, 39],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      
      // Footer bar line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 283, 196, 283);
      
      doc.text(
        `Law Firm Registry — Confidential Client Report`,
        14,
        288
      );
      doc.text(
        `Page ${currentPage} of ${totalPages}`,
        196,
        288,
        { align: 'right' }
      );
    }
  });

  doc.save(filename);
}
