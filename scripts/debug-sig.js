const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  const r = await db.execute("SELECT id, body FROM outreach_emails WHERE id = 1");
  const body = r.rows[0].body;
  // Find signature area
  const lines = body.split('\n');
  const sigStart = lines.findIndex(l => l.includes('Ariana'));
  console.log('Signature starts at line:', sigStart);
  console.log('Lines around signature:');
  for (let i = Math.max(0, sigStart - 2); i < Math.min(lines.length, sigStart + 5); i++) {
    console.log(`  [${i}] ${JSON.stringify(lines[i])}`);
  }
  // Check for carriage returns
  const hasCR = body.includes('\r');
  console.log('Has \\r:', hasCR);
  // Try matching with \r\n
  const match = body.match(/---\r?\nAriana.*?---\r?\n/s);
  console.log('Regex match:', match ? 'YES' : 'NO');
  if (match) console.log('Matched:', JSON.stringify(match[0]));
}

main().catch(e => { console.error(e.message); process.exit(1); });
