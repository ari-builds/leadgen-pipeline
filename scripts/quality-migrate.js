const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const localDb = createClient({ url: 'file:./local.db' });
const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

const BAD_COMPANIES = [
  /save at/i, /welcome to/i, /we specialize/i, /get the best/i,
  /world's best/i, /build a free/i, /retail websites/i, /marketing360/i,
  /retail & shop/i, /trusted source/i, /find contact/i, /contact us/i,
  /the complete/i, /gym fitness/i, /businesses in/i, /branding &/i,
  /diy contractor/i, /restaurant website design/i, /our mission/i,
  /what our customers/i, /plumbing.*design/i, /business ideas/i,
  /best \d+ /i, /top \d+ /i, /how to/i, /guide/i,
  /magazine/i, /journal/i, /blog/i, /travel/i, /discover/i,
  /food map/i, /near you/i, /menu/i, /eater/i,
  /snapfitness/i, /orangetheory/i, /planetfitness/i, /goldsgym/i,
  /anytimefitness/i, /hotels/i, /tripadvisor/i,
  /chart-house/i, /hyatt/i, /omnihotels/i, /resy/i,
  /boston.*magazine/i, /richmond.*magazine/i, /sevendays/i,
];

const BAD_DOMAINS = [
  'snapfitness.com', 'orangetheory.com', 'planetfitness.com', 'goldsgym.com',
  'anytimefitness.com', 'hotelgyms.com', 'tripadvisor.com', 'tripadvisor.co.uk',
  'chart-house.com', 'hyatt.com', 'omnihotels.com', 'resy.com',
  'eater.com', 'bostonmagazine.com', 'richmondmagazine.com', 'sevendaysvt.com',
  'helloburlingtonvt.com', 'burlingtonmenus.com', 'averyrestaurantconsulting.com',
  'visitportland.com', 'portlandfoodmap.com', 'visitsavannah.com', 'savannah.com',
  'savannahchamber.com', 'exploreasheville.com', 'visitmaine.net',
  'thewaylifenowe.com', 'portlandoldport.com',
];

async function qualityMigration() {
  // First, remove any bad leads already in Turso for Ethan
  const existing = await tursoDb.execute({
    sql: `SELECT l.id, l.company_name, l.website_url FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 6`,
    args: []
  });
  
  for (const l of existing.rows) {
    const company = (l.company_name || '').toLowerCase();
    const website = (l.website_url || '').toLowerCase();
    let shouldRemove = false;
    
    for (const p of BAD_COMPANIES) {
      if (p.test(company)) { shouldRemove = true; break; }
    }
    if (!shouldRemove) {
      for (const d of BAD_DOMAINS) {
        if (website.includes(d)) { shouldRemove = true; break; }
      }
    }
    
    if (shouldRemove) {
      await tursoDb.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [l.id]});
      await tursoDb.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [l.id]});
      console.log(`REMOVED existing [${l.id}] "${l.company_name}"`);
    }
  }
  
  // Now get all leads from local.db for client 6
  const leads = await localDb.execute({
    sql: `SELECT l.* FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 6`,
    args: []
  });
  
  console.log(`\nTotal in local.db: ${leads.rows.length}`);
  
  // Check what's already in Turso
  const existingIds = new Set();
  const existingLeads = await tursoDb.execute({
    sql: `SELECT l.website_url FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 6`,
    args: []
  });
  for (const l of existingLeads.rows) {
    if (l.website_url) existingIds.add(l.website_url.toLowerCase());
  }
  
  let migrated = 0;
  let skipped = 0;
  
  for (const l of leads.rows) {
    const company = (l.company_name || '').toLowerCase();
    const email = l.contact_email || '';
    const phone = l.contact_phone || '';
    const website = (l.website_url || '').toLowerCase();
    
    // Skip if already in Turso
    if (existingIds.has(website)) { skipped++; continue; }
    
    // Must have email OR phone
    if (!email && !phone) { skipped++; continue; }
    
    // Quality gate - company name
    let isBad = false;
    for (const p of BAD_COMPANIES) {
      if (p.test(company)) { isBad = true; break; }
    }
    if (isBad) { skipped++; continue; }
    
    // Quality gate - domain
    for (const d of BAD_DOMAINS) {
      if (website.includes(d)) { isBad = true; break; }
    }
    if (isBad) { skipped++; continue; }
    
    // Must be a real business (not a platform)
    if (website.includes('facebook.com') || website.includes('instagram.com') || website.includes('yelp.com')) {
      skipped++; continue;
    }
    
    // Clean email
    let cleanEmail = email;
    if (email && (email.includes('04101') || email.length > 50 || !email.includes('@'))) {
      cleanEmail = null;
    }
    if (['user@domain.com', 'you@gmail.com', 'your@email.com', 'name@email.com', 
         'business@email.com', 'plus@shopify.com', 'support@whitepages.com',
         'black9@qq.com', 'support@durable.com'].includes(cleanEmail)) {
      cleanEmail = null;
    }
    
    // Clean phone
    let cleanPhone = phone;
    if (phone && phone.length < 8) cleanPhone = null;
    if (phone && (phone.includes('800-') || phone.includes('855-') || phone.includes('888-'))) cleanPhone = null;
    
    // Must have at least one contact after cleaning
    if (!cleanEmail && !cleanPhone) { skipped++; continue; }
    
    // Deduplicate by website
    existingIds.add(website);
    
    // Insert into Turso
    try {
      await tursoDb.execute({
        sql: `INSERT INTO leads (company_name, website_url, industry, location, score, notes,
              contact_email, contact_phone, contact_facebook, contact_instagram,
              contact_twitter, contact_linkedin, source_url, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          l.company_name, l.website_url, l.industry || 'Restaurant',
          l.location || '', l.score, l.notes || '',
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
      console.log(`[${migrated}] ${l.company_name?.substring(0, 40)} | ${cleanEmail || '-'} | ${cleanPhone || '-'}`);
    } catch (e) {
      console.log(`ERROR: ${l.company_name}: ${e.message}`);
    }
  }
  
  console.log(`\nMigrated: ${migrated}, Skipped: ${skipped}`);
  
  const finalCount = await tursoDb.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = 6'});
  console.log(`Total for Ethan: ${finalCount.rows[0].c}`);
}

qualityMigration().catch(e => console.error(e));
