import PptxGenJS from "pptxgenjs";
import { LeadExportData, LEAD_COLUMNS } from "./types";

export async function generatePPTX(
  leads: LeadExportData[],
  title: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = "LeadGen Pipeline";
  pptx.title = title;

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

  // Slide 1: Title
  const titleSlide = pptx.addSlide();
  titleSlide.background = { fill: "1A1A1A" };
  titleSlide.addText(title, {
    x: 0.5,
    y: 1.5,
    w: "90%",
    fontSize: 36,
    bold: true,
    color: "FFFFFF",
    align: "center",
  });
  titleSlide.addText(`Generated ${date} | ${leads.length} Leads`, {
    x: 0.5,
    y: 3.0,
    w: "90%",
    fontSize: 14,
    color: "999999",
    align: "center",
  });

  // Slide 2: Summary stats
  const summarySlide = pptx.addSlide();
  summarySlide.addText("Summary", {
    x: 0.5,
    y: 0.3,
    fontSize: 24,
    bold: true,
    color: "1A1A1A",
  });

  const stats = [
    { label: "Total Leads", value: String(leads.length), color: "2563EB" },
    { label: "Avg Score", value: avgScore, color: "CA8A04" },
    { label: "New", value: String(statusCounts.new), color: "2563EB" },
    { label: "Contacted", value: String(statusCounts.contacted), color: "CA8A04" },
    { label: "Qualified", value: String(statusCounts.qualified), color: "16A34A" },
    { label: "Closed", value: String(statusCounts.closed), color: "7C3AED" },
  ];

  stats.forEach((stat, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.2;
    const y = 1.2 + row * 2.0;

    summarySlide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: 2.8,
      h: 1.5,
      fill: { color: "F5F5F5" },
      rectRadius: 0.1,
    });
    summarySlide.addText(stat.value, {
      x,
      y: y + 0.2,
      w: 2.8,
      fontSize: 32,
      bold: true,
      color: stat.color,
      align: "center",
    });
    summarySlide.addText(stat.label, {
      x,
      y: y + 0.9,
      w: 2.8,
      fontSize: 12,
      color: "666666",
      align: "center",
    });
  });

  // Slide 3+: Lead table (max 12 per slide for readability)
  const tableCols = LEAD_COLUMNS.slice(0, 8);
  const leadsPerSlide = 12;
  const totalSlides = Math.ceil(leads.length / leadsPerSlide);

  for (let s = 0; s < totalSlides; s++) {
    const slide = pptx.addSlide();
    const start = s * leadsPerSlide;
    const end = Math.min(start + leadsPerSlide, leads.length);
    const slice = leads.slice(start, end);

    slide.addText(
      `${title} (${start + 1}-${end} of ${leads.length})`,
      {
        x: 0.3,
        y: 0.2,
        fontSize: 14,
        bold: true,
        color: "1A1A1A",
      }
    );

    const headerRow = tableCols.map((col) => ({
      text: col.label,
      options: {
        bold: true,
        color: "FFFFFF",
        fill: { color: "1A1A1A" },
        fontSize: 9,
        align: "center" as const,
      },
    }));

    const dataRows = slice.map((lead) =>
      tableCols.map((col) => ({
        text: lead[col.key] != null ? String(lead[col.key]).substring(0, 30) : "—",
        options: {
          fontSize: 8,
          color: "333333",
        },
      }))
    );

    slide.addTable([headerRow, ...dataRows], {
      x: 0.3,
      y: 0.7,
      w: 9.4,
      colW: tableCols.map((c) => c.width * 0.45),
      border: { type: "solid", pt: 0.5, color: "DDDDDD" },
      autoPage: false,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;
  return Buffer.from(buffer as unknown as ArrayBuffer);
}
