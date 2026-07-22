import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/session";
import {
  generateXLSX,
  generateDOCX,
  generatePPTX,
  generatePDFSummary,
  generatePDFVisual,
} from "@/lib/exports";
import type { LeadExportData } from "@/lib/exports";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "xlsx";
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let sql = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let args: any[] = [];

    if (clientId) {
      sql = `SELECT l.*
             FROM leads l
             JOIN client_leads cl ON l.id = cl.lead_id
             WHERE cl.client_id = ?`;
      args = [clientId];

      if (status && status !== "all") {
        sql += ` AND l.status = ?`;
        args.push(status);
      }
      if (search) {
        sql += ` AND (l.company_name LIKE ? OR l.contact_name LIKE ? OR l.industry LIKE ?)`;
        const s = `%${search}%`;
        args.push(s, s, s);
      }

      sql += ` ORDER BY l.score DESC`;
    } else {
      sql = `SELECT * FROM leads WHERE 1=1`;
      args = [];

      if (status && status !== "all") {
        sql += ` AND status = ?`;
        args.push(status);
      }
      if (search) {
        sql += ` AND (company_name LIKE ? OR contact_name LIKE ? OR industry LIKE ?)`;
        const s = `%${search}%`;
        args.push(s, s, s);
      }

      sql += ` ORDER BY score DESC`;
    }

    const result = await db.execute({ sql, args });
    const leads = result.rows as unknown as LeadExportData[];

    if (leads.length === 0) {
      return NextResponse.json({ error: "No leads to export" }, { status: 404 });
    }

    // Get client name for title
    let title = "LeadGen Pipeline Report";
    if (clientId) {
      const clientResult = await db.execute({
        sql: "SELECT name FROM clients WHERE id = ?",
        args: [clientId],
      });
      if (clientResult.rows.length > 0) {
        title = `${clientResult.rows[0].name} - Lead Report`;
      }
    }

    const date = new Date().toISOString().split("T")[0];

    const toUint8 = (buffer: Buffer): Uint8Array =>
      new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const send = (buffer: Buffer, contentType: string, filename: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new NextResponse(toUint8(buffer) as any, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });

    switch (format) {
      case "xlsx": {
        const buffer = await generateXLSX(leads, title);
        return send(buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `leads-${date}.xlsx`);
      }
      case "docx": {
        const buffer = await generateDOCX(leads, title);
        return send(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", `leads-${date}.docx`);
      }
      case "pptx": {
        const buffer = await generatePPTX(leads, title);
        return send(buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation", `leads-${date}.pptx`);
      }
      case "pdf-summary": {
        const buffer = await generatePDFSummary(leads, title);
        return send(buffer, "application/pdf", `leads-${date}-summary.pdf`);
      }
      case "pdf-visual": {
        const buffer = await generatePDFVisual(leads, title);
        return send(buffer, "application/pdf", `leads-${date}-visual.pdf`);
      }
      default:
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
