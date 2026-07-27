const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

const FAKE_EMAILS = ['user@domain.com', 'you@gmail.com', 'm-header-logo@2x.webp', 'm-header-logo@3x.webp'];

async function clean() {
  const leads = await db.execute('SELECT l.id, l.company_name, l.contact_email, l.contact_name, l.notes FROM leads l');
  let removed = 0;
  
  for (const l of leads.rows) {
    const email = (l.contact_email || '').toLowerCase();
    const company = (l.company_name || '').toLowerCase();
    const shouldRemove = [];
    
    // 1. Obviously fake emails
    if (FAKE_EMAILS.includes(email)) shouldRemove.push('fake_email');
    
    // 2. Image/asset URLs as emails
    if (email.includes('.webp') || email.includes('.png') || email.includes('.jpg') || email.includes('.jpeg') || email.includes('.gif')) shouldRemove.push('image_as_email');
    
    // 3. Company names that are page titles, not business names
    if (company.includes('signs when') || company.includes('signs your') || company.includes('what to look for') || 
        company.includes('list of') || company.includes('top reasons') || company.includes('9 signs') || 
        company.includes('10 signs') || company.includes('what our customers')) shouldRemove.push('page_title_not_business');
    
    // 4. Leads that are clearly web design/marketing companies (competitors)
    const notes = (l.notes || '').toLowerCase();
    if (company.includes('web design') || company.includes('web development') || company.includes('digital marketing') ||
        company.includes('seo service') || company.includes('nextiva') || company.includes('vrinsoft') ||
        company.includes('unified web') || company.includes('smallbiztrends') || company.includes('bitecraft')) {
      shouldRemove.push('competitor_or_agency');
    }
    
    // 5. Contact name looks like it came from a scraped "About" page rather than a real person
    if (company.includes('contact us') || company.includes('contact our')) shouldRemove.push('contact_page_not_lead');

    if (shouldRemove.length > 0) {
      await db.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [l.id]});
      await db.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [l.id]});
      removed++;
      if (removed <= 20) console.log(`REMOVED [${l.id}] "${l.company_name}" | ${l.contact_email} | reason: ${shouldRemove.join(', ')}`);
    }
  }
  
  console.log(`\nTotal removed: ${removed}`);
  
  // Remaining counts
  const clients = await db.execute('SELECT id, slug FROM clients');
  for (const c of clients.rows) {
    const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args: [c.id]});
    console.log(`${c.slug}: ${count.rows[0].c} leads`);
  }
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`Total: ${total.rows[0].c}`);
}

clean().catch(e => console.error(e));
