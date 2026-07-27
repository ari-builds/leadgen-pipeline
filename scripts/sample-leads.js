const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function sample() {
  const r = await db.execute(`SELECT company_name, contact_name, contact_email, contact_phone, location, notes FROM leads WHERE contact_email IS NOT NULL AND contact_email != '' LIMIT 5`);
  for (const row of r.rows) {
    console.log('---');
    console.log('Company:', row.company_name);
    console.log('Location:', row.location);
    console.log('Notes:', (row.notes || '').substring(0, 600));
  }
  
  // Also check what social media patterns exist
  const social = await db.execute(`SELECT notes FROM leads WHERE notes LIKE '%instagram%' OR notes LIKE '%facebook%' OR notes LIKE '%twitter%' OR notes LIKE '%linkedin%' LIMIT 3`);
  console.log('\n=== Social media examples ===');
  for (const s of social.rows) {
    console.log('---');
    console.log((s.notes || '').substring(0, 600));
  }
}

sample().catch(e => console.error(e));
