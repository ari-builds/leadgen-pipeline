const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.contact_facebook,l.contact_instagram,l.contact_linkedin,l.contact_twitter,l.notes,l.score FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.id'});
  
  const leads=[];
  
  for(const row of r.rows){
    const notes=(row.notes||'').toLowerCase();
    const email=(row.contact_email||'').toLowerCase();
    const phone=(row.contact_phone||'').replace(/\s/g,'');
    const website=row.website_url||'';
    const location=row.location||'';
    const fb=row.contact_facebook||'';
    const ig=row.contact_instagram||'';
    const li=row.contact_linkedin||'';
    const tw=row.contact_twitter||'';
    
    let score=0;
    const reasons=[];
    
    // NO WEBSITE = massive value (they need Ethan the most)
    if(!website){
      score+=40;
      reasons.push('NO WEBSITE (prime prospect)');
    }else{
      // Has website but with issues
      if(notes.includes('squarespace')){score+=15;reasons.push('Squarespace (needs custom rebuild)');}
      if(notes.includes('wix')){score+=15;reasons.push('Wix (needs custom rebuild)');}
      if(notes.includes('godaddy')){score+=15;reasons.push('GoDaddy (needs custom rebuild)');}
      if(notes.includes('not mobile')){score+=12;reasons.push('Not mobile-friendly');}
      if(notes.includes('not responsive')){score+=10;reasons.push('Not responsive');}
      if(notes.includes('flash')){score+=12;reasons.push('Uses Flash (dead tech)');}
      if(notes.includes('no online booking')){score+=8;reasons.push('No online booking');}
      if(notes.includes('no google analytics')){score+=5;reasons.push('No analytics');}
      if(notes.includes('no schema')){score+=5;reasons.push('No schema markup');}
      if(notes.includes('no meta description')){score+=4;reasons.push('No meta description');}
      if(notes.includes('no h1')){score+=4;reasons.push('No H1 tag');}
      if(notes.includes('multiple h1')){score+=3;reasons.push('Multiple H1 tags');}
      if(notes.includes('no social media')){score+=3;reasons.push('No social links');}
      if(notes.includes('copyright year')){score+=3;reasons.push('Outdated copyright');}
      // Generic website = some opportunity
      if(score===0&&website){score+=5;reasons.push('Has website (may need optimization)');}
    }
    
    // Contact info quality
    const fakeEmails=['user@','you@','name@','your@','business@','email@','noreply','support@','filler@'];
    const hasRealEmail=email.length>3&&!fakeEmails.some(function(f){return email.includes(f);});
    const tollFree=['800','888','877','866','855','844','833'];
    const cleanPhone=phone.replace(/\D/g,'');
    const hasRealPhone=cleanPhone.length>=7&&!tollFree.some(function(t){return cleanPhone.startsWith(t);});
    
    if(hasRealEmail){score+=10;reasons.push('Has email');}
    if(hasRealPhone){score+=8;reasons.push('Has phone');}
    if(location&&location!=='United States and Canada'){score+=5;reasons.push('Specific location');}
    
    // Social media
    if(fb){score+=3;reasons.push('Has Facebook');}
    if(ig){score+=3;reasons.push('Has Instagram');}
    if(li){score+=2;reasons.push('Has LinkedIn');}
    if(tw){score+=2;reasons.push('Has Twitter');}
    
    // Industry value (restaurants/salons/contractors are Ethan's ICP)
    const allText=(row.company_name+' '+notes).toLowerCase();
    if(allText.match(/restaurant|cafe|bar |grill|kitchen|dining|tapas|eatery|pub|seafood|steakhouse/)){score+=6;reasons.push('Restaurant (core ICP)');}
    else if(allText.match(/salon|hair|barber|stylist|beauty/)){score+=6;reasons.push('Salon (core ICP)');}
    else if(allText.match(/contractor|construction|plumb|electric|hvac|landscape|roofing|sitework/)){score+=7;reasons.push('Contractor (high value ICP)');}
    else if(allText.match(/gym|fitness|crossfit|yoga/)){score+=5;reasons.push('Fitness (core ICP)');}
    
    leads.push({
      id:row.id,
      name:row.company_name,
      email:row.contact_email||'',
      phone:row.contact_phone||'',
      website:website,
      location:location,
      score:score,
      reasons:reasons,
      notes:row.notes||''
    });
  }
  
  // Sort by score descending
  leads.sort(function(a,b){return b.score-a.score;});
  
  console.log('=== TOP 30 LEADS FOR ETHAN ===\n');
  
  const top30=leads.slice(0,30);
  let rank=0;
  for(const l of top30){
    rank++;
    console.log('#'+rank+' (Score: '+l.score+') '+l.name);
    console.log('   Location: '+l.location);
    console.log('   Email: '+(l.email||'none'));
    console.log('   Phone: '+(l.phone||'none'));
    console.log('   Website: '+(l.website||'NONE'));
    console.log('   Why: '+l.reasons.join(', '));
    console.log('');
  }
  
  console.log('\n=== BOTTOM 14 (weakest) ===\n');
  const bottom=leads.slice(-14);
  for(const l of bottom){
    console.log('(Score: '+l.score+') '+l.name+' | '+(l.website||'no web')+' | '+l.reasons.slice(0,3).join(', '));
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Total leads: '+leads.length);
  console.log('No website: '+leads.filter(function(l){return !l.website;}).length);
  console.log('With website: '+leads.filter(function(l){return !!l.website;}).length);
  console.log('Avg score (top 30): '+Math.round(top30.reduce(function(a,b){return a+b.score;},0)/30));
  
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
