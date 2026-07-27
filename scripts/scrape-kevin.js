const {createClient}=require('@libsql/client');
const https=require('https');
const http=require('http');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

// Kevin's ICP: Memorial/gravestone restoration, monument cleaning, cemetery maintenance
// Target: Yakima, WA area businesses

const queries=[
  'monument cleaning service Yakima WA',
  'gravestone restoration Yakima WA',
  'cemetery maintenance Yakima WA',
  'memorial headstone cleaning Yakima WA',
  'tombstone repair Yakima WA',
  'cemetery care service Yakima WA',
  'monument polishing Yakima WA',
  'grave marker restoration Yakima WA',
  'cemetery landscaping Yakima WA',
  'memorial cleaning service Yakima WA',
  'monument restoration Toppenish WA',
  'gravestone cleaning Wapato WA',
  'cemetery maintenance Ellensburg WA',
  'memorial service Selah WA',
  'headstone repair Union Gap WA',
  'monument care Naches WA',
  'cemetery restoration Moxee WA',
  'grave cleaning Terrace Heights WA',
  'memorial cleaning West Valley WA',
  'tombstone care Harrah WA',
  'monument service Buena WA',
  'gravestone care Zillah WA',
  'cemetery maintenance Granger WA',
  'memorial cleaning Sunnyside WA',
  'headstone service Grandview WA',
  'monument care Prosser WA',
  'cemetery cleaning Benton City WA',
  'grave marker service Richland WA',
  'memorial restoration Kennewick WA',
  'tombstone cleaning Pasco WA'
];

function searchDDG(query){
  return new Promise(function(resolve,reject){
    const url='https://html.duckduckgo.com/html/?q='+encodeURIComponent(query);
    https.get(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}},function(res){
      let data='';
      res.on('data',function(c){data+=c;});
      res.on('end',function(){
        // Parse results
        const results=[];
        const regex=/class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
        let match;
        while((match=regex.exec(data))!==null){
          const href=match[1];
          const title=match[2].replace(/<[^>]*>/g,'').trim();
          // Extract actual URL from DuckDuckGo redirect
          const urlMatch=href.match(/uddg=([^&]*)/);
          const actualUrl=urlMatch?decodeURIComponent(urlMatch[1]):href;
          if(!actualUrl.includes('duckduckgo.com')&&!actualUrl.includes('google.')&&!actualUrl.includes('bing.')){
            results.push({url:actualUrl,title:title});
          }
        }
        resolve(results);
      });
    }).on('error',reject);
  });
}

function fetchPage(url){
  return new Promise(function(resolve,reject){
    const mod=url.startsWith('https')?https:http;
    const req=mod.get(url,{timeout:10000,headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}},function(res){
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){
        return fetchPage(res.headers.location).then(resolve,reject);
      }
      let data='';
      res.on('data',function(c){data+=c;});
      res.on('end',function(){resolve(data);});
    });
    req.on('error',reject);
    req.on('timeout',function(){req.destroy();reject(new Error('timeout'));});
  });
}

function extractEmail(html){
  const match=html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match?match[1]:'';
}

function extractPhone(html){
  const match=html.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  return match?match[1]:'';
}

function extractName(html,title){
  // Try og:site_name first
  const ogMatch=html.match(/property="og:site_name"[^>]*content="([^"]*)"/i);
  if(ogMatch)return ogMatch[1].trim();
  
  // Try title
  if(title){
    let name=title.split('|')[0].split('-')[0].trim();
    // Remove common suffixes
    name=name.replace(/\b(Yakima|WA|Washington|Toppenish|Wapato|Ellensburg)\b/gi,'').trim();
    return name;
  }
  return '';
}

