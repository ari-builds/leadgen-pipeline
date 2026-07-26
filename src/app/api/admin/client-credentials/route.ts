import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

    const result = await db.execute({
      sql: `SELECT c.id, c.name, c.slug, c.contact_email, c.dashboard_password,
            (SELECT COUNT(*) FROM client_leads cl WHERE cl.client_id = c.id) as lead_count
            FROM clients c
            ORDER BY c.created_at ASC`,
      args: [],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
