const { createClient } = require("@libsql/client");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function fix() {
  // 1. Check users
  const users = await db.execute("SELECT id, email, role FROM users");
  console.log("Users:", JSON.stringify(users.rows));

  // 2. Create outreach tables
  await db.batch([
    `CREATE TABLE IF NOT EXISTS outreach_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      template_type TEXT,
      subject TEXT,
      body TEXT,
      status TEXT DEFAULT 'draft',
      resend_email_id TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS outreach_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      platform TEXT,
      status TEXT DEFAULT 'active',
      last_message_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS outreach_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER REFERENCES outreach_threads(id) ON DELETE CASCADE,
      direction TEXT,
      platform TEXT,
      content TEXT NOT NULL,
      is_ai_generated INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ]);
  console.log("Outreach tables created!");

  // 3. Add new social media columns (IF NOT EXISTS)
  const alterStatements = [
    "ALTER TABLE leads ADD COLUMN contact_twitter TEXT",
    "ALTER TABLE leads ADD COLUMN contact_facebook TEXT",
    "ALTER TABLE leads ADD COLUMN contact_instagram TEXT",
  ];
  for (const sql of alterStatements) {
    try {
      await db.execute(sql);
      console.log("Added column:", sql.match(/ADD COLUMN (\S+)/)[1]);
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log("Column already exists:", sql.match(/ADD COLUMN (\S+)/)[1]);
      } else {
        console.error("Error:", e.message);
      }
    }
  }

  // 4. Create client_subscriptions table
  await db.batch([
    `CREATE TABLE IF NOT EXISTS client_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
      monthly_lead_quota INTEGER DEFAULT 100,
      reset_day INTEGER DEFAULT 1,
      current_period_start DATE,
      last_export_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lead_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      lead_count INTEGER DEFAULT 0,
      exported INTEGER DEFAULT 0,
      exported_at DATETIME,
      export_formats TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ]);
  console.log("Subscription tables created!");

  // 5. Create subscription for client_id 1 (Joseph)
  const existing = await db.execute(
    "SELECT id FROM client_subscriptions WHERE client_id = 1"
  );
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start)
            VALUES (1, 100, 1, '2026-07-01')`,
      args: [],
    });
    console.log("Created subscription for client 1 (100 leads/month, resets 1st)");
  } else {
    console.log("Subscription for client 1 already exists");
  }

  // 6. Verify
  const tables2 = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log("\nAll tables:", JSON.stringify(tables2.rows.map((r) => r.name)));

  const emailsCount = await db.execute("SELECT COUNT(*) as count FROM outreach_emails");
  console.log("Outreach emails:", emailsCount.rows[0].count);
}

fix().catch((e) => console.error(e));
