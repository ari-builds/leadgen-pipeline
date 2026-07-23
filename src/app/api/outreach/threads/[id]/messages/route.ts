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
      sql: "SELECT id FROM outreach_threads WHERE id = ?",
      args: [parseInt(id)],
    });

    if (threadResult.rows.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const result = await db.execute({
      sql: "SELECT * FROM outreach_messages WHERE thread_id = ? ORDER BY sent_at ASC",
      args: [parseInt(id)],
    });

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const { direction, platform, content, is_ai_generated } = data;

    if (!direction || !content) {
      return NextResponse.json({ error: "direction and content are required" }, { status: 400 });
    }

    const threadResult = await db.execute({
      sql: "SELECT id FROM outreach_threads WHERE id = ?",
      args: [parseInt(id)],
    });

    if (threadResult.rows.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const result = await db.execute({
      sql: `INSERT INTO outreach_messages (thread_id, direction, platform, content, is_ai_generated)
            VALUES (?, ?, ?, ?, ?)`,
      args: [parseInt(id), direction, platform || null, content, is_ai_generated ? 1 : 0],
    });

    await db.execute({
      sql: "UPDATE outreach_threads SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [parseInt(id)],
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
