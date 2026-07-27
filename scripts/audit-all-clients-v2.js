const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  // Get all clients
  const clients=await db.execute({sql:'SELECT id,name FROM clients WHERE id IN (2,3,4,7) ORDER BY id'});
  
  for(const client of clients.rows){
    console.log('\n'+'='.repeat(60));
    console.log('CLIENT: '+client.name+' (ID: '+client.id+')');
    console.log('='.repeat(60));
    
    const leads=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.contact_facebook,l.contact_instagram,l.contact_linkedin,l.contact_twitter,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id='+client.id});
    
    let total=leads.rows.length;
    let withEmail=0,withPhone=0,withWebsite=0,withSocial=0;
    let weakNames=0,fakeEmails=0,fakeSocial=0;
    let industries={};
    let locations={};
    
    const fakeEmailsList=['user@','you@','name@','your@','business@','email@','noreply','support@','filler@'];
    const namePatterns=['not found','unknown','test','example','placeholder','n/a'];
    
    for(const lead of leads.rows){
      const email=(lead.contact_email||'').toLowerCase();
      const phone=(lead.contact_phone||'').replace(/\s/g,'');
      const website=lead.website_url||'';
      const location=lead.location||'';
      const name=(lead.company_name||'').toLowerCase();
      
      if(email.length>3&&!fakeEmailsList.some(f=>email.includes(f)))withEmail++;
      if(phone.length>=7)withPhone++;
      if(website)withWebsite++;
      if(lead.contact_facebook||lead.contact_instagram||lead.contact_linkedin||lead.contact_twitter)withSocial++;
      
      // Check for weak names
      if(namePatterns.some(p=>name.includes(p))||name.length<3)weakNames++;
      
      // Check for fake emails
      if(fakeEmailsList.some(f=>email.includes(f)))fakeEmails++;
      
      // Check for fake social
      const notes=(lead.notes||'').toLowerCase();
      if(notes.includes('facebook: none')||notes.includes('instagram: none')||notes.includes('linkedin: none'))fakeSocial++;
      
      // Track industry
      const industry=lead.notes?.match(/Industry: ([^\n]+)/i)?.[1]||'Unknown';
      industries[industry]=(industries[industry]||0)+1;
      
      // Track location
      if(location&&location!=='United States and Canada'){
        const city=location.split(',')[0];
        locations[city]=(locations[city]||0)+1;
      }
    }
    
    console.log('\nTotal leads: '+total);
    console.log('With email: '+withEmail+' ('+Math.round(withEmail/total*100)+'%)');
    console.log('With phone: '+withPhone+' ('+Math.round(withPhone/total*100)+'%)');
    console.log('With website: '+withWebsite+' ('+Math.round(withWebsite/total*100)+'%)');
    console.log('With social: '+withSocial+' ('+Math.round(withSocial/total*100)+'%)');
    console.log('\nWeak names: '+weakNames);
    console.log('Fake emails: '+fakeEmails);
    console.log('Fake social mentions: '+fakeSocial);
    
    // Show top industries
    const topIndustries=Object.entries(industries).sort((a,b)=>b[1]-a[1]).slice(0,5);
    console.log('\nTop industries:');
    for(const [ind,count] of topIndustries){
      console.log('  '+ind+': '+count);
    }
    
    // Show top locations
    const topLocations=Object.entries(locations).sort((a,b)=>b[1]-a[1]).slice(0,5);
    console.log('\nTop locations:');
    for(const [loc,count] of topLocations){
      console.log('  '+loc+': '+count);
    }
    
    // Quality assessment
    console.log('\nQUALITY ASSESSMENT:');
    if(weakNames/total>0.5)console.log('⚠️  More than half of leads have weak names');
    if(fakeEmails/total>0.3)console.log('⚠️  More than 30% of emails are fake');
    if(fakeSocial/total>0.3)console.log('⚠️  More than 30% of social links are fake/none');
    if(withEmail/total<0.2)console.log('⚠️  Less than 20% of leads have email');
    if(withPhone/total<0.5)console.log('⚠️  Less than 50% of leads have phone');
    if(withWebsite/total>0.8)console.log('ℹ️  Most leads have websites (need website audit)');
  }
  
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
