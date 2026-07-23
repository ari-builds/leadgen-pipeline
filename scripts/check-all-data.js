const { createClient } = require("@libsql/client");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function check() {
  const leads = await db.execute("SELECT id, company_name, contact_name, contact_email, score, location FROM leads");
  console.log("All leads:", JSON.stringify(leads.rows, null, 2));

  const clients = await db.execute("SELECT id, name, slug FROM clients");
  console.log("\nClients:", JSON.stringify(clients.rows, null, 2));

  const creds = await db.execute("SELECT id, client_id, label FROM client_credentials");
  console.log("\nCredentials:", JSON.stringify(creds.rows, null, 2));
}

check().catch(console.error);
