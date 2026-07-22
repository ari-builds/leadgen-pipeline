import PDFDocument from "pdfkit";
import { LeadExportData, LEAD_COLUMNS } from "./types";

function drawHeader(
  doc: typeof PDFDocument.prototype,
  title: string,
  leads: LeadExportData[]
) {
  doc.fontSize(22).font("Helvetica-Bold").text(title, 50, 50);
  doc.fontSize(10).font("Helvetica").fillColor("#666666");

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generated on ${date}`, 50, 80);

  const avgScore =
    leads.length > 0
      ? (leads.reduce((a, l) => a + l.score, 0) / leads.length).toFixed(1)
      : "0";
  const statusCounts = {
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    closed: leads.filter((l) => l.status === "closed").length,
  };

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor("#1A1A1A")
    .text(
      `${leads.length} leads  |  Avg Score: ${avgScore}  |  New: ${statusCounts.new}  |  Contacted: ${statusCounts.contacted}  |  Qualified: ${statusCounts.qualified}  |  Closed: ${statusCounts.closed}`,
      50,
      100
    );

  return 130;
}

export async function generatePDFSummary(
  leads: LeadExportData[],
  title: string
): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const pageWidth = doc.page.width - 100; // margins
    const cols = LEAD_COLUMNS.slice(0, 12); // Fit in landscape
    const colWidths = cols.map((c) => (c.width / cols.reduce((a, col) => a + col.width, 0)) * pageWidth);

    let y = drawHeader(doc, title, leads);
    y += 10;

    // Table header
    function drawTableHeader(docY: number) {
      let x = 50;
      doc.save();
      doc.rect(50, docY, pageWidth, 20).fill("#1A1A1A");
      doc.restore();
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);

      cols.forEach((col, i) => {
        doc.text(col.label, x + 3, docY + 5, {
          width: colWidths[i] - 6,
          lineBreak: false,
        });
        x += colWidths[i];
      });
      return docY + 20;
    }

    y = drawTableHeader(y);

    // Data rows
    leads.forEach((lead, idx) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
        y = drawTableHeader(y);
      }

      let x = 50;
      const rowHeight = 18;

      // Zebra stripe
      if (idx % 2 === 1) {
        doc.save();
        doc.rect(50, y, pageWidth, rowHeight).fill("#F5F5F5");
        doc.restore();
      }

      // Bottom border
      doc.save();
      doc.moveTo(50, y + rowHeight).lineTo(50 + pageWidth, y + rowHeight).lineWidth(0.5).strokeColor("#E5E5E5").stroke();
      doc.restore();

      doc.font("Helvetica").fontSize(7).fillColor("#333333");
      cols.forEach((col, i) => {
        const val = lead[col.key] != null ? String(lead[col.key]) : "—";
        const truncated = val.substring(0, 35);
        doc.text(truncated, x + 3, y + 4, {
          width: colWidths[i] - 6,
          lineBreak: false,
        });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    // Page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#999999")
        .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, {
          align: "center",
          width: pageWidth,
        });
    }

    doc.end();
  });
}
