const {createClient} = require('@libsql/client');
const db = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  // Mark all emails as no_email since we have no email addresses
  await db.execute("UPDATE outreach_emails SET status = 'no_email'");
  console.log('Marked all emails as no_email');

  // Check DM threads
  const threads = await db.execute({
    sql: `SELECT t.id, t.platform, t.status, l.contact_name, l.score 
          FROM outreach_threads t JOIN leads l ON t.lead_id = l.id 
          ORDER BY l.score DESC LIMIT 5`,
    args: []
  });
  console.log('Sample threads:', JSON.stringify(threads.rows, null, 2));

  // Count outreach data
  const emailCount = await db.execute("SELECT COUNT(*) as c FROM outreach_emails");
  const threadCount = await db.execute("SELECT COUNT(*) as c FROM outreach_threads");
  const msgCount = await db.execute("SELECT COUNT(*) as c FROM outreach_messages");
  console.log(`Emails: ${emailCount.rows[0].c}, Threads: ${threadCount.rows[0].c}, Messages: ${msgCount.rows[0].c}`);
}

main().catch(console.error);
