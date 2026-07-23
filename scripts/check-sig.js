const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  const r = await db.execute("SELECT id, substr(body, -200) as tail FROM outreach_emails WHERE (template_type IS NULL OR template_type = 'initial') AND id <= 7");
  r.rows.forEach(row => {
    console.log(`ID ${row.id}: ...${row.tail}`);
    console.log('---');
  });
}

main().catch(e => { console.error(e.message); process.exit(1); });
