const db = require('./db');
const bcrypt = require('bcryptjs');

async function main() {
  const existing = await db.execute({ sql: 'SELECT id FROM clients WHERE slug = ?', args: ['ashes-niloy'] });
  if (existing.rows.length > 0) {
    console.log('Client already exists with ID:', existing.rows[0].id);
    return;
  }

  const hash = bcrypt.hashSync('Niloy2026!', 10);

  const icp = JSON.stringify({
    business_type: 'Web Development / Software Engineering Services',
    target_businesses: 'Small to medium businesses without websites or with outdated websites',
    industries: ['Restaurants', 'Retail Shops', 'Clinics', 'Real Estate', 'Education', 'E-commerce'],
    location: 'Dhaka, Bangladesh',
    radius: 'Dhaka metro area',
    keywords: ['website development', 'web design', 'landing page', 'e-commerce website', 'business website', 'Angular development', 'Laravel API', 'React development'],
    min_employees: '1-50',
    exclude: ['Already has modern website', 'Tech companies', 'Agencies'],
    notes: 'Niloy is a full-stack developer (Angular, Laravel, React, .NET). Trial client - 50 leads. Focus on businesses that need websites built or redesigned.'
  });

  const result = await db.execute({
    sql: "INSERT INTO clients (name, slug, description, ideal_customer_profile, dashboard_password_hash, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    args: [
      'Ashes Niloy - Web Development',
      'ashes-niloy',
      'Full-Stack Developer (Angular, Laravel, React, .NET) based in Dhaka, Bangladesh. Trial client - 50 leads.',
      icp,
      hash
    ]
  });

  const clientId = Number(result.lastInsertRowid);
  console.log('Client created! ID:', clientId);

  await db.execute({
    sql: "INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start, created_at) VALUES (?, 50, 1, datetime('now'), datetime('now'))",
    args: [clientId]
  });
  console.log('Subscription: 50 leads/month (trial)');

  const client = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [clientId] });
  console.log('Client:', JSON.stringify(client.rows[0], null, 2));
}

main().catch(console.error);
