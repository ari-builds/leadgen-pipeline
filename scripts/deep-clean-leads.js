const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODUxMDExNzgsImlkIjoiMDE5ZmEwNTItNTUwMS03YmYyLTkwY2UtYzA3NzM0MzI4YTg3Iiwia2lkIjoiWXRDZ0VtRDJFenJISVdQUkVwbkNPZWdmZUdmcEpTN3dwY0p0cVdMQXdXayIsInJpZCI6IjU0NjM5NDI1LTBhNmUtNGZlYS1iYzVlLWRhYTQwNzdiOGI3NCJ9.yrGxTRNTbKWzJO9XKN_yWjmU_smBTyoKu9ZDXlMMINItQ3NupHZdS7dbGrojAACiCSYP6Dv13F7u9EJAVnYUAA'
});

async function deepClean() {
  const leads = await db.execute('SELECT l.id, l.company_name, l.contact_email, l.notes FROM leads l');
  let removed = 0;
  
  // Articles, listicles, guides, how-tos, comparison pages, software/SaaS
  const ARTICLE_PATTERNS = [
    /top \d+ /i, /best .* websites/i, /\d+ best /i, /how to /i, /guide/i, 
    /examples$/i, /design.* inspiration/i, /\d+ signs/i, /\d+ reasons/i,
    /comparison/i, /vs\.? /i, /review/i, /what to look for/i,
    /complete guide/i, /comprehensive/i, /step.by.step/i, /tutorial/i,
    /learn how/i, /tips for/i, /things to/i, /ways to/i,
    /article/i, /blog post/i, /news/i, /information/i
  ];
  
  const SAAS_PATTERNS = [
    /saas/i, /software/i, /platform/i, /app/i, /booking system/i,
    /management system/i, /crm/i, /automation/i, /ai powered/i,
    /get started/i, /sign up/i, /free trial/i, /pricing/i,
    /features/i, /integration/i, /api/i, /enterprise/i
  ];
  
  const NON_BUSINESS = [
    /flipkart/i, /amazon/i, /shopify/i, /wix\.com/i, /squarespace/i,
    /godaddy/i, /verizon/i, /att\.com/i, /t-mobile/i,
    /veritas/i, /nextiva/i, /ringcentral/i, /grasshopper/i,
    /indeed\.com/i, /glassdoor/i, /linkedin\.com\/company/i,
    /marketing360/i, /hubspot/i, /mailchimp/i, /constant.contact/i
  ];
  
  const COMPETITOR_PATTERNS = [
    /website design company/i, /web design service/i, /digital marketing agency/i,
    /seo company/i, /marketing agency/i, /branding.*agency/i,
    /creative agency/i, /design studio/i, /dev shop/i
  ];
  
  for (const l of leads.rows) {
    const company = (l.company_name || '').toLowerCase();
    const notes = (l.notes || '').toLowerCase();
    const email = (l.contact_email || '').toLowerCase();
    const shouldRemove = [];
    
    // Skip Joseph's leads (individuals, not businesses) - those are fine
    if (l.id < 102) continue;
    
    // Check company name against patterns
    for (const p of ARTICLE_PATTERNS) {
      if (p.test(company)) { shouldRemove.push('article/list_page'); break; }
    }
    for (const p of SAAS_PATTERNS) {
      if (p.test(company) && !shouldRemove.length) { shouldRemove.push('saas/product'); break; }
    }
    for (const p of NON_BUSINESS) {
      if (p.test(company)) { shouldRemove.push('non_business_platform'); break; }
    }
    for (const p of COMPETITOR_PATTERNS) {
      if (p.test(company)) { shouldRemove.push('competitor_agency'); break; }
    }
    
    // Generic company names that aren't real businesses
    const genericNames = ['our mission', 'contact', 'help & support', 'services', 'pricing', 
                          'about us', 'careers', 'news & information', 'customer care',
                          'store locator', 'new stores page', 'send us enquiry', 'shop by category',
                          'plumbing', 'catering'];
    if (genericNames.includes(company)) shouldRemove.push('generic_page_name');
    
    // Email looks like it's from a template/placeholder
    if (email.includes('user@') || email.includes('you@') || email.includes('domain.com') || 
        email.includes('.webp') || email.includes('.png')) shouldRemove.push('fake_email');
    
    // Company is in English but location is non-US (for US-focused clients)
    if (notes.includes('new delhi') || notes.includes('singapore') || notes.includes('england') || 
        notes.includes('india') || notes.includes('uk') || company.includes('in new delhi')) {
      shouldRemove.push('wrong_country');
    }
    
    // Contact info is just scraped from a large enterprise page
    if (email.includes('800-') || email.includes('888-') || email.includes('877-') || email.includes('866-')) {
      shouldRemove.push('enterprise_toll_free');
    }
    
    if (shouldRemove.length > 0) {
      await db.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [l.id]});
      await db.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [l.id]});
      removed++;
      if (removed <= 30) console.log(`REMOVED [${l.id}] "${l.company_name}" | reason: ${shouldRemove.join(', ')}`);
    }
  }
  
  console.log(`\nRemoved: ${removed}`);
  
  const clients = await db.execute('SELECT id, slug FROM clients');
  for (const c of clients.rows) {
    const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args: [c.id]});
    console.log(`${c.slug}: ${count.rows[0].c} leads`);
  }
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`Total: ${total.rows[0].c}`);
}

deepClean().catch(e => console.error(e));
