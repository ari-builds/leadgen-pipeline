const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODUxMDExNzgsImlkIjoiMDE5ZmEwNTItNTUwMS03YmYyLTkwY2UtYzA3NzM0MzI4YTg3Iiwia2lkIjoiWXRDZ0VtRDJFenJISVdQUkVwbkNPZWdmZUdmcEpTN3dwY0p0cVdMQXdXayIsInJpZCI6IjU0NjM5NDI1LTBhNmUtNGZlYS1iYzVlLWRhYTQwNzdiOGI3NCJ9.yrGxTRNTbKWzJO9XKN_yWjmU_smBTyoKu9ZDXlMMINItQ3NupHZdS7dbGrojAACiCSYP6Dv13F7u9EJAVnYUAA'
});

async function finalClean() {
  const leads = await db.execute('SELECT l.id, l.company_name, l.notes FROM leads l');
  let removed = 0;
  
  const REMOVE = [
    /website design/i, /web design/i, /website builder/i, /website creator/i,
    /marketing360/i, /the trusted source/i, /find small businesses/i, /browsing .* businesses/i,
    /businesses in/i, /save at restaurants/i, /welcome to restaurants/i,
    /retail websites/i, /retail.* website design/i,
    /build.* website/i, /create.* website/i, /diy.* website/i,
    /phone service/i, /internet \+ voice/i, /internet.* voice/i,
    /join now/i, /just \$\d/i,
    /generate.* design/i, /essential design/i, /design elements/i,
    /why your brick/i, /brick and mortar/i,
    /complete ai.* builder/i, /ai.* business builder/i,
    /we specialize in/i, /we specialize/i,
    /contemporary.* website/i, /\d+ examples/i,
    /restaurant.* design/i, /medical.* design/i, /dental.* design/i,
    /contractor.* design/i, /plumbing.* design/i,
    /reservation system/i, /reservation apps/i, /booking.* system/i,
    /automate.* stream/i, /streamline.* automate/i,
    /cost estimator/i, /terms of use/i,
    /contact customer service/i, /customer care/i,
    /phone statistics/i, /phone.* agent/i,
    /flexible packages/i, /stronger local/i,
    /insurance agent phone/i, /insurance agency phone/i,
    /no lawyer yet/i, /law firm.* software/i
  ];
  
  for (const l of leads.rows) {
    if (l.id < 102) continue; // Skip Kevin's leads
    const company = (l.company_name || '');
    const notes = (l.notes || '');
    
    let shouldRemove = false;
    for (const p of REMOVE) {
      if (p.test(company) || p.test(notes)) { shouldRemove = true; break; }
    }
    
    if (shouldRemove) {
      await db.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [l.id]});
      await db.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [l.id]});
      removed++;
      console.log(`REMOVED [${l.id}] "${company}"`);
    }
  }
  
  console.log(`\nRemoved: ${removed}`);
  const clients = await db.execute('SELECT id, slug FROM clients');
  for (const c of clients.rows) {
    const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args: [c.id]});
    console.log(`${c.slug}: ${count.rows[0].c} leads`);
  }
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`Total: ${total.rows[0].c}`);
}

finalClean().catch(e => console.error(e));
