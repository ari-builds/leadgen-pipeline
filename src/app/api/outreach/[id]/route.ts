import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await db.execute({
      sql: `SELECT oe.*, l.contact_name, l.contact_email, l.contact_phone, l.company_name, c.name as client_name
            FROM outreach_emails oe
            LEFT JOIN leads l ON oe.lead_id = l.id
            LEFT JOIN clients c ON oe.client_id = c.id
            WHERE oe.id = ?`,
      args: [parseInt(id)],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Outreach email not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();

    const existing = await db.execute({
      sql: "SELECT id FROM outreach_emails WHERE id = ?",
      args: [parseInt(id)],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Outreach email not found" }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE outreach_emails SET
        status = COALESCE(?, status),
        subject = COALESCE(?, subject),
        body = COALESCE(?, body),
        template_type = COALESCE(?, template_type)
      WHERE id = ?`,
      args: [data.status || null, data.subject || null, data.body || null, data.template_type || null, parseInt(id)],
    });

    return NextResponse.json({ success: true });
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.execute({
      sql: "DELETE FROM outreach_emails WHERE id = ?",
      args: [parseInt(id)],
    });

    return NextResponse.json({ success: true });
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
