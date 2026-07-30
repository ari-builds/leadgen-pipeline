import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const clientResult = await db.execute({
      sql: "SELECT id FROM clients WHERE slug = ?",
      args: [slug],
    });

    if (clientResult.rows.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientId = clientResult.rows[0].id as number;

    const [sentResult, openedResult, bouncedResult, repliesResult, classResult, convResult, recentResult] = await Promise.all([
      db.execute({
        sql: "SELECT COUNT(*) as c FROM outreach_emails WHERE client_id = ? AND status = 'sent'",
        args: [clientId],
      }),
      db.execute({
        sql: "SELECT COUNT(*) as c FROM outreach_emails WHERE client_id = ? AND opened_at IS NOT NULL",
        args: [clientId],
      }),
      db.execute({
        sql: "SELECT COUNT(*) as c FROM outreach_emails WHERE client_id = ? AND status = 'bounced'",
        args: [clientId],
      }),
      db.execute({
        sql: `SELECT COUNT(*) as c FROM email_replies er
              WHERE er.sender_email IN (
                SELECT l.contact_email FROM leads l
                JOIN client_leads cl ON l.id = cl.lead_id
                WHERE cl.client_id = ?
              )`,
        args: [clientId],
      }),
      db.execute({
        sql: `SELECT er.classification, COUNT(*) as c FROM email_replies er
              WHERE er.sender_email IN (
                SELECT l.contact_email FROM leads l
                JOIN client_leads cl ON l.id = cl.lead_id
                WHERE cl.client_id = ?
              )
              GROUP BY er.classification`,
        args: [clientId],
      }),
      db.execute({
        sql: `SELECT status, COUNT(*) as c, COALESCE(SUM(value), 0) as total_value
              FROM conversions WHERE client_id = ? GROUP BY status`,
        args: [clientId],
      }),
      db.execute({
        sql: `SELECT er.*, l.company_name FROM email_replies er
              LEFT JOIN leads l ON er.sender_email = l.contact_email
              WHERE er.sender_email IN (
                SELECT l2.contact_email FROM leads l2
                JOIN client_leads cl ON l2.id = cl.lead_id
                WHERE cl.client_id = ?
              )
              ORDER BY er.received_at DESC LIMIT 10`,
        args: [clientId],
      }),
    ]);

    const sent = sentResult.rows[0].c as number;
    const opened = openedResult.rows[0].c as number;
    const bounced = bouncedResult.rows[0].c as number;
    const replies = repliesResult.rows[0].c as number;

    return NextResponse.json({
      sent,
      opened,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      bounced,
      bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
      replies,
      replyRate: sent > 0 ? Math.round((replies / sent) * 100) : 0,
      classificationBreakdown: (classResult.rows as Array<Record<string, string | number>>).map(r => ({
        classification: (r.classification as string) || "unclassified",
        count: r.c as number,
      })),
      conversions: (convResult.rows as Array<Record<string, string | number>>).map(r => ({
        status: r.status as string,
        count: r.c as number,
        totalValue: r.total_value as number,
      })),
      recentReplies: (recentResult.rows as Array<Record<string, string | number | null>>).map(r => ({
        id: r.id as number,
        sender: (r.sender as string) || (r.sender_email as string),
        sender_email: r.sender_email as string,
        subject: r.subject as string,
        body: String(r.body || "").substring(0, 200),
        received_at: r.received_at as string,
        classification: r.classification as string,
        company_name: r.company_name as string,
      })),
    });
  } catch (error) {
    console.error("Client analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
