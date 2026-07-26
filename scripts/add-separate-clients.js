const db = require('./db');
const bcrypt = require('bcryptjs');

async function main() {
  // Ethan Grandet
  const e1 = await db.execute({ sql: "SELECT id FROM clients WHERE slug = ?", args: ['ethan-grandet'] });
  if (e1.rows.length === 0) {
    const hash = bcrypt.hashSync('Grandet2026!', 10);
    const result = await db.execute({
      sql: "INSERT INTO clients (name, slug, description, dashboard_password_hash, contact_email, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      args: ['Ethan Grandet', 'ethan-grandet', 'Client — Ethan Grandet', hash, 'ethan@grandet.com']
    });
    const clientId = Number(result.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start, created_at) VALUES (?, 100, 1, datetime('now'), datetime('now'))",
      args: [clientId]
    });
    console.log('✅ Ethan Grandet — ID:', clientId, '| slug: ethan-grandet | pw: Grandet2026!');
  } else {
    console.log('Ethan Grandet already exists — ID:', e1.rows[0].id);
  }

  // Carter Garcia
  const e2 = await db.execute({ sql: "SELECT id FROM clients WHERE slug = ?", args: ['carter-garcia'] });
  if (e2.rows.length === 0) {
    const hash = bcrypt.hashSync('Garcia2026!', 10);
    const result = await db.execute({
      sql: "INSERT INTO clients (name, slug, description, dashboard_password_hash, contact_email, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      args: ['Carter Garcia', 'carter-garcia', 'Client — Carter Garcia', hash, 'carter@garcia.com']
    });
    const clientId = Number(result.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start, created_at) VALUES (?, 100, 1, datetime('now'), datetime('now'))",
      args: [clientId]
    });
    console.log('✅ Carter Garcia — ID:', clientId, '| slug: carter-garcia | pw: Garcia2026!');
  } else {
    console.log('Carter Garcia already exists — ID:', e2.rows[0].id);
  }

  // Final list
  const all = await db.execute({ sql: 'SELECT id, name, slug FROM clients ORDER BY id', args: [] });
  console.log('\nAll clients:', JSON.stringify(all.rows, null, 2));
}

main().catch(console.error);
