import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { outreach_email_id } = await req.json();

    if (!outreach_email_id) {
      return NextResponse.json({ error: "outreach_email_id is required" }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: "Resend API key not configured" }, { status: 500 });
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

    const { data, error: resendError } = await resend.emails.send({
      from: "NetClicks by Ari <netclicksbyari@gmail.com>",
      to: email.contact_email as string,
      subject: email.subject as string,
      html: (email.body as string).replace(/\n/g, "<br>"),
    });

    if (resendError) {
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    await db.execute({
      sql: `UPDATE outreach_emails SET status = 'sent', resend_email_id = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [data?.id || null, outreach_email_id],
    });

    return NextResponse.json({ success: true, resend_email_id: data?.id });
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
