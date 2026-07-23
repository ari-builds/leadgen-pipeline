const {createClient} = require('@libsql/client');
const db = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

async function main() {
  const withEmail = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_email IS NOT NULL AND contact_email != ''");
  const withPhone = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_phone IS NOT NULL AND contact_phone != ''");
  const withLinkedin = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_linkedin IS NOT NULL AND contact_linkedin != ''");
  const withFb = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_facebook IS NOT NULL AND contact_facebook != ''");
  const withIg = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_instagram IS NOT NULL AND contact_instagram != ''");
  const total = await db.execute("SELECT COUNT(*) as c FROM leads");
  
  console.log(`Total leads: ${total.rows[0].c}`);
  console.log(`With email: ${withEmail.rows[0].c}`);
  console.log(`With phone: ${withPhone.rows[0].c}`);
  console.log(`With LinkedIn: ${withLinkedin.rows[0].c}`);
  console.log(`With Facebook: ${withFb.rows[0].c}`);
  console.log(`With Instagram: ${withIg.rows[0].c}`);

  const noContact = await db.execute({
    sql: `SELECT COUNT(*) as c FROM leads 
          WHERE (contact_email IS NULL OR contact_email = '') 
          AND (contact_phone IS NULL OR contact_phone = '') 
          AND (contact_linkedin IS NULL OR contact_linkedin = '')
          AND (contact_facebook IS NULL OR contact_facebook = '')
          AND (contact_instagram IS NULL OR contact_instagram = '')`,
    args: []
  });
  console.log(`No contact at all: ${noContact.rows[0].c}`);
}

main().catch(console.error);
