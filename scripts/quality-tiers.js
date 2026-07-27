const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
async function go(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.contact_facebook,l.contact_instagram,l.contact_linkedin,l.contact_twitter,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.id'});
  let strong=[],good=[],weak=[],bad=[];
  const fakeEmails=['user@','you@','name@','your@','business@','email@','image','qq.com','filler@','support@','noreply','admin@example','test@'];
  const tollFree=['800-','888-','877-','866-','855-','844-','833-','1800','+1888','+1800'];
  const badNames=['contact us','contact','null','business','home','welcome','about','our mission','services','blog','gallery','menu','login','sign up','reserve','book now','order online','find us','get a quote','locations','careers','faq','privacy','terms','testimonial','pricing','portfolio'];
  const competitors=['shopify','durable','wix','squarespace','webflow','marketing360','whitepages','yellowpages','bbb.org','yelp','google','facebook','instagram','twitter','linkedin','pinterest','tiktok','reddit','tripadvisor','opentable','doordash','ubereats','grubhub','seamless'];
  
  for(const row of r.rows){
    const e=(row.contact_email||'').toLowerCase();
    const p=(row.contact_phone||'').replace(/\s/g,'');
    const w=(row.website_url||'').toLowerCase();
    const n=(row.company_name||'').toLowerCase();
    const fb=row.contact_facebook||'';
    const ig=row.contact_instagram||'';
    const li=row.contact_linkedin||'';
    const tw=row.contact_twitter||'';
    const notes=(row.notes||'').toLowerCase();
    
    const hasRealEmail=e.length>3&&!fakeEmails.some(f=>e.includes(f));
    const hasRealPhone=p.length>6&&!tollFree.some(t=>p.includes(t));
    const hasSocial=(fb+ig+li+tw).length>3;
    const hasWebsite=!!row.website_url;
    const isBadName=badNames.some(b=>n.startsWith(b)||n===b);
    const isCompetitor=competitors.some(c=>n.includes(c)||w.includes(c));
    const isForeign=notes.includes('albania')||notes.includes('italy')||notes.includes('france')||notes.includes('uk ')||notes.includes('united kingdom')||notes.includes('germany');
    
    let fields=0;
    if(row.contact_name)fields++;
    if(hasRealEmail)fields++;
    if(hasRealPhone)fields++;
    if(hasWebsite)fields++;
    if(row.location)fields++;
    if(hasSocial)fields++;
    if(row.contact_linkedin)fields++;
    
    if(isBadName||isCompetitor||isForeign){
      bad.push(`${row.id}|${row.company_name}|${fields}f|${hasRealEmail?'E':''}${hasRealPhone?'P':''}${hasSocial?'S':''}`);
    }else if(hasRealEmail&&hasRealPhone&&hasWebsite&&hasSocial&&fields>=5){
      strong.push(`${row.id}|${row.company_name}|${fields}f|${row.contact_email||''}|${row.contact_phone||''}|${row.location||''}`);
    }else if((hasRealEmail||hasRealPhone)&&hasWebsite){
      good.push(`${row.id}|${row.company_name}|${fields}f|${hasRealEmail?'E':''}${hasRealPhone?'P':''}${hasSocial?'S':''}`);
    }else{
      weak.push(`${row.id}|${row.company_name}|${fields}f|${hasRealEmail?'E':''}${hasRealPhone?'P':''}${hasSocial?'S':''}`);
    }
  }
  
  console.log(`\n=== QUALITY TIERS ===`);
  console.log(`STRONG (email+phone+website+social): ${strong.length}`);
  console.log(`GOOD (email/phone+website): ${good.length}`);
  console.log(`WEAK: ${weak.length}`);
  console.log(`BAD (competitor/bad name/foreign): ${bad.length}`);
  
  console.log(`\n=== STRONG LEADS ===`);
  strong.forEach(s=>console.log(s));
  
  console.log(`\n=== GOOD LEADS (top 30) ===`);
  good.slice(0,30).forEach(g=>console.log(g));
  
  console.log(`\n=== BAD (should remove) ===`);
  bad.forEach(b=>console.log(b));
}
go();
