const {createClient} = require('@libsql/client');
const db = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main(){
  const emails = await db.execute('SELECT COUNT(*) as c FROM outreach_emails');
  const threads = await db.execute('SELECT COUNT(*) as c FROM outreach_threads');
  const noContact = await db.execute({
    sql: `SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id = cl.lead_id
          WHERE cl.client_id = 1 AND (l.contact_email IS NULL OR l.contact_email = '') 
          AND (l.contact_phone IS NULL OR l.contact_phone = '')`,
    args: []
  });
  const withEmail = await db.execute({
    sql: `SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id = cl.lead_id
          WHERE cl.client_id = 1 AND l.contact_email IS NOT NULL AND l.contact_email != ''`,
    args: []
  });
  const sample = await db.execute({
    sql: `SELECT id, company_name, contact_name, contact_email, contact_phone, score, status FROM leads l 
          JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 1 ORDER BY l.score DESC LIMIT 5`,
    args: []
  });
  
  console.log('Emails:', emails.rows[0].c);
  console.log('Threads:', threads.rows[0].c);
  console.log('No contact:', noContact.rows[0].c);
  console.log('With email:', withEmail.rows[0].c);
  console.log('Sample:', JSON.stringify(sample.rows, null, 2));
}
main();
