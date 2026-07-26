const db = require('./db');
const bcrypt = require('bcryptjs');

async function main() {
  // Maria Khan
  const existing1 = await db.execute({ sql: 'SELECT id FROM clients WHERE slug = ?', args: ['maria-khan'] });
  if (existing1.rows.length === 0) {
    const hash = bcrypt.hashSync('Khan2026!', 10);
    const result = await db.execute({
      sql: "INSERT INTO clients (name, slug, description, dashboard_password_hash, contact_email, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      args: ['Maria Khan', 'maria-khan', 'Client — Maria Khan', hash, 'maria@khan.com']
    });
    const clientId = Number(result.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start, created_at) VALUES (?, 100, 1, datetime('now'), datetime('now'))",
      args: [clientId]
    });
    console.log('✅ Maria Khan added — ID:', clientId, '| slug: maria-khan | pw: Khan2026!');
  } else {
    console.log('Maria Khan already exists — ID:', existing1.rows[0].id);
  }

  // Ethan Grandet & Carter Garcia
  const existing2 = await db.execute({ sql: 'SELECT id FROM clients WHERE slug = ?', args: ['ethan-garcia'] });
  if (existing2.rows.length === 0) {
    const hash = bcrypt.hashSync('GrandGarcia2026!', 10);
    const result = await db.execute({
      sql: "INSERT INTO clients (name, slug, description, dashboard_password_hash, contact_email, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      args: ['Ethan Grandet & Carter Garcia', 'ethan-garcia', 'Client — Ethan Grandet & Carter Garcia', hash, 'ethan@grandet-garcia.com']
    });
    const clientId = Number(result.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start, created_at) VALUES (?, 100, 1, datetime('now'), datetime('now'))",
      args: [clientId]
    });
    console.log('✅ Ethan Grandet & Carter Garcia added — ID:', clientId, '| slug: ethan-garcia | pw: GrandGarcia2026!');
  } else {
    console.log('Ethan Garcia already exists — ID:', existing2.rows[0].id);
  }

  // Show all clients
  const all = await db.execute({ sql: 'SELECT id, name, slug FROM clients ORDER BY id', args: [] });
  console.log('\nAll clients:', JSON.stringify(all.rows, null, 2));
}

main().catch(console.error);
