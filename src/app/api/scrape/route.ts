import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import db from "@/lib/db";
import { execSync } from "child_process";
import path from "path";

const PYTHON = "C:\\Users\\Arian\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\python.exe";
const SCRAPER = path.join(process.cwd(), "scripts", "scraper.py");

function runScraper(args: string[], timeout = 30000): string {
  try {
    const result = execSync(`"${PYTHON}" "${SCRAPER}" ${args.map((a) => `"${a}"`).join(" ")}`, {
      encoding: "utf-8",
      timeout,
      maxBuffer: 10 * 1024 * 1024,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Scraper failed: ${msg}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveLeadToDb(info: any, clientId?: number): Promise<number> {
  // Skip leads with no contact info at all
  const hasEmail = info.emails && info.emails.length > 0 && info.emails[0];
  const hasPhone = info.phones && info.phones.length > 0 && info.phones[0];
  const hasSocial = info.social && Object.keys(info.social).length > 0;
  if (!hasEmail && !hasPhone && !hasSocial) {
    return -1; // Signal: no contact info, skip
  }

  // Deduplicate by website URL
  if (info.website) {
    const existing = await db.execute({
      sql: "SELECT id FROM leads WHERE website = ?",
      args: [info.website],
    });
    if (existing.rows.length > 0) {
      // Link to client if needed
      if (clientId) {
        await db.execute({
          sql: "INSERT OR IGNORE INTO client_leads (client_id, lead_id, assigned_by) VALUES (?, ?, 'admin')",
          args: [clientId, Number(existing.rows[0].id)],
        });
      }
      return Number(existing.rows[0].id);
    }
  }

  const leadResult = await db.execute({
    sql: `INSERT INTO leads (company_name, contact_email, website, industry, location, notes, score, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      info.company_name || "",
      info.emails?.[0] || "",
      info.website || "",
      info.industry_hint || "",
      info.location || "",
      [
        info.description ? `Description: ${info.description}` : "",
        info.phones?.length ? `Phones: ${info.phones.join(", ")}` : "",
        info.social && Object.keys(info.social).length ? `Social: ${JSON.stringify(info.social)}` : "",
        info.source_query ? `Source: ${info.source_query}` : "",
      ].filter(Boolean).join(" | "),
      5,
      "new",
    ],
  });

  const leadId = Number(leadResult.lastInsertRowid);

  if (clientId) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO client_leads (client_id, lead_id, assigned_by) VALUES (?, ?, 'admin')",
      args: [clientId, leadId],
    });
  }

  return leadId;
}

// POST /api/scrape
export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "search": {
        const { query } = body;
        if (!query) {
          return NextResponse.json({ error: "query is required" }, { status: 400 });
        }
        const raw = runScraper(["search", query]);
        return NextResponse.json(JSON.parse(raw));
      }

      case "scrape": {
        const { url } = body;
        if (!url) {
          return NextResponse.json({ error: "url is required" }, { status: 400 });
        }
        const raw = runScraper(["scrape", url]);
        return NextResponse.json(JSON.parse(raw));
      }

      case "scrape_and_save": {
        const { url, clientId } = body;
        if (!url) {
          return NextResponse.json({ error: "url is required" }, { status: 400 });
        }
        const raw = runScraper(["scrape", url]);
        const info = JSON.parse(raw);
        if (info.error) {
          return NextResponse.json({ error: info.error }, { status: 500 });
        }
        // Check contact info before saving
        const hasEmail2 = info.emails && info.emails.length > 0 && info.emails[0];
        const hasPhone2 = info.phones && info.phones.length > 0 && info.phones[0];
        const hasSocial2 = info.social && Object.keys(info.social).length > 0;
        if (!hasEmail2 && !hasPhone2 && !hasSocial2) {
          return NextResponse.json({ error: "No contact info found for this lead — skipped" }, { status: 400 });
        }
        const leadId = await saveLeadToDb(info, clientId);
        return NextResponse.json({ ...info, lead_id: leadId });
      }

      case "bulk": {
        const { icp, location, count, clientId } = body;
        if (!icp) {
          return NextResponse.json({ error: "icp is required" }, { status: 400 });
        }
        const targetCount = Math.min(Number(count) || 50, 200);

        // Run the Python bulk scraper (longer timeout for bulk operations)
        const args = ["bulk", "--icp", icp, "--count", String(targetCount)];
        if (location) args.push("--location", location);
        if (clientId) args.push("--client-id", String(clientId));

        const raw = runScraper(args, 5 * 60 * 1000); // 5 minute timeout
        const result = JSON.parse(raw);

        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Save each lead to DB (skip leads with no contact info)
        const savedLeads = [];
        let skippedNoContact = 0;
        for (const lead of result.leads || []) {
          try {
            const leadId = await saveLeadToDb(lead, clientId);
            if (leadId === -1) {
              skippedNoContact++;
              continue;
            }
            savedLeads.push({ ...lead, lead_id: leadId });
          } catch {
            // Skip failed saves
          }
        }

        return NextResponse.json({
          icp: result.icp,
          location: result.location,
          queries_used: result.queries_used,
          total_urls_found: result.total_urls_found,
          total_scraped: result.total_scraped,
          total_saved: savedLeads.length,
          skipped_no_contact: skippedNoContact,
          leads: savedLeads,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
