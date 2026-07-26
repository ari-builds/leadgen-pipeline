const db = require('./db');

async function main() {
  const leads = await db.execute('SELECT id, company_name, contact_name, contact_email, contact_phone, contact_linkedin, notes FROM leads');
  const withEmail = leads.rows.filter(r => r.contact_email && r.contact_email !== '');
  const withPhone = leads.rows.filter(r => r.contact_phone && r.contact_phone !== '');
  const withLinkedin = leads.rows.filter(r => r.contact_linkedin && r.contact_linkedin !== '');
  console.log(`Local DB: ${leads.rows.length} total, ${withEmail.length} with email, ${withPhone.length} with phone, ${withLinkedin.length} with LinkedIn`);
}

main().catch(console.error);
