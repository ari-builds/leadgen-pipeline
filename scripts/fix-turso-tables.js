const {createClient} = require('@libsql/client');
const db = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  // Create missing tables
  await db.execute(`CREATE TABLE IF NOT EXISTS client_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    monthly_lead_quota INTEGER DEFAULT 100,
    reset_day INTEGER DEFAULT 1,
    current_period_start TEXT DEFAULT (date('now')),
    last_export_at TEXT,
    export_formats TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS lead_deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    period_start TEXT NOT NULL,
    exported INTEGER DEFAULT 0,
    exported_at TEXT,
    format TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  console.log('Created client_subscriptions and lead_deliveries tables');

  // Insert subscription for client 1
  const existing = await db.execute({
    sql: "SELECT id FROM client_subscriptions WHERE client_id = 1",
    args: []
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start) VALUES (1, 85, 1, date('now'))",
      args: []
    });
    console.log('Created subscription for client 1 (85 leads/month)');
  } else {
    console.log('Subscription already exists for client 1');
  }

  // Also add client_email to clients table for dual-email login
  try {
    await db.execute("ALTER TABLE clients ADD COLUMN contact_email TEXT");
    console.log('Added contact_email column to clients');
  } catch(e) {
    console.log('contact_email column already exists or error:', e.message);
  }

  // Set the client contact email
  await db.execute({
    sql: "UPDATE clients SET contact_email = 'legacymemorialrestorations@gmail.com' WHERE id = 1",
    args: []
  });
  console.log('Set client contact email to legacymemorialrestorations@gmail.com');

  // Verify
  const t = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('All tables:', t.rows.map(r => r.name).join(', '));
}

main().catch(console.error);
