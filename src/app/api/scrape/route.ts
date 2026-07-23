import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import db from "@/lib/db";
import { execSync } from "child_process";
import path from "path";

const PYTHON = "C:\\Users\\Arian\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\python.exe";
const SCRAPER = path.join(process.cwd(), "scripts", "scraper.py");

function runScraper(args: string[]): string {
  try {
    const result = execSync(`"${PYTHON}" "${SCRAPER}" ${args.map((a) => `"${a}"`).join(" ")}`, {
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Scraper failed: ${msg}`);
  }
}

// POST /api/scrape - search, scrape, or enrich
export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { action, query, url, clientId } = body;

    switch (action) {
      case "search": {
        if (!query) {
          return NextResponse.json({ error: "query is required" }, { status: 400 });
        }
        const raw = runScraper(["search", query]);
        const result = JSON.parse(raw);
        return NextResponse.json(result);
      }

      case "scrape": {
        if (!url) {
          return NextResponse.json({ error: "url is required" }, { status: 400 });
        }
        const raw = runScraper(["scrape", url]);
        const result = JSON.parse(raw);
        return NextResponse.json(result);
      }

      case "scrape_and_save": {
        if (!url) {
          return NextResponse.json({ error: "url is required" }, { status: 400 });
        }
        const raw = runScraper(["scrape", url]);
        const info = JSON.parse(raw);

        if (info.error) {
          return NextResponse.json({ error: info.error }, { status: 500 });
        }

        // Insert lead into DB
        const leadResult = await db.execute({
          sql: `INSERT INTO leads (company_name, contact_email, website, industry, location, notes, score, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            info.company_name || "",
            info.emails?.[0] || "",
            info.website || url,
            info.industry_hint || "",
            "",
            `Auto-scraped. Phones: ${(info.phones || []).join(", ")}. Social: ${JSON.stringify(info.social || {})}`,
            5, // default score
            "new",
          ],
        });

        const leadId = Number(leadResult.lastInsertRowid);

        // If clientId provided, link lead to client
        if (clientId) {
          await db.execute({
            sql: `INSERT OR IGNORE INTO client_leads (client_id, lead_id, assigned_by) VALUES (?, ?, 'admin')`,
            args: [clientId, leadId],
          });
        }

        return NextResponse.json({ ...info, lead_id: leadId });
      }

      case "bulk_search": {
        if (!query) {
          return NextResponse.json({ error: "query is required" }, { status: 400 });
        }

        // Search + scrape top results
        const searchRaw = runScraper(["search", query]);
        const searchData = JSON.parse(searchRaw);

        if (searchData.error) {
          return NextResponse.json({ error: searchData.error }, { status: 500 });
        }

        const results = [];
        const urls = (searchData.results || [])
          .filter((r: { url: string }) => {
            try {
              const host = new URL(r.url).hostname;
              return !host.includes("yelp.com") && !host.includes("google.com") && !host.includes("facebook.com");
            } catch {
              return false;
            }
          })
          .slice(0, 8);

        for (const item of urls) {
          try {
            const scrapeRaw = runScraper(["scrape", item.url]);
            const info = JSON.parse(scrapeRaw);
            if (!info.error && info.company_name) {
              // Insert into DB
              const insertResult = await db.execute({
                sql: `INSERT INTO leads (company_name, contact_email, website, industry, location, notes, score, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  info.company_name || item.title || "",
                  info.emails?.[0] || "",
                  info.website || item.url,
                  info.industry_hint || "",
                  "",
                  `Bulk-scraped from: ${query}. Phones: ${(info.phones || []).join(", ")}`,
                  5,
                  "new",
                ],
              });

              if (clientId) {
                await db.execute({
                  sql: `INSERT OR IGNORE INTO client_leads (client_id, lead_id, assigned_by) VALUES (?, ?, 'admin')`,
                  args: [clientId, Number(insertResult.lastInsertRowid)],
                });
              }

              results.push({ ...info, lead_id: Number(insertResult.lastInsertRowid) });
            }
          } catch {
            // Skip failed scrapes
          }
        }

        return NextResponse.json({
          query,
          total_found: results.length,
          leads: results,
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
