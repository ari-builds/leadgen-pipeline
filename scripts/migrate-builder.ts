import db from '../src/lib/db';

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS built_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      business_category TEXT,
      business_phone TEXT,
      business_email TEXT,
      business_address TEXT,
      business_hours TEXT,
      tagline TEXT,
      description TEXT,
      primary_color TEXT DEFAULT 'blue-600',
      industry TEXT DEFAULT 'professional',
      site_url TEXT,
      vercel_url TEXT,
      status TEXT DEFAULT 'draft',
      preview_html TEXT,
      pitch_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deployed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('built_sites table ready');
}

migrate().catch(console.error);
