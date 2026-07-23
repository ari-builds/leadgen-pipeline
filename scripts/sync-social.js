const {createClient} = require('@libsql/client');
const localDb = createClient({url:'file:./local.db'});
const tursoDb = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  const localLeads = await localDb.execute('SELECT id, contact_name, contact_facebook, contact_twitter, contact_instagram FROM leads');
  const tursoLeads = await tursoDb.execute('SELECT id, contact_name FROM leads');
  
  let updated = 0;
  for (const turso of tursoLeads.rows) {
    const match = localLeads.rows.find(l => 
      l.contact_name && turso.contact_name && 
      l.contact_name.toLowerCase() === turso.contact_name.toLowerCase()
    );
    if (match && (match.contact_facebook || match.contact_twitter || match.contact_instagram)) {
      await tursoDb.execute({
        sql: 'UPDATE leads SET contact_facebook = ?, contact_twitter = ?, contact_instagram = ? WHERE id = ?',
        args: [
          match.contact_facebook || '',
          match.contact_twitter || '',
          match.contact_instagram || '',
          turso.id
        ]
      });
      updated++;
    }
  }
  console.log(`Updated ${updated} leads with social media data`);
}

main().catch(console.error);
