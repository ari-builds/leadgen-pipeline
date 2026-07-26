const db = require('./db');

async function main() {
  const clients = await db.execute({ sql: 'SELECT id, name, slug FROM clients ORDER BY id', args: [] });
  for (const c of clients.rows) {
    const total = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM client_leads WHERE client_id = ?', args: [c.id] });
    const withEmail = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM client_leads cl JOIN leads l ON cl.lead_id = l.id WHERE cl.client_id = ? AND l.contact_email IS NOT NULL AND l.contact_email != ''", args: [c.id] });
    const withPhone = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM client_leads cl JOIN leads l ON cl.lead_id = l.id WHERE cl.client_id = ? AND l.contact_phone IS NOT NULL AND l.contact_phone != ''", args: [c.id] });
    const withSocial = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM client_leads cl JOIN leads l ON cl.lead_id = l.id WHERE cl.client_id = ? AND (l.contact_linkedin IS NOT NULL AND l.contact_linkedin != '' OR l.contact_twitter IS NOT NULL AND l.contact_twitter != '' OR l.contact_facebook IS NOT NULL AND l.contact_facebook != '' OR l.contact_instagram IS NOT NULL AND l.contact_instagram != '')", args: [c.id] });
    console.log(`[${c.id}] ${c.name}: ${total.rows[0].cnt} leads | ${withEmail.rows[0].cnt} email | ${withPhone.rows[0].cnt} phone | ${withSocial.rows[0].cnt} social`);
  }
}

main().catch(console.error);
