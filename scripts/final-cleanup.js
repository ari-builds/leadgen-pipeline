const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function finalCleanup() {
  // Remove competitors and non-businesses
  const REMOVE_IDS = [
    181,  // Ooma - phone company
    197,  // Coldwell Banker - large franchise
    257,  // Bitecraft Web Design - competitor
    265,  // OTRUCKING - unclear
    287,  // Contractor Marketing - competitor
    290,  // AIMedical Office - SaaS
    294,  // Delmain - web design agency
    353,  // Get the best contractor website services - article
    356,  // WebsitesBuild a free online store - Shopify
  ];
  
  for (const id of REMOVE_IDS) {
    await db.execute({sql: 'DELETE FROM client_leads WHERE lead_id = ?', args: [id]});
    await db.execute({sql: 'DELETE FROM leads WHERE id = ?', args: [id]});
    console.log(`REMOVED [${id}]`);
  }
  
  // Fix remaining bad names
  const FIXES = {
    103: 'Dhaka Restaurant Directory',
    167: 'Heritage Insurance',
    190: 'New England HVAC Services',
    204: 'Tyngsborough Law Firms',
    369: 'Mr. Rooter Plumbing',
    393: 'Tyngsboro Business Directory',
    108: 'DoctorList Bangladesh',
    133: 'DoctorList Dhaka',
    189: 'Wilson Brothers Plumbing',
    218: 'Call 978 Auto',
    231: 'Tyngsboro Plumbing',
    241: 'Southborough Auto Repair',
    242: 'Tyngsboro Auto Repair',
    245: 'Vancouver Chiropractic',
  };
  
  for (const [id, name] of Object.entries(FIXES)) {
    await db.execute({sql: 'UPDATE leads SET company_name = ? WHERE id = ?', args: [name, parseInt(id)]});
    console.log(`FIXED [${id}] → "${name}"`);
  }
  
  // Final counts
  const clients = await db.execute('SELECT id, slug FROM clients');
  for (const c of clients.rows) {
    const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args: [c.id]});
    console.log(`${c.slug}: ${count.rows[0].c} leads`);
  }
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`Total: ${total.rows[0].c}`);
}

finalCleanup().catch(e => console.error(e));
