import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("lead_id");
    const clientId = searchParams.get("client_id");
    const platform = searchParams.get("platform");

    let sql = `
      SELECT ot.*,
        l.contact_name, l.contact_email, l.company_name,
        c.name as client_name,
        (
          SELECT content FROM outreach_messages
          WHERE thread_id = ot.id
          ORDER BY sent_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM outreach_messages
          WHERE thread_id = ot.id
        ) as message_count
      FROM outreach_threads ot
      LEFT JOIN leads l ON ot.lead_id = l.id
      LEFT JOIN clients c ON ot.client_id = c.id
    `;
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (leadId) {
      conditions.push("ot.lead_id = ?");
      args.push(parseInt(leadId));
    }
    if (clientId) {
      conditions.push("ot.client_id = ?");
      args.push(parseInt(clientId));
    }
    if (platform) {
      conditions.push("ot.platform = ?");
      args.push(platform);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY ot.last_message_at DESC, ot.created_at DESC";

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
