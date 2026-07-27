const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.score,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.score DESC, l.company_name'});
  
  let strong=0,good=0,weak=0;
  let withEmail=0,withPhone=0,withSocial=0,withWebsite=0;
  const industries={};
  
  for(const row of r.rows){
    const notes=(row.notes||'');
    if(notes.includes('Strong'))strong++;
    else if(notes.includes('Good'))good++;
    else if(notes.includes('Weak'))weak++;
    
    if(row.contact_email)withEmail++;
    if(row.contact_phone)withPhone++;
    if(row.website_url)withWebsite++;
    if(row.contact_facebook||row.contact_instagram||row.contact_linkedin||row.contact_twitter)withSocial++;
    
    // Categorize industry
    const name=(row.company_name||'').toLowerCase();
    const allText=(name+' '+(row.notes||'')).toLowerCase();
    let ind='Other';
    if(allText.match(/restaurant|cafe|bar |grill|kitchen|dining|tavern|tapas|eatery|pub|seafood|steakhouse|brewery|bistro/))ind='Restaurant/Dining';
    else if(allText.match(/salon|hair|barber|stylist|beauty/))ind='Salon/Beauty';
    else if(allText.match(/gym|fitness|crossfit|yoga|wellness|athletic/))ind='Fitness/Gym';
    else if(allText.match(/contractor|construction|plumb|electric|hvac|landscape|roofing|sitework|design\/build/))ind='Contractor/Trades';
    else if(allText.match(/hotel|inn|bed|lodge/))ind='Hospitality';
    else if(allText.match(/media|news|publication|magazine/))ind='Media/Publishing';
    industries[ind]=(industries[ind]||0)+1;
  }
  
  console.log('=== ETHAN GRANDET LEAD REPORT ===');
  console.log('Total leads: '+r.rows.length);
  console.log('');
  console.log('--- Quality Distribution ---');
  console.log('Strong (email+phone+website+location): '+strong);
  console.log('Good (email or phone + website): '+good);
  console.log('Weak (phone only): '+weak);
  console.log('');
  console.log('--- Contact Info ---');
  console.log('With email: '+withEmail);
  console.log('With phone: '+withPhone);
  console.log('With website: '+withWebsite);
  console.log('With social media: '+withSocial);
  console.log('');
  console.log('--- Industry Breakdown ---');
  for(const [k,v] of Object.entries(industries).sort((a,b)=>b[1]-a[1])){
    console.log(k+': '+v);
  }
  console.log('');
  console.log('--- Top 30 Leads ---');
  const top30=r.rows.filter(function(row){
    const notes=(row.notes||'');
    return notes.includes('Strong')||notes.includes('Good');
  }).slice(0,30);
  for(const row of top30){
    const e=row.contact_email||'no email';
    const p=row.contact_phone||'no phone';
    const loc=row.location||'unknown';
    const q=(row.notes||'').includes('Strong')?'Strong':'Good';
    console.log(row.company_name+' | '+e+' | '+p+' | '+loc+' | '+q);
  }
  
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
