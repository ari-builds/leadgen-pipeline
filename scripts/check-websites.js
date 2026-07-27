const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function checkWebsite(url){
  const issues=[];
  const strengths=[];
  
  try{
    const controller=new AbortController();
    const timeout=setTimeout(function(){controller.abort();},10000);
    
    const res=await fetch(url,{
      signal:controller.signal,
      headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    });
    clearTimeout(timeout);
    
    const html=await res.text();
    const htmlLower=html.toLowerCase();
    const headers=Object.fromEntries(res.headers.entries());
    
    // Check response time (rough)
    issues.push('Status: '+res.status);
    
    // Mobile viewport
    if(!htmlLower.includes('viewport'))issues.push('NO mobile viewport tag - site is not mobile-friendly');
    else strengths.push('Has mobile viewport');
    
    // Responsive design indicators
    if(!htmlLower.includes('@media'))issues.push('No CSS media queries detected - likely not responsive');
    else strengths.push('Has responsive CSS');
    
    // Check for old tech
    if(htmlLower.includes('flash'))issues.push('Uses Adobe Flash (outdated, blocked on mobile)');
    if(htmlLower.includes('frameset')||htmlLower.includes('<frame '))issues.push('Uses HTML frames (outdated)');
    if(htmlLower.includes('jquery')&&htmlLower.includes('1.'))issues.push('Uses old jQuery version');
    
    // Booking/scheduling
    if(!htmlLower.includes('book')&&!htmlLower.includes('reservation')&&!htmlLower.includes('appointment')&&!htmlLower.includes('schedule')&&!htmlLower.includes('order')){
      issues.push('NO online booking/scheduling/ordering system');
    }else{
      strengths.push('Has booking/scheduling');
    }
    
    // Menu/catalog
    if(!htmlLower.includes('menu')&&!htmlLower.includes('catalog')&&!htmlLower.includes('services')){
      issues.push('No online menu or service catalog visible');
    }
    
    // SSL
    if(url.startsWith('http://'))issues.push('NOT using HTTPS - security warning in browsers');
    else strengths.push('Uses HTTPS');
    
    // Google Analytics / tracking
    if(!htmlLower.includes('google-analytics')&&!htmlLower.includes('gtag')&&!htmlLower.includes('googletagmanager')&&!htmlLower.includes('ga(')){
      issues.push('No Google Analytics detected - no traffic tracking');
    }
    
    // Social media links
    const socialPlatforms=['facebook.com','instagram.com','twitter.com','x.com','linkedin.com','tiktok.com','youtube.com'];
    const foundSocial=socialPlatforms.filter(function(p){return htmlLower.includes(p);});
    if(foundSocial.length===0)issues.push('No social media links on website');
    else strengths.push('Links to social: '+foundSocial.join(', '));
    
    // Schema markup
    if(!htmlLower.includes('application/ld+json')&&!htmlLower.includes('itemscope')){
      issues.push('No schema markup - poor for local SEO');
    }
    
    // Google Business / Maps
    if(htmlLower.includes('google.com/maps')||htmlLower.includes('maps.google')){
      strengths.push('Has Google Maps embed');
    }
    
    // Meta description
    if(!htmlLower.includes('meta name="description"')&&!htmlLower.includes('meta name=description')){
      issues.push('No meta description - poor for SEO');
    }
    
    // H1 tags
    const h1Match=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
    if(!h1Match||h1Match.length===0)issues.push('No H1 tag - bad for SEO');
    else if(h1Match.length>1)issues.push('Multiple H1 tags - confusing for SEO');
    
    // Images without alt
    const imgCount=(html.match(/<img /gi)||[]).length;
    const altCount=(html.match(/alt="/gi)||[]).length;
    if(imgCount>0&&altCount<imgCount*0.5)issues.push('Most images missing alt text - bad for accessibility and SEO');
    
    // Page size (rough)
    if(html.length>500000)issues.push('Very large page ('+Math.round(html.length/1024)+'KB) - slow loading');
    else if(html.length<5000)issues.push('Very thin page content - poor for SEO');
    
    // WordPress
    if(htmlLower.includes('wp-content')||htmlLower.includes('wordpress'))strengths.push('Built on WordPress');
    
    // Squarespace/Wix/GoDaddy
    if(htmlLower.includes('squarespace'))issues.push('Built on Squarespace - limited customization');
    if(htmlLower.includes('wix.com'))issues.push('Built on Wix - limited customization, poor SEO');
    if(htmlLower.includes('godaddy')&&htmlLower.includes('pagebuilder'))issues.push('Built on GoDaddy Page Builder - very limited');
    
    // Contact form
    if(!htmlLower.includes('contact')&&!htmlLower.includes('mailto:')){
      issues.push('No contact form or email visible');
    }else{
      strengths.push('Has contact info');
    }
    
    // Copyright year
    const yearMatch=html.match(/copyright.*?(\d{4})/i);
    if(yearMatch&&parseInt(yearMatch[1])<2023){
      issues.push('Copyright year '+yearMatch[1]+' - appears outdated');
    }
    
    return {issues:issues,strengths:strengths,size:Math.round(html.length/1024)};
    
  }catch(e){
    return {issues:['ERROR: '+e.message],strengths:[],size:0};
  }
}

async function run(){
  const leads=await db.execute({sql:'SELECT l.id,l.company_name,l.website_url,l.location,l.contact_email,l.contact_phone FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND l.website_url IS NOT NULL ORDER BY l.id LIMIT 15'});
  
  console.log('Checking '+leads.rows.length+' websites for Ethan...\n');
  
  for(const lead of leads.rows){
    console.log('=== '+lead.company_name+' ('+lead.location+') ===');
    console.log('URL: '+lead.website_url);
    
    const result=await checkWebsite(lead.website_url);
    
    console.log('Page size: '+result.size+'KB');
    console.log('Strengths ('+result.strengths.length+'):');
    result.strengths.forEach(function(s){console.log('  + '+s);});
    console.log('Issues ('+result.issues.length+'):');
    result.issues.forEach(function(i){console.log('  - '+i);});
    console.log('');
    
    await new Promise(function(r){setTimeout(r,500);});
  }
  
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
