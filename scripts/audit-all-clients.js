const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  const clients=await db.execute({sql:'SELECT id,name,slug,ideal_customer_profile FROM clients ORDER BY id'});
  
  for(const c of clients.rows){
    const r=await db.execute({sql:'SELECT l.id,l.company_name,l.website_url,l.contact_email,l.contact_phone,l.location,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=?',args:[c.id]});
    
    let noWebsite=0,hasWebsite=0;
    let noEmail=0,noPhone=0;
    let withSocial=0;
    let weakNotes=0;
    
    for(const row of r.rows){
      if(row.website_url)hasWebsite++;else noWebsite++;
      if(!row.contact_email)noEmail++;
      if(!row.contact_phone)noPhone++;
      if(row.contact_facebook||row.contact_instagram||row.contact_linkedin||row.contact_twitter)withSocial++;
      if(!row.notes||row.notes.length<50)weakNotes++;
    }
    
    console.log('\n=== '+c.name+' ('+c.slug+') ===');
    console.log('Total: '+r.rows.length);
    console.log('With website: '+hasWebsite+' | WITHOUT website: '+noWebsite);
    console.log('Without email: '+noEmail+' | Without phone: '+noPhone);
    console.log('With social media: '+withSocial);
    console.log('Weak/empty notes: '+weakNotes);
    if(r.rows.length>0){
      console.log('Sample leads:');
      r.rows.slice(0,3).forEach(function(l){
        console.log('  '+l.company_name+' | web:'+(l.website_url||'NONE')+' | email:'+(l.contact_email||'NONE')+' | phone:'+(l.contact_phone||'NONE')+' | loc:'+(l.location||'?'));
      });
    }
  }
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
