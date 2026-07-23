import db from "../src/lib/db";

async function setup() {
  console.log("Setting up database...");

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      ideal_customer_profile TEXT,
      dashboard_password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      website_url TEXT,
      industry TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      contact_linkedin TEXT,
      contact_title TEXT,
      tech_stack TEXT,
      company_size TEXT,
      revenue_range TEXT,
      location TEXT,
      what_they_sell TEXT,
      pain_points TEXT,
      competitors TEXT,
      recent_news TEXT,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      notes TEXT,
      source_url TEXT,
      raw_scrape TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS client_leads (
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id, lead_id)
    )`,
    `CREATE TABLE IF NOT EXISTS client_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      site_url TEXT NOT NULL,
      password_encrypted TEXT NOT NULL,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
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

  console.log("Database setup complete!");
  process.exit(0);
}

setup().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
