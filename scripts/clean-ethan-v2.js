const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function clean() {
  const leads = await db.execute({
    sql: `SELECT l.id, l.company_name, l.contact_email, l.contact_phone, l.website_url, l.notes 
          FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 6`,
    args: []
  });
  
  console.log(`Total: ${leads.rows.length}`);
  let removed = 0;
  
  for (const l of leads.rows) {
    const company = (l.company_name || '');
    const email = (l.contact_email || '');
    const phone = (l.contact_phone || '');
    const website = (l.website_url || '').toLowerCase();
    const reasons = [];
    
    // 1. Corrupted emails (phone number in email, etc.)
    if (email && (email.includes('2330email') || email.includes('9191guadalupe') || 
        email.includes('8100dave') || email.includes('23223804') || 
        email.includes('344-7072info') || email.includes('777-4147contact'))) {
      reasons.push('corrupted_email');
    }
    
    // 2. Bad company names
    if (company.match(/^(Contact|Contact Us|Portland Downtown|Store-Bought|The \d+ Best|GOLD$|Browse|Find Small|Construction Contractor|Starting a|Top Reasons)/i)) {
      reasons.push('bad_company_name');
    }
    
    // 3. Wrong country
    if (website.includes('.sg') || company.includes('Singapore')) reasons.push('wrong_country');
    
    // 4. Directory/magazine
    if (website.includes('bostonmagazine') || website.includes('richmondmagazine') || 
        website.includes('sevendaysvt') || website.includes('eater.com')) {
      reasons.push('magazine_directory');
    }
    
    // 5. Too many numbers in company name (corrupted data)
    const digitCount = (company.match(/\d/g) || []).length;
    if (digitCount > 5) reasons.push('corrupted_name');
    
    // 6. Fake/placeholder emails
    if (['filler@godaddy.com', 'support@whitepages.com', 'john.doe@company.com'].includes(email)) {
      reasons.push('fake_email');
    }
    
    // 7. Company is just a city name
    if (company.match(/^(Asheville|Richmond|Portland|Burlington|Savannah)$/i)) reasons.push('city_not_business');
    
    // 8. Franchise with toll-free number
    if (phone.match(/^(800|855|888|866|877)-/)) reasons.push('toll_free_franchise');
    
    if (reasons.length > 0) {
      await db.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [l.id]});
      await db.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [l.id]});
      removed++;
      console.log(`REMOVED [${l.id}] "${company.substring(0, 40)}" | ${reasons.join(', ')}`);
    }
  }
  
  console.log(`\nRemoved: ${removed}`);
  const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = 6'});
  console.log(`Remaining: ${count.rows[0].c}`);
}

clean().catch(e => console.error(e));
