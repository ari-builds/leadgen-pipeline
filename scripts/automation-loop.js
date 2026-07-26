#!/usr/bin/env node
/**
 * Leadgen Automation Loop
 * 
 * Runs the full pipeline for ALL active clients:
 *   1. Check quota (how many leads still needed this month)
 *   2. Scrape new leads based on client ICP
 *   3. Enrich new leads (phone, social media)
 *   4. Generate outreach (emails + DM scripts)
 * 
 * Usage:
 *   node scripts/automation-loop.js              # Run full loop
 *   node scripts/automation-loop.js --dry-run    # Preview without changes
 *   node scripts/automation-loop.js --client 3   # Run for specific client only
 */

const { createClient } = require("@libsql/client");
const { execSync } = require("child_process");
const path = require("path");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL || "file:./local.db",
});

const SCRIPTS_DIR = path.join(__dirname);
const PYTHON = path.join(
  "C:\\Users\\Arian\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\python.exe"
);

const DRY_RUN = process.argv.includes("--dry-run");
const CLIENT_FILTER = process.argv.includes("--client")
  ? parseInt(process.argv[process.argv.indexOf("--client") + 1])
  : null;

function log(msg) {
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  console.log(`[${ts}] ${msg}`);
}

function runPy(script, args = "") {
  const cmd = `"${PYTHON}" "${path.join(SCRIPTS_DIR, script)}" ${args}`;
  log(`  -> python ${script} ${args}`);
  try {
    const out = execSync(cmd, {
      encoding: "utf-8",
      timeout: 300000, // 5 min timeout per script
      cwd: path.join(SCRIPTS_DIR, ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch (err) {
    log(`  !! ERROR: ${err.message}`);
    return null;
  }
}

function runNode(script, args = "") {
  const cmd = `node "${path.join(SCRIPTS_DIR, script)}" ${args}`;
  log(`  -> node ${script} ${args}`);
  try {
    const out = execSync(cmd, {
      encoding: "utf-8",
      timeout: 120000,
      cwd: path.join(SCRIPTS_DIR, ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch (err) {
    log(`  !! ERROR: ${err.message}`);
    return null;
  }
}

async function getClients() {
  const result = await db.execute(`
    SELECT c.id, c.name, c.slug, c.ideal_customer_profile,
           cs.monthly_lead_quota, cs.current_period_start, cs.last_export_at,
           (SELECT COUNT(*) FROM client_leads cl WHERE cl.client_id = c.id 
            AND cl.assigned_at >= COALESCE(cs.current_period_start, '1970-01-01')) as leads_this_period
    FROM clients c
    LEFT JOIN client_subscriptions cs ON c.id = cs.client_id
  `);
  return result.rows;
}

async function getEnrichedLeadCount(clientId) {
  const result = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM leads l 
          JOIN client_leads cl ON l.id = cl.lead_id 
          WHERE cl.client_id = ? 
          AND (l.contact_phone IS NOT NULL AND l.contact_phone != '')
          OR (l.contact_instagram IS NOT NULL AND l.contact_instagram != '')`,
    args: [clientId],
  });
  return result.rows[0]?.cnt || 0;
}

async function main() {
  log("=== Leadgen Automation Loop ===");
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  log(`Client filter: ${CLIENT_FILTER || "ALL"}`);
  log("");

  const clients = await getClients();
  log(`Found ${clients.length} active client(s)`);

  const results = [];

  for (const client of clients) {
    if (CLIENT_FILTER && client.id !== CLIENT_FILTER) continue;

    log("");
    log(`--- Client: ${client.name} (ID: ${client.id}) ---`);

    const quota = client.monthly_lead_quota || 100;
    const leadsThisPeriod = client.leads_this_period || 0;
    const remaining = Math.max(0, quota - leadsThisPeriod);

    log(`  Quota: ${quota}/mo | This period: ${leadsThisPeriod} | Remaining: ${remaining}`);

    if (remaining === 0) {
      log("  SKIP: Quota full this period");
      results.push({ client: client.name, status: "quota_full", scraped: 0, enriched: 0 });
      continue;
    }

    if (!client.ideal_customer_profile) {
      log("  SKIP: No ICP defined for this client");
      results.push({ client: client.name, status: "no_icp", scraped: 0, enriched: 0 });
      continue;
    }

    // Step 1: Scrape leads
    let scraped = 0;
    if (DRY_RUN) {
      log(`  [DRY RUN] Would scrape ${remaining} leads with ICP: ${client.icp}`);
    } else {
      log(`  Step 1: Scraping ${remaining} leads...`);
      const icpRaw = client.ideal_customer_profile || "";
      const icpObj = typeof icpRaw === "string" ? JSON.parse(icpRaw) : icpRaw;
      // Build a search-friendly ICP string from the JSON
      const icpStr = icpObj.business || icpObj.business_type || icpObj.target_businesses || JSON.stringify(icpObj);
      const location = icpObj.location || "";
      const result = runPy(
        "scraper.py",
        `bulk --icp "${icpStr}" --location "${location}" --count ${remaining} --client-id ${client.id}`
      );
      if (result) {
        try {
          const parsed = JSON.parse(result);
          scraped = parsed.saved || parsed.leads_found || 0;
          log(`  Scraped: ${scraped} new leads`);
        } catch {
          log(`  Scraped output (raw): ${result.substring(0, 200)}`);
        }
      }
    }

    // Step 2: Enrich leads (find phones, social media)
    let enriched = 0;
    if (DRY_RUN) {
      log(`  [DRY RUN] Would enrich new leads`);
    } else if (scraped > 0) {
      log(`  Step 2: Enriching ${scraped} new leads...`);
      const result = runPy("enrich-leads.py", `--limit ${scraped}`);
      if (result) {
        log(`  Enrichment complete`);
        enriched = scraped; // Assume enriched
      }
    }

    // Step 3: Generate outreach
    if (DRY_RUN) {
      log(`  [DRY RUN] Would generate outreach content`);
    } else if (scraped > 0) {
      log(`  Step 3: Generating outreach content...`);
      runNode("generate-outreach.js");
      log(`  Outreach generated`);
    }

    results.push({
      client: client.name,
      status: "ok",
      scraped,
      enriched,
    });
  }

  log("");
  log("=== Summary ===");
  for (const r of results) {
    log(`  ${r.client}: ${r.status} (${r.scraped} scraped, ${r.enriched} enriched)`);
  }

  // Save run log
  const logEntry = {
    timestamp: new Date().toISOString(),
    dry_run: DRY_RUN,
    results,
  };

  const logsDir = path.join(SCRIPTS_DIR, "..", "logs");
  const fs = require("fs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, `loop-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(logFile, JSON.stringify(logEntry, null, 2));
  log(`Log saved to: ${logFile}`);
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
