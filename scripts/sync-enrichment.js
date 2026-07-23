const {createClient} = require('@libsql/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const tursoToken = process.env.TURSO_TOKEN;
const localDb = createClient({url:'file:./local.db'});
const tursoDb = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: tursoToken
});

async function main() {
  // 1. Check local.db enrichment
  const localLeads = await localDb.execute('SELECT id, company_name, contact_name, contact_email, contact_phone, contact_linkedin, notes FROM leads');
  const withEmail = localLeads.rows.filter(r => r.contact_email && r.contact_email !== '');
  const withPhone = localLeads.rows.filter(r => r.contact_phone && r.contact_phone !== '');
  const withLinkedin = localLeads.rows.filter(r => r.contact_linkedin && r.contact_linkedin !== '');
  console.log(`Local DB: ${localLeads.rows.length} total, ${withEmail.length} with email, ${withPhone.length} with phone, ${withLinkedin.length} with LinkedIn`);

  // 2. Get Turso leads
  const tursoLeads = await tursoDb.execute('SELECT id, company_name, contact_name, contact_email, contact_phone, contact_linkedin, notes FROM leads');
  const tursoWithEmail = tursoLeads.rows.filter(r => r.contact_email && r.contact_email !== '');
  const tursoWithPhone = tursoLeads.rows.filter(r => r.contact_phone && r.contact_phone !== '');
  console.log(`Turso: ${tursoLeads.rows.length} total, ${tursoWithEmail.length} with email, ${tursoWithPhone.length} with phone`);

  // 3. Match by contact_name and copy enrichment data from local to turso
  let updated = 0;
  for (const tursoLead of tursoLeads.rows) {
    const match = localLeads.rows.find(l => 
      l.contact_name && tursoLead.contact_name && 
      l.contact_name.toLowerCase() === tursoLead.contact_name.toLowerCase()
    );
    if (match && (match.contact_email || match.contact_phone || match.contact_linkedin)) {
      await tursoDb.execute({
        sql: `UPDATE leads SET contact_email = ?, contact_phone = ?, contact_linkedin = ?, notes = ? WHERE id = ?`,
        args: [
          match.contact_email || tursoLead.contact_email || '',
          match.contact_phone || tursoLead.contact_phone || '',
          match.contact_linkedin || tursoLead.contact_linkedin || '',
          match.notes || tursoLead.notes || '',
          tursoLead.id
        ]
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} leads in Turso with enriched data from local.db`);

  // 4. Verify
  const check = await tursoDb.execute('SELECT COUNT(*) as c FROM leads WHERE contact_email IS NOT NULL AND contact_email != ""');
  const checkPhone = await tursoDb.execute('SELECT COUNT(*) as c FROM leads WHERE contact_phone IS NOT NULL AND contact_phone != ""');
  console.log(`After update: ${check.rows[0].c} with email, ${checkPhone.rows[0].c} with phone`);
}

main().catch(console.error);
