const {createClient} = require('@libsql/client');
const r = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODUxMDExNzgsImlkIjoiMDE5ZmEwNTItNTUwMS03YmYyLTkwY2UtYzA3NzM0MzI4YTg3Iiwia2lkIjoiWXRDZ0VtRDJFenJISVdQUkVwbkNPZWdmZUdmcEpTN3dwY0p0cVdMQXdXayIsInJpZCI6IjU0NjM5NDI1LTBhNmUtNGZlYS1iYzVlLWRhYTQwNzdiOGI3NCJ9.yrGxTRNTbKWzJO9XKN_yWjmU_smBTyoKu9ZDXlMMINItQ3NupHZdS7dbGrojAACiCSYP6Dv13F7u9EJAVnYUAA'
});

async function check() {
  // Find leads with no email AND no phone
  const noContact = await r.execute(`
    SELECT l.id, l.company_name, l.contact_name, l.contact_email, l.contact_phone, l.notes, cl.client_id
    FROM leads l
    JOIN client_leads cl ON l.id = cl.lead_id
    WHERE (l.contact_email IS NULL OR l.contact_email = '')
    AND (l.contact_phone IS NULL OR l.contact_phone = '')
  `);
  console.log('Leads with NO email AND NO phone:', noContact.rows.length);
  
  let hasSocial = 0;
  let trulyNoContact = 0;
  const idsToRemove = [];
  
  for (const l of noContact.rows) {
    const notes = (l.notes || '').toLowerCase();
    const hasSocialAny = notes.includes('instagram.com') || notes.includes('facebook.com') || notes.includes('twitter.com') || notes.includes('linkedin.com') || notes.includes('tiktok.com') || notes.includes('@');
    if (hasSocialAny) hasSocial++;
    else { trulyNoContact++; idsToRemove.push({id: l.id, name: l.company_name, client: l.client_id}); }
  }
  
  console.log('Has social in notes:', hasSocial);
  console.log('Truly no contact:', trulyNoContact);
  
  // Per client breakdown
  const clients = await r.execute('SELECT id, slug, name FROM clients');
  for (const c of clients.rows) {
    const total = await r.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args:[c.id]});
    const bad = await r.execute({
      sql: `SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id = cl.lead_id
            WHERE cl.client_id = ? AND (l.contact_email IS NULL OR l.contact_email = '')
            AND (l.contact_phone IS NULL OR l.contact_phone = '')`,
      args: [c.id]
    });
    console.log(`${c.slug}: ${total.rows[0].c} total, ${bad.rows[0].c} without email/phone`);
  }
  
  console.log('\nIDs to remove:', idsToRemove.length);
  for (const r2 of idsToRemove.slice(0, 10)) console.log(`  id=${r2.id} "${r2.name}" client=${r2.client}`);
}

check().catch(e => console.error(e));
