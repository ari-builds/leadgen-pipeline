const {createClient}=require('@libsql/client');
const https=require('https');
const http=require('http');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

function fetchUrl(url){
  return new Promise(function(resolve,reject){
    const mod=url.startsWith('https')?https:http;
    const req=mod.get(url,{timeout:10000,headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}},function(res){
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){
        return fetchUrl(res.headers.location).then(resolve,reject);
      }
      let data='';
      res.on('data',function(c){data+=c;});
      res.on('end',function(){resolve(data);});
    });
    req.on('error',reject);
    req.on('timeout',function(){req.destroy();reject(new Error('timeout'));});
  });
}

async function auditWebsite(url){
  try{
    const html=await fetchUrl(url);
    const issues=[];
    
    // Mobile viewport
    if(!html.includes('viewport'))issues.push('No mobile viewport meta tag');
    
    // Responsive CSS
    if(!html.includes('@media')&&!(html.includes('responsive')&&html.includes('css')))issues.push('Not responsive design');
    
    // Flash
    if(html.includes('.swf')||html.includes('flash'))issues.push('Uses Flash (dead technology)');
    
    // Online booking
    if(!html.match(/booking|reservation|appointment|order online|book now|schedule/i))issues.push('No online booking system');
    
    // Google Analytics
    if(!html.includes('google-analytics')&&!html.includes('gtag')&&!html.includes('GA_MEASUREMENT_ID')&&!html.includes('googletagmanager'))issues.push('No Google Analytics');
    
    // Schema markup
    if(!html.includes('itemtype')&&!html.includes('application/ld+json'))issues.push('No schema markup');
    
    // Meta description
    if(!html.includes('meta name="description"')&&!html.includes('meta name="Description"'))issues.push('No meta description');
    
    // H1 tags
    const h1Matches=html.match(/<h1[^>]*>/gi)||[];
    if(h1Matches.length===0)issues.push('No H1 tag');
    if(h1Matches.length>1)issues.push('Multiple H1 tags ('+h1Matches.length+')');
    
    // Social media links
    if(!html.includes('facebook.com')&&!html.includes('instagram.com')&&!html.includes('twitter.com')&&!html.includes('linkedin.com'))issues.push('No social media links');
    
    // Copyright year
    if(html.includes('© 2020')||html.includes('© 2019')||html.includes('© 2018'))issues.push('Outdated copyright year');
    if(!html.includes('© 2026')&&!html.includes('© 2025')&&!html.includes('© 2024'))issues.push('Outdated copyright year');
    
    // Platform detection
    let platform='';
    if(html.includes('squarespace'))platform='Squarespace';
    else if(html.includes('wix'))platform='Wix';
    else if(html.includes('godaddy'))platform='GoDaddy';
    else if(html.includes('wordpress'))platform='WordPress';
    
    return {issues,platform,hasWebsite:true};
  }catch(e){
    return {issues:['Cannot access website'],platform:'',hasWebsite:false};
  }
}

async function run(){
  const clientIds=[3,4,7]; // Niloy, Maria, Carter
  
  for(const clientId of clientIds){
    const client=await db.execute({sql:'SELECT name FROM clients WHERE id='+clientId});
    const clientName=client.rows[0].name;
    
    console.log('\n'+'='.repeat(60));
    console.log('WEBSITE AUDIT: '+clientName+' (ID: '+clientId+')');
    console.log('='.repeat(60));
    
    const leads=await db.execute({sql:'SELECT l.id,l.company_name,l.website_url,l.contact_email,l.contact_phone,l.location FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id='+clientId+' AND l.website_url IS NOT NULL'});
    
    let totalIssues=0;
    let audited=0;
    
    for(const lead of leads.rows){
      if(!lead.website_url)continue;
      
      console.log('\nAuditing: '+lead.company_name+' ('+lead.website_url+')');
      
      const audit=await auditWebsite(lead.website_url);
      
      if(audit.issues.length>0){
        console.log('  Issues: '+audit.issues.join(', '));
        totalIssues+=audit.issues.length;
      }else{
        console.log('  ✅ No major issues detected');
      }
      if(audit.platform)console.log('  Platform: '+audit.platform);
      
      audited++;
      
      // Build assessment note
      let assessment='';
      assessment+='Business: '+lead.company_name+'\n';
      assessment+='Website: '+lead.website_url+'\n';
      if(lead.contact_email)assessment+='Email: '+lead.contact_email+'\n';
      if(lead.contact_phone)assessment+='Phone: '+lead.contact_phone+'\n';
      if(lead.location)assessment+='Location: '+lead.location+'\n';
      assessment+='Website Assessment: ';
      if(audit.platform)assessment+='Built on '+audit.platform+'. ';
      if(audit.issues.length>0)assessment+=audit.issues.length+' issues found: '+audit.issues.join('; ')+'. ';
      else assessment+='No major issues detected. ';
      assessment+='\nOpportunity: ';
      if(audit.platform&&(audit.platform==='Squarespace'||audit.platform==='Wix'||audit.platform==='GoDaddy'))assessment+='Template-locked site that needs custom rebuild. ';
      if(audit.issues.includes('No mobile viewport meta tag'))assessment+='Not mobile-friendly — losing mobile visitors. ';
      if(audit.issues.includes('Not responsive design'))assessment+='Not responsive — poor mobile experience. ';
      if(audit.issues.includes('Uses Flash (dead technology)'))assessment+='Uses Flash — dead tech, not supported on mobile. ';
      if(audit.issues.includes('No online booking system'))assessment+='No online booking — losing reservations to competitors. ';
      if(audit.issues.includes('No Google Analytics'))assessment+='No analytics — can\'t track performance. ';
      if(audit.issues.includes('No schema markup'))assessment+='No schema markup — missing Google rich results. ';
      if(audit.issues.includes('No meta description'))assessment+='No meta description — poor click-through from search. ';
      if(audit.issues.includes('No H1 tag'))assessment+='No H1 tag — bad for SEO. ';
      if(audit.issues.includes('No social media links'))assessment+='No social links on website. ';
      if(audit.issues.includes('Outdated copyright year'))assessment+='Outdated copyright — looks abandoned. ';
      assessment+='\nRecommended Services: ';
      if(audit.platform&&(audit.platform==='Squarespace'||audit.platform==='Wix'||audit.platform==='GoDaddy'))assessment+='Custom website rebuild, ';
      if(audit.issues.includes('No online booking system'))assessment+='Online booking system, ';
      if(audit.issues.includes('No Google Analytics'))assessment+='Google Analytics setup, ';
      if(audit.issues.includes('No schema markup'))assessment+='Schema markup implementation, ';
      assessment+='SEO optimization, Performance optimization';
      
      // Update lead notes
      await db.execute({sql:'UPDATE leads SET notes=? WHERE id=?',args:[assessment,lead.id]});
      
      // Small delay to avoid hammering
      await new Promise(r=>setTimeout(r,500));
    }
    
    console.log('\nAUDIT SUMMARY:');
    console.log('Audited: '+audited+' websites');
    console.log('Average issues per site: '+(audited>0?Math.round(totalIssues/audited*10)/10:0));
  }
  
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
