const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function checkWebsite(url){
  const issues=[];
  const strengths=[];
  try{
    const controller=new AbortController();
    const timeout=setTimeout(function(){controller.abort();},10000);
    const res=await fetch(url,{signal:controller.signal,headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}});
    clearTimeout(timeout);
    const html=await res.text();
    const h=html.toLowerCase();
    if(!h.includes('viewport'))issues.push('Not mobile-friendly (no viewport tag)');
    if(!h.includes('@media'))issues.push('Not responsive (no CSS media queries)');
    if(h.includes('flash'))issues.push('Uses Adobe Flash (dead technology, blocked on mobile)');
    if(h.includes('frameset')||h.includes('<frame '))issues.push('Uses HTML frames (outdated)');
    if(!h.includes('book')&&!h.includes('reservation')&&!h.includes('appointment')&&!h.includes('schedule')&&!h.includes('order'))issues.push('No online booking/ordering');
    if(url.startsWith('http://'))issues.push('No SSL/HTTPS');
    if(!h.includes('google-analytics')&&!h.includes('gtag')&&!h.includes('googletagmanager')&&!h.includes('ga('))issues.push('No Google Analytics (no traffic tracking)');
    const socials=['facebook.com','instagram.com','twitter.com','x.com','linkedin.com'];
    const foundSocial=socials.filter(function(p){return h.includes(p);});
    if(foundSocial.length===0)issues.push('No social media links');
    if(!h.includes('application/ld+json')&&!h.includes('itemscope'))issues.push('No schema markup (bad for local SEO)');
    if(!h.includes('meta name="description"')&&!h.includes('meta name=description'))issues.push('No meta description (bad for SEO)');
    const h1Match=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
    if(!h1Match||h1Match.length===0)issues.push('No H1 tag (bad for SEO)');
    else if(h1Match.length>1)issues.push('Multiple H1 tags (confusing for SEO)');
    if(h.includes('squarespace'))issues.push('Built on Squarespace (limited customization, template-locked)');
    if(h.includes('wix.com'))issues.push('Built on Wix (limited customization, poor SEO)');
    if(h.includes('godaddy')&&h.includes('pagebuilder'))issues.push('Built on GoDaddy Builder (very limited)');
    if(h.includes('wp-content')||h.includes('wordpress'))strengths.push('WordPress');
    if(foundSocial.length>0)strengths.push('Social: '+foundSocial.join(', '));
    if(h.includes('google.com/maps')||h.includes('maps.google'))strengths.push('Google Maps');
    if(h.includes('book')||h.includes('reservation')||h.includes('appointment'))strengths.push('Online booking');
    if(h.includes('application/ld+json'))strengths.push('Schema markup');
    if(h.includes('meta name="description"'))strengths.push('Meta description');
    return {issues:issues,strengths:strengths};
  }catch(e){
    return {issues:['Site error: '+e.message],strengths:[]};
  }
}

async function run(){
  const leads=await db.execute({sql:'SELECT l.id,l.company_name,l.website_url,l.location,l.contact_email,l.contact_phone,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND l.website_url IS NOT NULL ORDER BY l.location,l.company_name'});
  
  console.log('Checking all '+leads.rows.length+' Ethan websites...\n');
  let checked=0;
  let totalIssues=0;
  
  for(const lead of leads.rows){
    const result=await checkWebsite(lead.website_url);
    checked++;
    
    // Build specific assessment
    const lines=[];
    lines.push('**Business:** '+lead.company_name+' - local business in '+lead.location+'.');
    lines.push('');
    lines.push('**Website:** '+lead.website_url);
    lines.push('');
    
    if(result.issues.length>0){
      lines.push('**Website Issues ('+result.issues.length+'):**');
      result.issues.forEach(function(i){lines.push('- '+i);});
      totalIssues+=result.issues.length;
    }
    
    if(result.strengths.length>0){
      lines.push('');
      lines.push('**What works:** '+result.strengths.join(', '));
    }
    
    lines.push('');
    lines.push('**Recommended Improvements:**');
    if(result.issues.some(function(i){return i.includes('mobile')||i.includes('responsive');}))lines.push('- Redesign with mobile-first responsive layout');
    if(result.issues.some(function(i){return i.includes('Flash');}))lines.push('- Replace Flash with modern HTML5/CSS3');
    if(result.issues.some(function(i){return i.includes('booking');}))lines.push('- Add online booking/scheduling system');
    if(result.issues.some(function(i){return i.includes('Squarespace')||i.includes('Wix')||i.includes('GoDaddy');}))lines.push('- Migrate to custom-built site for full design control and better SEO');
    if(result.issues.some(function(i){return i.includes('Analytics');}))lines.push('- Install Google Analytics 4 for traffic insights');
    if(result.issues.some(function(i){return i.includes('schema');}))lines.push('- Add local business schema markup for better Google visibility');
    if(result.issues.some(function(i){return i.includes('meta description');}))lines.push('- Add meta descriptions to all pages for better click-through rates');
    if(result.issues.some(function(i){return i.includes('H1');}))lines.push('- Fix H1 tag structure (one per page)');
    if(result.issues.some(function(i){return i.includes('social');}))lines.push('- Add social media links to website');
    
    lines.push('');
    lines.push('**Data Completeness:** '+((lead.contact_email?1:0)+(lead.contact_phone?1:0)+(lead.website_url?1:0)+(lead.location?1:0))+'/4 core fields');
    lines.push('');
    lines.push('**Lead Quality:** Strong - has website, '+(lead.contact_email?'email, ':'')+(lead.contact_phone?'phone, ':'')+'and location');
    
    const assessment=lines.join('\n');
    const score=result.issues.length<=2?9:result.issues.length<=4?8:7;
    
    await db.execute({sql:'UPDATE leads SET notes=?, score=? WHERE id=?',args:[assessment,score,lead.id]});
    console.log('['+checked+'/'+leads.rows.length+'] '+lead.company_name+' ('+lead.location+') - '+result.issues.length+' issues');
    
    await new Promise(function(r){setTimeout(r,500);});
  }
  
  console.log('\nDone! Checked '+checked+' websites, avg '+Math.round(totalIssues/checked)+' issues per site');
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
