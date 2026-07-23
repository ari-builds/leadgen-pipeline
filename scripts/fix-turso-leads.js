const {createClient} = require('@libsql/client');
const tursoDb = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  // Find leads with no contact info at all
  const noContact = await tursoDb.execute({
    sql: `SELECT l.id, l.contact_name, l.company_name, l.score 
          FROM leads l JOIN client_leads cl ON l.id = cl.lead_id 
          WHERE cl.client_id = 1 
          AND (l.contact_phone IS NULL OR l.contact_phone = '') 
          AND (l.contact_linkedin IS NULL OR l.contact_linkedin = '')
          AND (l.contact_email IS NULL OR l.contact_email = '')`,
    args: []
  });
  console.log('Leads with NO contact info:', noContact.rows.length);
  if (noContact.rows.length > 0) {
    console.log(JSON.stringify(noContact.rows, null, 2));
  }

  // Count leads with some contact info
  const withContact = await tursoDb.execute({
    sql: `SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id = cl.lead_id 
          WHERE cl.client_id = 1 
          AND (l.contact_phone IS NOT NULL AND l.contact_phone != '') 
          OR (l.contact_linkedin IS NOT NULL AND l.contact_linkedin != '')
          OR (l.contact_email IS NOT NULL AND l.contact_email != '')`,
    args: []
  });
  console.log('Leads with some contact info:', withContact.rows[0].c);

  // Delete leads with no contact info
  if (noContact.rows.length > 0) {
    const ids = noContact.rows.map(r => r.id);
    for (const id of ids) {
      await tursoDb.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ? AND client_id = 1', args: [id]});
      await tursoDb.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [id]});
    }
    console.log(`Deleted ${ids.length} leads with no contact info`);
  }

  // Count remaining
  const remaining = await tursoDb.execute({
    sql: 'SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 1',
    args: []
  });
  console.log('Remaining client leads:', remaining.rows[0].c);
}

main().catch(console.error);
