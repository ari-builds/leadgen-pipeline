const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const NEW = "Ariana\nDigital Marketing Director | NetClicks by Ari\nOn behalf of Legacy Memorial Restorations\nnetclicksbyari@gmail.com | Yakima, WA";

async function main() {
  const r = await db.execute("SELECT id, body FROM outreach_emails");
  let updated = 0;
  for (const row of r.rows) {
    const old = row.body.match(/---\nAriana, Founder & CEO\nNetClicks by Ari\nnetclicksbyari@gmail\.com/);
    if (old) {
      const nb = row.body.replace(old[0], NEW);
      await db.execute({sql: 'UPDATE outreach_emails SET body = ? WHERE id = ?', args: [nb, row.id]});
      updated++;
    }
  }
  console.log('Updated:', updated);
}

main().catch(e => { console.error(e.message); process.exit(1); });
