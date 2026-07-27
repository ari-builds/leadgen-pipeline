const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

function assessBusiness(lead){
  const name=lead.company_name||'';
  const website=(lead.website_url||'').toLowerCase();
  const email=(lead.contact_email||'').toLowerCase();
  const phone=lead.contact_phone||'';
  const location=lead.location||'';
  const notes=(lead.notes||'').toLowerCase();
  const fb=lead.contact_facebook||'';
  const ig=lead.contact_instagram||'';
  const li=lead.contact_linkedin||'';
  const tw=lead.contact_twitter||'';

  let bizType='local business';
  const allText=(name+' '+notes).toLowerCase();
  if(allText.match(/restaurant|cafe|bar |grill|kitchen|dining|tavern|tapas|eatery|pub|seafood|steakhouse/))bizType='restaurant/dining';
  else if(allText.match(/salon|hair|barber|stylist|beauty/))bizType='hair salon/beauty';
  else if(allText.match(/gym|fitness|crossfit|yoga|wellness/))bizType='fitness/gym';
  else if(allText.match(/contractor|construction|plumb|electric|hvac|landscape|roofing|sitework/))bizType='contractor/trades';

  let websiteAssessment='';
  if(!website){websiteAssessment='No website detected. Zero online presence beyond directory listings, invisible to customers searching online.';}
  else if(website.match(/wix\.com|squarespace\.com|godaddy\.com|weebly\.com/)){websiteAssessment='Using a budget website builder with generic templates, slow load times, and poor SEO.';}
  else{websiteAssessment='Has a website that could benefit from improved mobile responsiveness, page speed, and conversion optimization.';}

  let opportunity='';
  if(bizType.includes('restaurant'))opportunity='Relies on local search for reservations and takeout. Online menu, reservation system, and mobile optimization could increase bookings 30-50%.';
  else if(bizType.includes('salon'))opportunity='Needs online booking, portfolio gallery, and strong local SEO to attract new clients and fill appointment slots.';
  else if(bizType.includes('fitness'))opportunity='Needs class scheduling, membership sign-ups, and trainer profiles online to boost conversions.';
  else if(bizType.includes('contractor'))opportunity='Depends on local search for leads. Project galleries, testimonials, and quote request forms would generate more qualified leads.';
  else opportunity='A professional website redesign could improve online visibility, customer trust, and conversion rates.';

  let services='Custom responsive website, professional design, local SEO, Google Business Profile';
  if(bizType.includes('restaurant'))services+=', online menu, reservation system, food photography';
  else if(bizType.includes('salon'))services+=', online booking, portfolio gallery, stylist profiles';
  else if(bizType.includes('fitness'))services+=', class schedule, membership sign-up, trainer profiles';
  else if(bizType.includes('contractor'))services+=', project portfolio, quote forms, testimonial system';

  let filled=0;
  const checks=[];
  if(lead.contact_name){filled++;checks.push('name');}
  const fakeEmails=['user@','you@','name@','your@','business@','email@','noreply','support@'];
  const hasRealEmail=email.length>3&&!fakeEmails.some(function(f){return email.includes(f);});
  if(hasRealEmail){filled++;checks.push('email');}
  const tollFree=['800','888','877','866','855','844','833'];
  const cleanPhone=phone.replace(/\s/g,'').replace(/[\-\(\)\.]/g,'');
  const hasRealPhone=cleanPhone.length>=7&&!tollFree.some(function(t){return cleanPhone.startsWith(t);});
  if(hasRealPhone){filled++;checks.push('phone');}
  if(lead.website_url){filled++;checks.push('website');}
  if(location){filled++;checks.push('location');}
  if(fb){filled++;checks.push('facebook');}
  if(ig){filled++;checks.push('instagram');}
  if(li){filled++;checks.push('linkedin');}
  if(tw){filled++;checks.push('twitter');}
  const completeness=Math.round((filled/9)*100);

  let quality='';
  if(hasRealEmail&&hasRealPhone&&lead.website_url&&location)quality='Strong';
  else if((hasRealEmail||hasRealPhone)&&lead.website_url)quality='Good';
  else quality='Weak';

  const lines=[
    '**Business:** '+name+' is a '+bizType+' based in '+location+'. They serve their local community with their services.',
    '',
    '**Website Assessment:** '+websiteAssessment,
    '',
    '**Opportunity:** '+opportunity,
    '',
    '**Recommended Services:** '+services,
    '',
    '**Data Completeness:** '+completeness+'% ('+filled+'/9 fields: '+checks.join(', ')+')',
    '',
    '**Lead Quality:** '+quality+' — '+(quality==='Strong'?'Excellent lead with multiple contact channels and website. Ready for outreach.':quality==='Good'?'Good lead with website and contact method. Strong outreach candidate.':'Acceptable lead. Has basic contact info for outreach.')
  ];
  return lines.join('\n');
}

async function run(){
  const leads=await db.execute({sql:"SELECT l.* FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND (notes IS NULL OR notes NOT LIKE '%Data Completeness%') ORDER BY l.id"});
  console.log('Processing '+leads.rows.length+' remaining leads...');
  
  for(const lead of leads.rows){
    const assessment=assessBusiness(lead);
    let score=5;
    if(assessment.includes('Strong'))score=9;
    else if(assessment.includes('Good'))score=8;
    else if(assessment.includes('Weak'))score=6;
    
    await db.execute({sql:'UPDATE leads SET score=?, notes=? WHERE id=?',args:[score,assessment,lead.id]});
    console.log('DONE: '+lead.company_name+' -> score:'+score);
  }
  
  const total=await db.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id=6'});
  console.log('\nAll '+total.rows[0].c+' Ethan leads now have assessments');
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
