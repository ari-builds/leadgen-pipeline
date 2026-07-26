const db = require('./db');

async function main() {
  // Get Niloy's lead IDs
  const leads = await db.execute({ sql: "SELECT lead_id FROM client_leads WHERE client_id = 3", args: [] });
  const leadIds = leads.rows.map(r => r.lead_id);
  console.log('Removing', leadIds.length, 'leads from Niloy');

  // Unlink from client
  await db.execute({ sql: "DELETE FROM client_leads WHERE client_id = 3", args: [] });

  // Delete the actual leads (they were only scraped for Niloy)
  for (const id of leadIds) {
    await db.execute({ sql: "DELETE FROM leads WHERE id = ?", args: [id] });
  }

  // Reset autoincrement
  await db.execute({ sql: "DELETE FROM sqlite_sequence WHERE name = 'leads'", args: [] });
  await db.execute({ sql: "DELETE FROM sqlite_sequence WHERE name = 'client_leads'", args: [] });

  const check = await db.execute({ sql: "SELECT COUNT(*) as cnt FROM client_leads WHERE client_id = 3", args: [] });
  console.log('Niloy leads after cleanup:', check.rows[0].cnt);
}

main().catch(console.error);
