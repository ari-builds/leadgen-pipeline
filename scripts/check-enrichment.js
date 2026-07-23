const { createClient } = require("@libsql/client");
require("dotenv").config();
const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
async function check() {
  const phone = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_phone IS NOT NULL AND contact_phone != ''");
  console.log("Leads with phone:", phone.rows[0].c);
  const fb = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_facebook IS NOT NULL AND contact_facebook != ''");
  console.log("Leads with Facebook:", fb.rows[0].c);
  const li = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_linkedin IS NOT NULL AND contact_linkedin != ''");
  console.log("Leads with LinkedIn:", li.rows[0].c);
  const tw = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_twitter IS NOT NULL AND contact_twitter != ''");
  console.log("Leads with Twitter:", tw.rows[0].c);
  const ig = await db.execute("SELECT COUNT(*) as c FROM leads WHERE contact_instagram IS NOT NULL AND contact_instagram != ''");
  console.log("Leads with Instagram:", ig.rows[0].c);
  const total = await db.execute("SELECT COUNT(*) as c FROM leads");
  console.log("Total leads:", total.rows[0].c);
}
check().catch(console.error);
