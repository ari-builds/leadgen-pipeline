import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  TextRun,
  Packer,
} from "docx";
import { LeadExportData, LEAD_COLUMNS } from "./types";

export async function generateDOCX(
  leads: LeadExportData[],
  title: string
): Promise<Buffer> {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

  // Table columns (fewer for DOCX readability)
  const cols = LEAD_COLUMNS.slice(0, 10);

  const tableRows = [
    new TableRow({
      children: cols.map(
        (col) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "1A1A1A" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: col.label,
                    bold: true,
                    color: "FFFFFF",
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          })
      ),
      tableHeader: true,
    }),
    ...leads.map(
      (lead, idx) =>
        new TableRow({
          children: cols.map(
            (col) =>
              new TableCell({
                shading:
                  idx % 2 === 1
                    ? { type: ShadingType.SOLID, color: "F5F5F5" }
                    : undefined,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text:
                          lead[col.key] != null
                            ? String(lead[col.key]).substring(0, 50)
                            : "—",
                        size: 18,
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 36,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${date}`,
                color: "666666",
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${leads.length} leads  |  Avg Score: ${avgScore}  |  New: ${statusCounts.new}  |  Contacted: ${statusCounts.contacted}  |  Qualified: ${statusCounts.qualified}  |  Closed: ${statusCounts.closed}`,
                bold: true,
                size: 20,
                color: "333333",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
