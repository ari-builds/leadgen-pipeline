import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { sendOutreachEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { outreach_email_id } = await req.json();

    if (!outreach_email_id) {
      return NextResponse.json({ error: "outreach_email_id is required" }, { status: 400 });
    }

    const result = await db.execute({
      sql: `SELECT oe.*, l.contact_email, l.contact_name
            FROM outreach_emails oe
            LEFT JOIN leads l ON oe.lead_id = l.id
            WHERE oe.id = ?`,
      args: [outreach_email_id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Outreach email not found" }, { status: 404 });
    }

    const email = result.rows[0];

    if (email.status === "sent") {
      return NextResponse.json({ error: "Email already sent" }, { status: 400 });
    }

    if (!email.contact_email) {
      return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });
    }

    const sendResult = await sendOutreachEmail(
      email.contact_email as string,
      email.subject as string,
      (email.body as string).replace(/\n/g, "<br>"),
      "NetClicks by Ari <netclicksbyari@gmail.com>"
    );

    if (!sendResult.success) {
      return NextResponse.json({ error: sendResult.error }, { status: 500 });
    }

    await db.execute({
      sql: `UPDATE outreach_emails SET status = 'sent', resend_email_id = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [sendResult.id || null, outreach_email_id],
    });

    return NextResponse.json({ success: true, provider: sendResult.provider, id: sendResult.id });
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
