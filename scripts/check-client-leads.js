const { createClient } = require("@libsql/client");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function check() {
  const cl = await db.execute("SELECT COUNT(*) as count FROM client_leads");
  console.log("client_leads count:", cl.rows[0].count);

  const leads = await db.execute("SELECT COUNT(*) as count FROM leads");
  console.log("leads count:", leads.rows[0].count);

  const sampleLeads = await db.execute("SELECT id, company_name, contact_name, score, client_id FROM leads LIMIT 5");
  console.log("Sample leads:", JSON.stringify(sampleLeads.rows));

  // Check if leads have client_id column
  const cols = await db.execute("PRAGMA table_info(leads)");
  console.log("Lead columns:", JSON.stringify(cols.rows.map(r => r.name)));
}

check().catch(console.error);
