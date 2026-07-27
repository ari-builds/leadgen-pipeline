const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  // Fix Beer City CrossFit
  await db.execute({sql:"UPDATE leads SET contact_email='dave@beercitycrossfit.com' WHERE id=606"});
  console.log('Fixed Beer City CrossFit email');
  
  // Verify all Ethan leads have clean data
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.company_name'});
  
  let issues=0;
  for(const row of r.rows){
    const e=(row.contact_email||'').toLowerCase();
    // Check for remaining bad emails
    if(e.match(/^\d/)||e.includes('email')||e==='filler@godaddy.com'||e==='null'||e.includes('noreply')){
      console.log('ISSUE: '+row.company_name+' | '+row.contact_email);
      issues++;
    }
  }
  console.log('Total leads: '+r.rows.length);
  console.log('Issues found: '+issues);
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