async function run(){
  console.log('KEVIN SCRAPER: Starting for Yakima, WA area...');
  console.log('ICP: Monument cleaning, gravestone restoration, cemetery maintenance');
  
  let totalFound=0;
  let totalSaved=0;
  const seen=new Set();
  
  // Get existing lead URLs to avoid duplicates
  const existing=await db.execute({sql:'SELECT website_url FROM leads'});
  for(const row of existing.rows){
    if(row.website_url)seen.add(row.website_url.toLowerCase());
  }
  
  for(let i=0;i<queries.length;i++){
    const query=queries[i];
    console.log('\n['+(i+1)+'/'+queries.length+'] Searching: '+query);
    
    try{
      const results=await searchDDG(query);
      console.log('  Found '+results.length+' results');
      
      for(const result of results.slice(0,5)){ // Top 5 per query
        const url=result.url.toLowerCase();
        if(seen.has(url))continue;
        seen.add(url);
        
        // Skip directories and non-business sites
        const skipDomains=['yelp.com','bbb.org','facebook.com','yellowpages.com','tripadvisor.com','foursquare.com','thumbtack.com','homeadvisor.com','angi.com','houzz.com','bark.com','expertise.com','porch.com','nextdoor.com','linkedin.com','twitter.com','instagram.com','wikipedia.org','reddit.com'];
        if(skipDomains.some(d=>url.includes(d))){
          console.log('  Skip (directory): '+result.title);
          continue;
        }
        
        // Skip articles
        if(url.includes('article')||url.includes('blog')||url.includes('news')||url.includes('.pdf')){
          console.log('  Skip (article): '+result.title);
          continue;
        }
        
        console.log('  Fetching: '+result.title);
        
        try{
          const html=await fetchPage(result.url);
          
          const email=extractEmail(html);
          const phone=extractPhone(html);
          const name=extractName(html,result.title)||result.title;
          
          // Must have phone or email
          if(!email&&!phone){
            console.log('  Skip (no contact): '+name);
            continue;
          }
          
          // Determine industry
          let industry='Other';
          const text=(name+' '+(result.title||'')).toLowerCase();
          if(text.match(/monument|gravestone|headstone|tombstone|memorial|cemetery|grave/))industry='Memorial Services';
          else if(text.match(/cleaning|clean|wash|pressure/))industry='Cleaning Services';
          else if(text.match(/landscap|lawn|garden|mow/))industry='Landscaping';
          else if(text.match(/plumb|electric|hvac|roof|contractor/))industry='Contractor';
          
          // Build notes
          let notes='Business: '+name+'\n';
          notes+='Industry: '+industry+'\n';
          notes+='Website: '+result.url+'\n';
          if(email)notes+='Email: '+email+'\n';
          if(phone)notes+='Phone: '+phone+'\n';
          notes+='Location: Yakima, WA area\n';
          notes+='Data Completeness: '+((email?30:0)+(phone?20:0)+(name?10:0)+20)+'%\n';
          notes+='Lead Quality: '+(email&&phone?'Strong':'Good')+'\n';
          notes+='Assessment: ';
          if(!html.includes('google-analytics')&&!html.includes('gtag'))notes+='No Google Analytics. ';
          if(!html.includes('itemtype')&&!html.includes('application/ld+json'))notes+='No schema markup. ';
          if(!html.includes('meta name="description"'))notes+='No meta description. ';
          if(html.includes('squarespace'))notes+='Built on Squarespace. ';
          if(html.includes('wix'))notes+='Built on Wix. ';
          notes+='Opportunity: Local memorial service business that needs online presence and booking system.';
          
          // Insert lead
          const score=email&&phone?85:65;
          const leadResult=await db.execute({sql:'INSERT INTO leads (company_name,website_url,industry,contact_email,contact_phone,location,notes,score,status,source_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime(\'now\'),datetime(\'now\'))',
            args:[name,result.url,industry,email||'',phone||'','Yakima, WA area',notes,score,'new',result.url]
          });
          
          const leadId=leadResult.lastInsertRowid;
          
          // Link to Kevin (client_id=2)
          await db.execute({sql:'INSERT INTO client_leads (client_id,lead_id,created_at) VALUES (2,?,datetime(\'now\'))',args:[leadId]});
          
          totalSaved++;
          console.log('  ✅ Saved: '+name+' | '+(email||'no email')+' | '+(phone||'no phone'));
          
          // Small delay
          await new Promise(r=>setTimeout(r,1000));
          
        }catch(e){
          console.log('  ❌ Error fetching: '+e.message);
        }
      }
      
      // Delay between queries
      await new Promise(r=>setTimeout(r,2000));
      
    }catch(e){
      console.log('  ❌ Search error: '+e.message);
    }
  }
  
  console.log('\n=== KEVIN SCRAPER COMPLETE ===');
  console.log('Total found: '+totalFound);
  console.log('Total saved: '+totalSaved);
  
  // Count total Kevin leads
  const count=await db.execute({sql:'SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=2'});
  console.log('Total Kevin leads now: '+count.rows[0].c);
  
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
