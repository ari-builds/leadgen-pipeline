import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  generateEmailTemplate,
  generateDMScript,
  generateFollowUpScript,
} from "@/lib/outreach/templates";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { lead_id, type } = await req.json();

    if (!lead_id || !type) {
      return NextResponse.json({ error: "lead_id and type are required" }, { status: 400 });
    }

    const leadResult = await db.execute({
      sql: "SELECT * FROM leads WHERE id = ?",
      args: [lead_id],
    });

    if (leadResult.rows.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadResult.rows[0];

    if (type === "email_initial" || type === "email_followup_1" || type === "email_followup_2") {
      const emailType = type === "email_initial" ? "initial" : type === "email_followup_1" ? "followup_1" : "followup_2";
      const result = generateEmailTemplate(emailType, {
        contact_name: lead.contact_name as string,
        notes: (lead.notes as string) || "",
        location: (lead.location as string) || undefined,
      });

      return NextResponse.json({
        subject: result.subject,
        body: result.body,
        platform: "email",
      });
    }

    if (type === "dm_facebook" || type === "dm_instagram") {
      const platform = type === "dm_facebook" ? "facebook" : "instagram";
      const content = generateDMScript(platform, {
        contact_name: lead.contact_name as string,
        notes: (lead.notes as string) || "",
        location: (lead.location as string) || undefined,
      });

      // Find or create thread for this lead + platform
      const threadResult = await db.execute({
        sql: "SELECT id FROM outreach_threads WHERE lead_id = ? AND platform = ?",
        args: [lead_id, platform],
      });

      let threadId: number;
      if (threadResult.rows.length > 0) {
        threadId = threadResult.rows[0].id as number;
      } else {
        // Get client_id from client_leads
        const clResult = await db.execute({
          sql: "SELECT client_id FROM client_leads WHERE lead_id = ? LIMIT 1",
          args: [lead_id],
        });
        const clientId = clResult.rows.length > 0 ? clResult.rows[0].client_id : null;

        const newThread = await db.execute({
          sql: `INSERT INTO outreach_threads (lead_id, client_id, platform, status) VALUES (?, ?, ?, 'active')`,
          args: [lead_id, clientId, platform],
        });
        threadId = newThread.lastInsertRowid as unknown as number;
      }

      // Create the message record
      await db.execute({
        sql: `INSERT INTO outreach_messages (thread_id, direction, platform, content, is_ai_generated)
              VALUES (?, 'outbound', ?, ?, 1)`,
        args: [threadId, platform, content],
      });

      // Update thread last_message_at
      await db.execute({
        sql: "UPDATE outreach_threads SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [threadId],
      });

      return NextResponse.json({
        content,
        platform,
        thread_id: threadId,
      });
    }

    if (type === "followup_script") {
      // Fetch previous messages from the thread
      const threadResult = await db.execute({
        sql: "SELECT id FROM outreach_threads WHERE lead_id = ? AND platform != 'email' ORDER BY created_at DESC LIMIT 1",
        args: [lead_id],
      });

      let previousMessages: string[] = [];
      let threadId: number | null = null;

      if (threadResult.rows.length > 0) {
        threadId = threadResult.rows[0].id as number;
        const msgResult = await db.execute({
          sql: "SELECT content FROM outreach_messages WHERE thread_id = ? ORDER BY sent_at ASC",
          args: [threadId],
        });
        previousMessages = msgResult.rows.map((r) => r.content as string);
      }

      const platform = threadId
        ? ((await db.execute({ sql: "SELECT platform FROM outreach_threads WHERE id = ?", args: [threadId] })).rows[0]?.platform as string || "facebook")
        : "facebook";

      const content = generateFollowUpScript(platform, {
        contact_name: lead.contact_name as string,
        notes: (lead.notes as string) || "",
        location: (lead.location as string) || undefined,
      }, previousMessages);

      // Create thread if none exists
      if (!threadId) {
        const clResult = await db.execute({
          sql: "SELECT client_id FROM client_leads WHERE lead_id = ? LIMIT 1",
          args: [lead_id],
        });
        const clientId = clResult.rows.length > 0 ? clResult.rows[0].client_id : null;

        const newThread = await db.execute({
          sql: `INSERT INTO outreach_threads (lead_id, client_id, platform, status) VALUES (?, ?, ?, 'active')`,
          args: [lead_id, clientId, platform],
        });
        threadId = newThread.lastInsertRowid as unknown as number;
      }

      // Log the follow-up message
      await db.execute({
        sql: `INSERT INTO outreach_messages (thread_id, direction, platform, content, is_ai_generated)
              VALUES (?, 'outbound', ?, ?, 1)`,
        args: [threadId, platform, content],
      });

      await db.execute({
        sql: "UPDATE outreach_threads SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [threadId],
      });

      return NextResponse.json({
        content,
        platform,
        thread_id: threadId,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
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
