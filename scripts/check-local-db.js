const { createClient } = require("@libsql/client");

const localDb = createClient({ url: "file:local.db" });

async function check() {
  try {
    const leads = await localDb.execute("SELECT COUNT(*) as count FROM leads");
    console.log("Local leads count:", leads.rows[0].count);

    const sample = await localDb.execute("SELECT id, company_name, contact_name, contact_email, score, location, source_url FROM leads LIMIT 10");
    console.log("Sample:", JSON.stringify(sample.rows, null, 2));

    const clients = await localDb.execute("SELECT id, name, slug FROM clients");
    console.log("\nClients:", JSON.stringify(clients.rows));

    const cl = await localDb.execute("SELECT COUNT(*) as count FROM client_leads");
    console.log("client_leads:", cl.rows[0].count);

    const emails = await localDb.execute("SELECT COUNT(*) as count FROM outreach_emails");
    console.log("outreach_emails:", emails.rows[0].count);

    // Check tables
    const tables = await localDb.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log("\nTables:", JSON.stringify(tables.rows.map(r => r.name)));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

check();
