const {createClient}=require('@libsql/client');
require('dotenv').config();
const db=createClient({url:'file:./local.db'});

async function test() {
  console.log('=== DB Connection: OK ===');
  
  const clients = await db.execute('SELECT id, name, slug FROM clients');
  console.log('Clients:', JSON.stringify(clients.rows));
  
  for (const c of clients.rows) {
    const leads = await db.execute({sql:'SELECT COUNT(*) as cnt FROM client_leads WHERE client_id=?', args:[c.id]});
    console.log('  ' + c.name + ': ' + leads.rows[0].cnt + ' leads');
  }
  
  const subs = await db.execute('SELECT client_id, monthly_lead_quota FROM client_subscriptions');
  console.log('Subscriptions:', JSON.stringify(subs.rows));
  
  const admin = await db.execute("SELECT email, role FROM users WHERE role='admin'");
  console.log('Admin:', JSON.stringify(admin.rows));
  
  const creds = await db.execute('SELECT id, name, slug, dashboard_password_hash IS NOT NULL as has_password FROM clients');
  console.log('Client auth:', JSON.stringify(creds.rows));
  
  const otps = await db.execute('SELECT COUNT(*) as cnt FROM otp_codes');
  console.log('OTP codes in DB:', otps.rows[0].cnt);
  
  const emails = await db.execute('SELECT COUNT(*) as cnt FROM outreach_emails');
  console.log('Outreach emails:', emails.rows[0].cnt);
  
  const threads = await db.execute('SELECT COUNT(*) as cnt FROM outreach_threads');
  console.log('DM threads:', threads.rows[0].cnt);
  
  const sampleLeads = await db.execute('SELECT l.id, l.company_name, l.score, l.contact_email, l.contact_phone FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=2 LIMIT 3');
  console.log('Sample leads (Joseph):', JSON.stringify(sampleLeads.rows));

  const niloyLeads = await db.execute('SELECT l.id, l.company_name, l.score, l.contact_email, l.contact_phone FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=3 LIMIT 3');
  console.log('Sample leads (Niloy):', JSON.stringify(niloyLeads.rows));
}
test().catch(e => console.error('ERROR:', e.message));
