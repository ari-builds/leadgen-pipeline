const db = require('./db');

async function main() {
  // Remove the combined client
  const combined = await db.execute({ sql: "SELECT id FROM clients WHERE slug = ?", args: ['ethan-garcia'] });
  if (combined.rows.length > 0) {
    const id = combined.rows[0].id;
    await db.execute({ sql: "DELETE FROM client_subscriptions WHERE client_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM clients WHERE id = ?", args: [id] });
    console.log('Removed combined client ID:', id);
  }

  // Check what we have
  const all = await db.execute({ sql: 'SELECT id, name, slug FROM clients ORDER BY id', args: [] });
  console.log('Current clients:', JSON.stringify(all.rows, null, 2));
}

main().catch(console.error);
