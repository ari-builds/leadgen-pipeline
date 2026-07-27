const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODUxMDExNzgsImlkIjoiMDE5ZmEwNTItNTUwMS03YmYyLTkwY2UtYzA3NzM0MzI4YTg3Iiwia2lkIjoiWXRDZ0VtRDJFenJISVdQUkVwbkNPZWdmZUdmcEpTN3dwY0p0cVdMQXdXayIsInJpZCI6IjU0NjM5NDI1LTBhNmUtNGZlYS1iYzVlLWRhYTQwNzdiOGI3NCJ9.yrGxTRNTbKWzJO9XKN_yWjmU_smBTyoKu9ZDXlMMINItQ3NupHZdS7dbGrojAACiCSYP6Dv13F7u9EJAVnYUAA'
});

async function audit() {
  const clients = await db.execute('SELECT id, slug, name FROM clients');
  
  for (const c of clients.rows) {
    console.log(`\n=== ${c.slug} ===`);
    const leads = await db.execute({
      sql: `SELECT l.id, l.company_name, l.contact_name, l.contact_email, l.contact_phone, l.location, l.notes, l.score
            FROM leads l JOIN client_leads cl ON l.id = cl.lead_id
            WHERE cl.client_id = ? ORDER BY l.id`,
      args: [c.id]
    });
    console.log(`Total: ${leads.rows.length}`);
    
    // Check for suspicious patterns
    let fakeEmails = 0;
    let suspiciousNames = 0;
    let genericEmails = 0;
    
    for (const l of leads.rows) {
      const email = (l.contact_email || '').toLowerCase();
      const name = (l.contact_name || '');
      const company = (l.company_name || '');
      
      // Fake email patterns: doesn't match business domain, generic info@ patterns
      if (email && !email.includes('@')) fakeEmails++;
      
      // Suspicious: contact name is same as company name or looks auto-generated
      if (name === company || name.includes('~') || name.includes('List of')) suspiciousNames++;
      
      // Generic emails that might be fabricated
      if (email.startsWith('info@') || email.startsWith('contact@') || email.startsWith('support@')) genericEmails++;
    }
    
    console.log(`Generic emails (info@/contact@/support@): ${genericEmails}`);
    console.log(`Suspicious names: ${suspiciousNames}`);
    
    // Show first 10 leads as sample
    for (const l of leads.rows.slice(0, 8)) {
      console.log(`  [${l.id}] ${l.company_name} | ${l.contact_name} | ${l.contact_email} | ${l.contact_phone} | Score:${l.score}`);
      const notes = (l.notes || '').substring(0, 200);
      if (notes) console.log(`    Notes: ${notes}`);
    }
  }
}

audit().catch(e => console.error(e));
