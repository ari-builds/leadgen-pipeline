import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");
    const leadId = searchParams.get("lead_id");

    let sql = `
      SELECT oe.*, l.contact_name, l.contact_email, l.company_name, l.score, l.notes, c.name as client_name
      FROM outreach_emails oe
      LEFT JOIN leads l ON oe.lead_id = l.id
      LEFT JOIN clients c ON oe.client_id = c.id
    `;
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (status) {
      conditions.push("oe.status = ?");
      args.push(status);
    }
    if (clientId) {
      conditions.push("oe.client_id = ?");
      args.push(parseInt(clientId));
    }
    if (leadId) {
      conditions.push("oe.lead_id = ?");
      args.push(parseInt(leadId));
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY oe.created_at DESC";

    const result = await db.execute({ sql, args });
    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();
    const { lead_id, client_id, template_type, subject, body } = data;

    if (!lead_id || !subject || !body) {
      return NextResponse.json({ error: "lead_id, subject, and body are required" }, { status: 400 });
    }

    const result = await db.execute({
      sql: `INSERT INTO outreach_emails (lead_id, client_id, template_type, subject, body, status)
            VALUES (?, ?, ?, ?, ?, 'draft')`,
      args: [lead_id, client_id || null, template_type || null, subject, body],
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
