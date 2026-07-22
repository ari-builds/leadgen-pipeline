import PDFDocument from "pdfkit";
import { LeadExportData } from "./types";

function drawDonutChart(
  doc: typeof PDFDocument.prototype,
  data: { label: string; value: number; color: string }[],
  x: number,
  y: number,
  size: number,
  title: string
) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return;

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1A1A1A").text(title, x, y - 15, { width: size, align: "center" });

  const cx = x + size / 2;
  const cy = y + size / 2;
  const outerR = size / 2 - 5;
  const innerR = outerR * 0.55;
  let startAngle = -Math.PI / 2;

  data.forEach((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Draw arc using lines (pdfkit doesn't have arc, approximate with line segments)
    const steps = Math.max(Math.ceil(sliceAngle / 0.1), 4);
    const angleStep = sliceAngle / steps;

    // Outer arc points
    const outerPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + i * angleStep;
      outerPoints.push({ x: cx + outerR * Math.cos(angle), y: cy + outerR * Math.sin(angle) });
    }

    // Inner arc points (reversed)
    const innerPoints: { x: number; y: number }[] = [];
    for (let i = steps; i >= 0; i--) {
      const angle = startAngle + i * angleStep;
      innerPoints.push({ x: cx + innerR * Math.cos(angle), y: cy + innerR * Math.sin(angle) });
    }

    // Draw filled shape
    const allPoints = [...outerPoints, ...innerPoints];
    doc.save();
    doc.moveTo(allPoints[0].x, allPoints[0].y);
    allPoints.forEach((p) => doc.lineTo(p.x, p.y));
    doc.closePath().fill(d.color);
    doc.restore();

    startAngle = endAngle;
  });

  // Legend
  let ly = y + size + 8;
  data.forEach((d) => {
    doc.save();
    doc.rect(x + 5, ly, 8, 8).fill(d.color);
    doc.restore();
    doc.fontSize(7).font("Helvetica").fillColor("#333333").text(`${d.label}: ${d.value}`, x + 18, ly - 1);
    ly += 12;
  });
}

function drawBarChart(
  doc: typeof PDFDocument.prototype,
  data: { label: string; value: number; color: string }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
) {
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1A1A1A").text(title, x, y - 15, { width, align: "center" });

  if (data.length === 0) return;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min((width - 20) / data.length - 4, 40);
  const chartHeight = height - 20;
  const startX = x + 10;

  // Y-axis line
  doc.save().moveTo(startX, y).lineTo(startX, y + chartHeight).lineWidth(1).strokeColor("#CCCCCC").stroke().restore();

  data.forEach((d, i) => {
    const barHeight = (d.value / maxVal) * chartHeight;
    const bx = startX + i * (barWidth + 4);
    const by = y + chartHeight - barHeight;

    // Bar
    doc.save();
    doc.roundedRect(bx, by, barWidth, barHeight, 2).fill(d.color);
    doc.restore();

    // Value on top
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#333333").text(String(d.value), bx, by - 10, { width: barWidth, align: "center" });

    // Label below
    doc.fontSize(6).font("Helvetica").fillColor("#666666").text(d.label, bx - 5, y + chartHeight + 3, { width: barWidth + 10, align: "center" });
  });
}

function drawKPIBox(
  doc: typeof PDFDocument.prototype,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  doc.save();
  doc.roundedRect(x, y, w, h, 5).fill("#F5F5F5");
  doc.restore();
  doc.save();
  doc.roundedRect(x, y, w, 4, 5).fill(color);
  doc.restore();
  doc.fontSize(22).font("Helvetica-Bold").fillColor(color).text(value, x, y + 15, { width: w, align: "center" });
  doc.fontSize(8).font("Helvetica").fillColor("#666666").text(label, x, y + h - 18, { width: w, align: "center" });
}

