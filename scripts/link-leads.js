const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const names = [
  'Valley Hills Funeral Home',
  'Shaw & Sons Funeral Home',
  'Wiebe Funeral Homes',
  'Yakima Floral',
  'Simply Crafted Floral',
  'Roots Nursery & Landscape'
];

async function main() {
  for (const n of names) {
    const r = await db.execute({sql: 'SELECT id FROM leads WHERE company_name = ?', args: [n]});
    if (r.rows.length) {
      const id = r.rows[0].id;
      const ex = await db.execute({sql: 'SELECT 1 FROM client_leads WHERE client_id=1 AND lead_id=?', args: [id]});
      if (!ex.rows.length) {
        await db.execute({sql: "INSERT INTO client_leads (client_id,lead_id,assigned_at) VALUES (1,?,datetime('now'))", args: [id]});
        console.log('Linked:', n, 'id', id);
      } else {
        console.log('Already linked:', n);
      }
    } else {
      console.log('NOT FOUND:', n);
    }
  }
  const count = await db.execute('SELECT COUNT(*) as c FROM client_leads WHERE client_id=1');
  console.log('Total leads for client 1:', count.rows[0].c);
}

main().catch(e => { console.error(e.message); process.exit(1); });
