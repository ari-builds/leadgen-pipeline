const {createClient} = require('@libsql/client');
const db = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  const t = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables:', t.rows.map(r => r.name).join(', '));
  
  // Check lead_deliveries
  try {
    const d = await db.execute("PRAGMA table_info(lead_deliveries)");
    console.log('lead_deliveries cols:', d.rows.map(r => r.name).join(', '));
  } catch(e) { console.log('lead_deliveries:', e.message); }
  
  // Check client_subscriptions  
  try {
    const s = await db.execute("PRAGMA table_info(client_subscriptions)");
    console.log('client_subscriptions cols:', s.rows.map(r => r.name).join(', '));
  } catch(e) { console.log('client_subscriptions:', e.message); }

  // Try the exact OTP query that fails
  try {
    const otp = await db.execute({
      sql: "SELECT id FROM otp_codes WHERE code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1",
      args: ['145085']
    });
    console.log('OTP lookup result:', JSON.stringify(otp.rows));
  } catch(e) { console.log('OTP query FAILED:', e.message); }

  // Try the leads query
  try {
    const leads = await db.execute({
      sql: `SELECT l.id, l.company_name, l.contact_name, l.industry, l.location, l.score, l.status, l.notes, l.contact_email, l.contact_phone FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 1 ORDER BY l.score DESC`,
      args: []
    });
    console.log('Leads query OK:', leads.rows.length, 'rows');
  } catch(e) { console.log('Leads query FAILED:', e.message); }

  // Try the subscription query
  try {
    const sub = await db.execute({
      sql: "SELECT monthly_lead_quota, reset_day, current_period_start, last_export_at FROM client_subscriptions WHERE client_id = 1 ORDER BY id DESC LIMIT 1",
      args: []
    });
    console.log('Sub query OK:', JSON.stringify(sub.rows));
  } catch(e) { console.log('Sub query FAILED:', e.message); }

  // Try delivery query
  try {
    const del = await db.execute({
      sql: "SELECT exported FROM lead_deliveries WHERE client_id = 1 AND exported = 1 AND period_start >= '2026-07-01' ORDER BY id DESC LIMIT 1",
      args: []
    });
    console.log('Delivery query OK:', JSON.stringify(del.rows));
  } catch(e) { console.log('Delivery query FAILED:', e.message); }
}

main().catch(console.error);