export async function generatePDFVisual(
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

    const pageWidth = doc.page.width - 100;
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ---- PAGE 1: Title + KPIs + Charts ----
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1A1A1A").text(title, 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text(`Generated on ${date}`, 50, 78);

    const avgScore = leads.length > 0 ? (leads.reduce((a, l) => a + l.score, 0) / leads.length).toFixed(1) : "0";
    const statusCounts = {
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      closed: leads.filter((l) => l.status === "closed").length,
    };

    // KPI boxes
    const kpiY = 105;
    const kpiW = (pageWidth - 30) / 4;
    drawKPIBox(doc, "Total Leads", String(leads.length), 50, kpiY, kpiW, 55, "#2563EB");
    drawKPIBox(doc, "Avg Score", avgScore, 50 + kpiW + 10, kpiY, kpiW, 55, "#CA8A04");
    drawKPIBox(doc, "Qualified", String(statusCounts.qualified), 50 + (kpiW + 10) * 2, kpiY, kpiW, 55, "#16A34A");
    drawKPIBox(doc, "Closed", String(statusCounts.closed), 50 + (kpiW + 10) * 3, kpiY, kpiW, 55, "#7C3AED");

    // Charts row 1
    const chartY = 185;
    const halfWidth = pageWidth / 2 - 15;

    // Donut: Status breakdown
    const statusData = [
      { label: "New", value: statusCounts.new, color: "#2563EB" },
      { label: "Contacted", value: statusCounts.contacted, color: "#CA8A04" },
      { label: "Qualified", value: statusCounts.qualified, color: "#16A34A" },
      { label: "Closed", value: statusCounts.closed, color: "#7C3AED" },
    ];
    drawDonutChart(doc, statusData, 50, chartY, 170, "Leads by Status");

    // Bar: Industry distribution
    const industryMap = new Map<string, number>();
    leads.forEach((l) => {
      const ind = l.industry || "Unknown";
      industryMap.set(ind, (industryMap.get(ind) || 0) + 1);
    });
    const industryData = Array.from(industryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], i) => ({
        label: label.substring(0, 12),
        value,
        color: ["#2563EB", "#CA8A04", "#16A34A", "#7C3AED", "#DC2626", "#0891B2", "#DB2777", "#65A30D"][i % 8],
      }));
    drawBarChart(doc, industryData, 50 + halfWidth + 30, chartY + 15, halfWidth, 155, "Leads by Industry");

    // ---- PAGE 2: Score distribution + Top leads ----
    doc.addPage();

    doc.fontSize(18).font("Helvetica-Bold").fillColor("#1A1A1A").text("Score Distribution & Top Leads", 50, 50);

    // Score distribution bar chart
    const scoreBuckets = [
      { label: "1-2", value: 0, color: "#DC2626" },
      { label: "3-4", value: 0, color: "#F97316" },
      { label: "5-6", value: 0, color: "#CA8A04" },
      { label: "7-8", value: 0, color: "#16A34A" },
      { label: "9-10", value: 0, color: "#2563EB" },
    ];
    leads.forEach((l) => {
      if (l.score <= 2) scoreBuckets[0].value++;
      else if (l.score <= 4) scoreBuckets[1].value++;
      else if (l.score <= 6) scoreBuckets[2].value++;
      else if (l.score <= 8) scoreBuckets[3].value++;
      else scoreBuckets[4].value++;
    });
    drawBarChart(doc, scoreBuckets, 50, 80, halfWidth, 180, "Score Distribution");

    // Top 10 leads table
    const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, 10);
    const tableX = 50 + halfWidth + 30;
    const tableW = halfWidth;

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1A1A1A").text("Top 10 Leads", tableX, 65, { width: tableW, align: "center" });

    let ty = 85;
    // Header
    doc.save();
    doc.rect(tableX, ty, tableW, 16).fill("#1A1A1A");
    doc.restore();
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#FFFFFF");
    doc.text("Company", tableX + 3, ty + 4, { width: tableW * 0.35, lineBreak: false });
    doc.text("Contact", tableX + tableW * 0.35, ty + 4, { width: tableW * 0.3, lineBreak: false });
    doc.text("Score", tableX + tableW * 0.65, ty + 4, { width: tableW * 0.15, lineBreak: false });
    doc.text("Status", tableX + tableW * 0.8, ty + 4, { width: tableW * 0.2, lineBreak: false });
    ty += 16;

    topLeads.forEach((lead, idx) => {
      if (idx % 2 === 1) {
        doc.save();
        doc.rect(tableX, ty, tableW, 14).fill("#F5F5F5");
        doc.restore();
      }
      doc.fontSize(7).font("Helvetica").fillColor("#333333");
      doc.text((lead.company_name || "—").substring(0, 25), tableX + 3, ty + 3, { width: tableW * 0.35, lineBreak: false });
      doc.text((lead.contact_name || "—").substring(0, 20), tableX + tableW * 0.35, ty + 3, { width: tableW * 0.3, lineBreak: false });
      doc.font("Helvetica-Bold").text(String(lead.score), tableX + tableW * 0.65, ty + 3, { width: tableW * 0.15, lineBreak: false });
      doc.font("Helvetica").text(lead.status, tableX + tableW * 0.8, ty + 3, { width: tableW * 0.2, lineBreak: false });
      ty += 14;
    });

    // Page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font("Helvetica").fillColor("#999999").text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, { align: "center", width: pageWidth });
    }

    doc.end();
  });
}
