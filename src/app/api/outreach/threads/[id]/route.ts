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

    const threadResult = await db.execute({
      sql: `SELECT ot.*, l.contact_name, l.contact_email, l.contact_phone, l.company_name, c.name as client_name
            FROM outreach_threads ot
            LEFT JOIN leads l ON ot.lead_id = l.id
            LEFT JOIN clients c ON ot.client_id = c.id
            WHERE ot.id = ?`,
      args: [parseInt(id)],
    });

    if (threadResult.rows.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const messagesResult = await db.execute({
      sql: "SELECT * FROM outreach_messages WHERE thread_id = ? ORDER BY sent_at ASC",
      args: [parseInt(id)],
    });

    return NextResponse.json({
      ...threadResult.rows[0],
      messages: messagesResult.rows,
    });
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
      sql: "SELECT id FROM outreach_threads WHERE id = ?",
      args: [parseInt(id)],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE outreach_threads SET
        status = COALESCE(?, status),
        platform = COALESCE(?, platform)
      WHERE id = ?`,
      args: [data.status || null, data.platform || null, parseInt(id)],
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
