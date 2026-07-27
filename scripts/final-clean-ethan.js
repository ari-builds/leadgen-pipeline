const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
async function go(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.company_name'});
  
  const badPatterns=/^(contact|home|welcome|about|our mission|services|blog|gallery|menu|login|sign up|reserve|book now|order online|find us|get a quote|locations|careers|faq|privacy|terms|testimonial|pricing|portfolio|our story|the best|top |best |how to|guide|examples|what is|why )/i;
  const franchisePatterns=/^(snap fitness|the little gym|hotel gyms|gold's gym|crossfit|planet fitness|anytime fitness)/i;
  const competitorPatterns=/^(durable|shopify|wix|squarespace|webflow|marketing360|izzymarketing|diy contractor)/i;
  const directoryPatterns=/^(businesses in|richmond restaurants|burlington vermont|savannah,|asheville, nc)/i;
  const pageTitles=/^.{0,15}\|.*\|/i; // titles with multiple pipes
  const badNames=['piervana1','adorn-salon','circlesquaresalon','code style club','indigo','butter','hot fitness','1308 studio','null'];
  
  const remove=[];
  for(const row of r.rows){
    const n=(row.company_name||'').trim();
    const w=(row.website_url||'').toLowerCase();
    const e=(row.contact_email||'').toLowerCase();
    const p=(row.contact_phone||'').replace(/\s/g,'');
    
    // Remove if name is clearly not a real business
    if(badNames.includes(n.toLowerCase())){
      remove.push({id:row.id,name:n,reason:'bad_name_exact'});
      continue;
    }
    if(badPatterns.test(n)){
      remove.push({id:row.id,name:n,reason:'bad_name_pattern'});
      continue;
    }
    if(franchisePatterns.test(n)){
      remove.push({id:row.id,name:n,reason:'franchise'});
      continue;
    }
    if(competitorPatterns.test(n)){
      remove.push({id:row.id,name:n,reason:'competitor'});
      continue;
    }
    if(directoryPatterns.test(n)){
      remove.push({id:row.id,name:n,reason:'directory'});
      continue;
    }
    // Remove if email is corrupted (has phone number prefix)
    if(/^\d{10}/.test(e)){
      remove.push({id:row.id,name:n,reason:'corrupted_email'});
      continue;
    }
    // Remove toll-free phones
    if(/^(800|888|877|866|855|844|833)/.test(p)){
      remove.push({id:row.id,name:n,reason:'toll_free'});
      continue;
    }
    // Remove if phone has wrong format (like 230908-1513)
    if(/^\d{6,}/.test(p)){
      remove.push({id:row.id,name:n,reason:'bad_phone'});
      continue;
    }
  }
  
  console.log(`Will remove ${remove.length} leads:`);
  for(const r of remove){
    console.log(`  ${r.id}|${r.name}|${r.reason}`);
    await db.execute({sql:'DELETE FROM client_leads WHERE lead_id='+r.id+' AND client_id=6'});
    await db.execute({sql:'DELETE FROM leads WHERE id='+r.id});
  }
  
  const count=await db.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id=6'});
  console.log(`\nRemaining: ${count.rows[0].c}`);
}
go();
