const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODUxMDExNzgsImlkIjoiMDE5ZmEwNTItNTUwMS03YmYyLTkwY2UtYzA3NzM0MzI4YTg3Iiwia2lkIjoiWXRDZ0VtRDJFenJISVdQUkVwbkNPZWdmZUdmcEpTN3dwY0p0cVdMQXdXayIsInJpZCI6IjU0NjM5NDI1LTBhNmUtNGZlYS1iYzVlLWRhYTQwNzdiOGI3NCJ9.yrGxTRNTbKWzJO9XKN_yWjmU_smBTyoKu9ZDXlMMINItQ3NupHZdS7dbGrojAACiCSYP6Dv13F7u9EJAVnYUAA'
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
