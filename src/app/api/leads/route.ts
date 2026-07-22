import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const minScore = searchParams.get("minScore");
    const search = searchParams.get("search");

    let sql = `
      SELECT l.*, GROUP_CONCAT(c.name) as client_names, GROUP_CONCAT(c.id) as client_ids
      FROM leads l
      LEFT JOIN client_leads cl ON l.id = cl.lead_id
      LEFT JOIN clients c ON cl.client_id = c.id
    `;
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (clientId) {
      conditions.push("cl.client_id = ?");
      args.push(parseInt(clientId));
    }
    if (status) {
      conditions.push("l.status = ?");
      args.push(status);
    }
    if (minScore) {
      conditions.push("l.score >= ?");
      args.push(parseInt(minScore));
    }
    if (search) {
      conditions.push("(l.company_name LIKE ? OR l.contact_name LIKE ? OR l.contact_email LIKE ?)");
      const searchTerm = `%${search}%`;
      args.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " GROUP BY l.id ORDER BY l.created_at DESC";

    const result = await db.execute({ sql, args });
    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const data = await req.json();
    const { clientIds, ...leadData } = data;

    const result = await db.execute({
      sql: `INSERT INTO leads (
        company_name, website_url, industry, contact_name, contact_email,
        contact_phone, contact_linkedin, contact_title, tech_stack,
        company_size, revenue_range, location, what_they_sell,
        pain_points, competitors, recent_news, score, status, notes,
        source_url, raw_scrape
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        leadData.companyName || null,
        leadData.websiteUrl || null,
        leadData.industry || null,
        leadData.contactName || null,
        leadData.contactEmail || null,
        leadData.contactPhone || null,
        leadData.contactLinkedin || null,
        leadData.contactTitle || null,
        leadData.techStack || null,
        leadData.companySize || null,
        leadData.revenueRange || null,
        leadData.location || null,
        leadData.whatTheySell || null,
        leadData.painPoints || null,
        leadData.competitors || null,
        leadData.recentNews || null,
        leadData.score || 0,
        leadData.status || "new",
        leadData.notes || null,
        leadData.sourceUrl || null,
        leadData.rawScrape ? JSON.stringify(leadData.rawScrape) : null,
      ],
    });

    const leadId = result.lastInsertRowid;

    // Assign to clients
    if (clientIds && Array.isArray(clientIds)) {
      for (const clientId of clientIds) {
        await db.execute({
          sql: "INSERT OR IGNORE INTO client_leads (client_id, lead_id) VALUES (?, ?)",
          args: [clientId, leadId],
        });
      }
    }

    return NextResponse.json({ success: true, id: leadId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
