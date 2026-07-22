import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const result = await db.execute({
      sql: `SELECT l.*, GROUP_CONCAT(c.name) as client_names, GROUP_CONCAT(c.id) as client_ids
            FROM leads l
            LEFT JOIN client_leads cl ON l.id = cl.lead_id
            LEFT JOIN clients c ON cl.client_id = c.id
            WHERE l.id = ?
            GROUP BY l.id`,
      args: [parseInt(id)],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
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
    await requireAuth();
    const { id } = await params;
    const data = await req.json();
    const { clientIds, ...leadData } = data;

    await db.execute({
      sql: `UPDATE leads SET
        company_name = COALESCE(?, company_name),
        website_url = COALESCE(?, website_url),
        industry = COALESCE(?, industry),
        contact_name = COALESCE(?, contact_name),
        contact_email = COALESCE(?, contact_email),
        contact_phone = COALESCE(?, contact_phone),
        contact_linkedin = COALESCE(?, contact_linkedin),
        contact_title = COALESCE(?, contact_title),
        tech_stack = COALESCE(?, tech_stack),
        company_size = COALESCE(?, company_size),
        revenue_range = COALESCE(?, revenue_range),
        location = COALESCE(?, location),
        what_they_sell = COALESCE(?, what_they_sell),
        pain_points = COALESCE(?, pain_points),
        competitors = COALESCE(?, competitors),
        recent_news = COALESCE(?, recent_news),
        score = COALESCE(?, score),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [
        leadData.companyName, leadData.websiteUrl, leadData.industry,
        leadData.contactName, leadData.contactEmail, leadData.contactPhone,
        leadData.contactLinkedin, leadData.contactTitle, leadData.techStack,
        leadData.companySize, leadData.revenueRange, leadData.location,
        leadData.whatTheySell, leadData.painPoints, leadData.competitors,
        leadData.recentNews, leadData.score, leadData.status, leadData.notes,
        parseInt(id),
      ],
    });

    // Update client assignments
    if (clientIds && Array.isArray(clientIds)) {
      await db.execute({
        sql: "DELETE FROM client_leads WHERE lead_id = ?",
        args: [parseInt(id)],
      });
      for (const clientId of clientIds) {
        await db.execute({
          sql: "INSERT OR IGNORE INTO client_leads (client_id, lead_id) VALUES (?, ?)",
          args: [clientId, parseInt(id)],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
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
    await requireAuth();
    const { id } = await params;

    await db.execute({
      sql: "DELETE FROM leads WHERE id = ?",
      args: [parseInt(id)],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
