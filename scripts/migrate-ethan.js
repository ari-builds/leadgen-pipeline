const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

const localDb = createClient({ url: 'file:./local.db' });
const tursoDb = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function migrateGoodLeads() {
  // Get all leads for client 6 from local.db
  const leads = await localDb.execute({
    sql: `SELECT l.* FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 6`,
    args: []
  });
  
  console.log(`Total leads in local.db for client 6: ${leads.rows.length}`);
  
  let migrated = 0;
  let skipped = 0;
  
  for (const l of leads.rows) {
    // Quality gate
    const company = (l.company_name || '').toLowerCase();
    const email = l.contact_email || '';
    const phone = l.contact_phone || '';
    const website = l.website_url || '';
    
    // Must have email OR phone
    if (!email && !phone) { skipped++; continue; }
    
    // Must not be a directory, article, or non-business
    const badPatterns = [
      /directory/i, /near me/i, /business search/i, /complete this/i,
      /magazine/i, /journal/i, /blog/i, /travel/i, /discover/i,
      /best \d+ /i, /top \d+ /i, /how to/i, /guide/i,
      /plumbing.*design/i, /business ideas/i, /wblm/i, /infatuation/i,
      /visitportland/i, /portlandfoodmap/i, /boston.*magazine/i,
      /exploringmaine/i, /unpeeled/i, /feastio/i,
    ];
    
    let isBad = false;
    for (const p of badPatterns) {
      if (p.test(company) || p.test(website)) { isBad = true; break; }
    }
    if (isBad) { skipped++; continue; }
    
    // Must have a real business name (not a page title)
    if (company.length < 3 || company.length > 80) { skipped++; continue; }
    
    // Must be a real business website (not a platform)
    if (website.includes('facebook.com') || website.includes('instagram.com') || website.includes('yelp.com')) {
      skipped++; continue;
    }
    
    // Clean email (remove corrupted ones)
    let cleanEmail = email;
    if (email && (email.includes('04101') || email.length > 50 || !email.includes('@'))) {
      cleanEmail = null;
    }
    
    // Clean phone (remove bad formats)
    let cleanPhone = phone;
    if (phone && phone.length < 8) cleanPhone = null;
    
    // Insert into Turso
    try {
      await tursoDb.execute({
        sql: `INSERT INTO leads (company_name, website_url, industry, location, score, notes,
              contact_email, contact_phone, contact_facebook, contact_instagram,
              contact_twitter, contact_linkedin, source_url, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          l.company_name, l.website_url, l.industry || 'Restaurant',
          l.location || 'Portland, ME', l.score, l.notes || '',
          cleanEmail, cleanPhone,
          l.contact_facebook, l.contact_instagram,
          l.contact_twitter, l.contact_linkedin,
          l.source_url || l.website_url
        ]
      });
      
      const newId = (await tursoDb.execute('SELECT last_insert_rowid() as id')).rows[0].id;
      
      await tursoDb.execute({
        sql: `INSERT INTO client_leads (client_id, lead_id, assigned_at) VALUES (6, ?, datetime('now'))`,
        args: [newId]
      });
      
      migrated++;
      console.log(`MIGRATED [${l.id}→${newId}] ${l.company_name?.substring(0, 40)} | ${cleanEmail || '-'} | ${cleanPhone || '-'}`);
    } catch (e) {
      console.log(`ERROR [${l.id}] ${l.company_name}: ${e.message}`);
    }
  }
  
  console.log(`\nMigrated: ${migrated}, Skipped: ${skipped}`);
  
  // Final count
  const count = await tursoDb.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = 6'});
  console.log(`Total in Turso for Ethan: ${count.rows[0].c}`);
}

migrateGoodLeads().catch(e => console.error(e));
