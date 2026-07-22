import ExcelJS from "exceljs";
import { LeadExportData, LEAD_COLUMNS } from "./types";

export async function generateXLSX(
  leads: LeadExportData[],
  title: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LeadGen Pipeline";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title);

  // Title row
  sheet.mergeCells(1, 1, 1, LEAD_COLUMNS.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true, color: { argb: "FF1A1A1A" } };
  titleCell.alignment = { horizontal: "center" };

  // Summary row
  sheet.mergeCells(2, 1, 2, LEAD_COLUMNS.length);
  const summaryCell = sheet.getCell("A2");
  const newCount = leads.filter((l) => l.status === "new").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
  const qualifiedCount = leads.filter((l) => l.status === "qualified").length;
  const closedCount = leads.filter((l) => l.status === "closed").length;
  const avgScore = leads.length > 0 ? (leads.reduce((a, l) => a + l.score, 0) / leads.length).toFixed(1) : "0";
  summaryCell.value = `${leads.length} leads | Avg Score: ${avgScore} | New: ${newCount} | Contacted: ${contactedCount} | Qualified: ${qualifiedCount} | Closed: ${closedCount}`;
  summaryCell.font = { size: 10, color: { argb: "FF666666" } };
  summaryCell.alignment = { horizontal: "center" };

  // Empty row
  sheet.getRow(3);

  // Headers
  const headerRow = sheet.getRow(4);
  LEAD_COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF333333" } },
    };
    sheet.getColumn(i + 1).width = col.width;
  });

  // Data rows
  leads.forEach((lead, rowIdx) => {
    const row = sheet.getRow(5 + rowIdx);
    LEAD_COLUMNS.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      const val = lead[col.key];
      cell.value = val != null ? String(val) : "—";

      // Zebra striping
      if (rowIdx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      }

      // Score coloring
      if (col.key === "score") {
        const score = lead.score;
        if (score >= 8) cell.font = { bold: true, color: { argb: "FF16A34A" } };
        else if (score >= 5) cell.font = { color: { argb: "FFCA8A04" } };
        else cell.font = { color: { argb: "FFDC2626" } };
      }

      // Status coloring
      if (col.key === "status") {
        const statusColors: Record<string, string> = {
          new: "FF2563EB",
          contacted: "FFCA8A04",
          qualified: "FF16A34A",
          closed: "FF7C3AED",
        };
        cell.font = { bold: true, color: { argb: statusColors[lead.status] || "FF1A1A1A" } };
      }
    });
  });

  // Auto-filter
  if (leads.length > 0) {
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + leads.length, column: LEAD_COLUMNS.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
