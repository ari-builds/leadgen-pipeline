const db = require('./db');

async function main() {
  const updates = [
    ['niloykumarbarman829@gmail.com', 'ashes-niloy'],
    ['hello.mzautomation@gmail.com', 'maria-khan'],
    ['contact@arctikdev.com', 'ethan-grandet'],
    ['carter202666@gmail.com', 'carter-garcia'],
  ];

  for (const [email, slug] of updates) {
    await db.execute({ sql: "UPDATE clients SET contact_email = ? WHERE slug = ?", args: [email, slug] });
    console.log('✅', slug, '→', email);
  }

  const all = await db.execute({ sql: 'SELECT id, name, slug, contact_email FROM clients ORDER BY id', args: [] });
  console.log(JSON.stringify(all.rows, null, 2));
}

main().catch(console.error);
