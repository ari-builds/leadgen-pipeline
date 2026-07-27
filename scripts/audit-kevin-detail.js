const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  // Kevin's leads - check what data we have
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.contact_facebook,l.contact_instagram,l.contact_linkedin,l.contact_twitter,l.source_url,l.raw_scrape,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=2 ORDER BY l.id'});
  
  console.log('=== KEVIN LEADS DETAILED CHECK ===');
  console.log('Total: '+r.rows.length);
  
  let hasName=0,hasEmail=0,hasPhone=0,hasWebsite=0,hasLocation=0,hasSource=0,hasRaw=0,hasNotes=0,hasSocial=0;
  let noName=0,noEmail=0;
  
  for(const row of r.rows){
    if(row.contact_name)hasName++;else noName++;
    if(row.contact_email)hasEmail++;else noEmail++;
    if(row.contact_phone)hasPhone++;
    if(row.website_url)hasWebsite++;
    if(row.location)hasLocation++;
    if(row.source_url)hasSource++;
    if(row.raw_scrape)hasRaw++;
    if(row.notes&&row.notes.length>10)hasNotes++;
    if(row.contact_facebook||row.contact_instagram||row.contact_linkedin||row.contact_twitter)hasSocial++;
  }
  
  console.log('Has name: '+hasName+' | No name: '+noName);
  console.log('Has email: '+hasEmail+' | No email: '+noEmail);
  console.log('Has phone: '+hasPhone);
  console.log('Has website: '+hasWebsite);
  console.log('Has location: '+hasLocation);
  console.log('Has source_url: '+hasSource);
  console.log('Has raw_scrape: '+hasRaw);
  console.log('Has notes: '+hasNotes);
  console.log('Has social: '+hasSocial);
  
  // Show first 5 with raw_scrape to understand what data we captured
  console.log('\n=== SAMPLE RAW SCRAPES ===');
  let shown=0;
  for(const row of r.rows){
    if(shown>=5)break;
    console.log('\n--- Lead '+row.id+' ---');
    console.log('Name: '+(row.company_name||'EMPTY'));
    console.log('Phone: '+(row.contact_phone||'NONE'));
    console.log('Source: '+(row.source_url||'NONE'));
    console.log('Raw (first 300): '+(row.raw_scrape||'NONE').substring(0,300));
    console.log('Notes (first 200): '+(row.notes||'NONE').substring(0,200));
    shown++;
  }
  
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
