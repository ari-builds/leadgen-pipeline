const { createClient } = require("@libsql/client");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function check() {
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log(
    "Tables:",
    JSON.stringify(tables.rows.map((r) => r.name))
  );

  const emails = await db.execute("SELECT COUNT(*) as count FROM outreach_emails");
  console.log("Outreach emails:", emails.rows[0].count);

  const users = await db.execute("SELECT id, email, role FROM users");
  console.log("Users:", JSON.stringify(users.rows));

  const threads = await db.execute("SELECT COUNT(*) as count FROM outreach_threads");
  console.log("DM threads:", threads.rows[0].count);
}

check().catch((e) => console.error(e));
