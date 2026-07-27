const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const TURSO_URL = 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io';
const TURSO_TOKEN = process.env.DATABASE_AUTH_TOKEN;

async function clean() {
  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  const noContact = await db.execute(`
    SELECT l.id FROM leads l
    JOIN client_leads cl ON l.id = cl.lead_id
    WHERE (l.contact_email IS NULL OR l.contact_email = '')
    AND (l.contact_phone IS NULL OR l.contact_phone = '')
  `);

  const ids = noContact.rows.map(r => r.id);
  console.log(`Removing ${ids.length} leads with no contact info...`);

  if (ids.length > 0) {
    // Remove client_leads first
    for (const id of ids) {
      await db.execute({ sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [id] });
    }
    // Then remove leads
    for (const id of ids) {
      await db.execute({ sql: 'DELETE FROM leads WHERE id = ?', args: [id] });
    }
  }

  // Verify per client
  const clients = await db.execute('SELECT id, slug FROM clients');
  for (const c of clients.rows) {
    const count = await db.execute({ sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args: [c.id] });
    console.log(`${c.slug}: ${count.rows[0].c} leads remaining`);
  }
  
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`\nTotal leads remaining: ${total.rows[0].c}`);
}

clean().catch(e => console.error(e));
