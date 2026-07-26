const db = require('./db');

async function main() {
  const leads = await db.execute('SELECT id, contact_name, contact_facebook, contact_twitter, contact_instagram FROM leads');
  const withFB = leads.rows.filter(r => r.contact_facebook && r.contact_facebook !== '');
  const withTW = leads.rows.filter(r => r.contact_twitter && r.contact_twitter !== '');
  const withIG = leads.rows.filter(r => r.contact_instagram && r.contact_instagram !== '');
  console.log(`Local DB: ${leads.rows.length} total, ${withFB.length} with Facebook, ${withTW.length} with Twitter, ${withIG.length} with Instagram`);
}

main().catch(console.error);
