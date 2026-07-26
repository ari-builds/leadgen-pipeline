const db = require('./db');

async function main() {
  const r = await db.execute("SELECT id, substr(body, -200) as tail FROM outreach_emails WHERE (template_type IS NULL OR template_type = 'initial') AND id <= 7");
  r.rows.forEach(row => {
    console.log(`ID ${row.id}: ...${row.tail}`);
    console.log('---');
  });
}

main().catch(e => { console.error(e.message); process.exit(1); });
