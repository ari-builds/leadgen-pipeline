const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function deepClean() {
  const leads = await db.execute({
    sql: `SELECT l.id, l.company_name, l.contact_email, l.website_url, l.notes 
          FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 6`,
    args: []
  });
  
  console.log(`Total: ${leads.rows.length}`);
  let removed = 0;
  let kept = 0;
  
  for (const l of leads.rows) {
    const company = (l.company_name || '').toLowerCase();
    const email = (l.contact_email || '').toLowerCase();
    const website = (l.website_url || '').toLowerCase();
    
    const shouldRemove = [];
    
    // Fake/placeholder emails
    if (['user@domain.com', 'you@gmail.com', 'your@email.com', 'name@email.com', 
         'business@email.com', 'plus@shopify.com', 'support@whitepages.com',
         'black9@qq.com', 'support@durable.com', 'israel@izzymarketing.com'].includes(email)) {
      shouldRemove.push('fake_email');
    }
    
    // Non-business names
    if (company.includes('save at') || company.includes('welcome to') || company.includes('we specialize') ||
        company.includes('get the best') || company.includes("world's best") || company.includes('build a free') ||
        company.includes('retail websites') || company.includes('marketing360') || company.includes('retail & shop') ||
        company.includes('trusted source') || company.includes('find contact') || company.includes('contact us') ||
        company.includes('contact our') || company.includes('the complete') || company.includes('gym fitness') ||
        company.includes('businesses in') || company.includes('branding &') || company.includes('diy contractor') ||
        company.includes('restaurant website design') || company.includes('our mission') || company.includes('what our customers') ||
        company === 'contact' || company.includes('plumbing experts') || company.includes('mr. rooter')) {
      shouldRemove.push('non_business_name');
    }
    
    // Competitor/SaaS
    if (company.includes('website design') || company.includes('web design') || company.includes('marketing') ||
        website.includes('shopify.com') || website.includes('durable.com') || website.includes('marketing360')) {
      shouldRemove.push('competitor_saas');
    }
    
    // Directory
    if (website.includes('whitepages.com') || website.includes('us-business.info') || company.includes('near you')) {
      shouldRemove.push('directory');
    }
    
    // Large franchises with 800 numbers
    const phone = l.contact_phone || '';
    if (phone.includes('800-') || phone.includes('855-') || phone.includes('888-') || phone.includes('866-') || phone.includes('877-')) {
      shouldRemove.push('toll_free');
    }
    
    // Non-US/Canada
    if (website.includes('.mx') || company.includes('ksamil') || email.includes('.mx')) {
      shouldRemove.push('wrong_country');
    }
    
    if (shouldRemove.length > 0) {
      await db.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [l.id]});
      await db.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [l.id]});
      removed++;
      if (removed <= 20) console.log(`REMOVED [${l.id}] "${l.company_name}" | ${shouldRemove.join(', ')}`);
    } else {
      kept++;
    }
  }
  
  console.log(`\nRemoved: ${removed}, Kept: ${kept}`);
  
  const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = 6'});
  console.log(`Remaining for Ethan: ${count.rows[0].c}`);
}

deepClean().catch(e => console.error(e));
