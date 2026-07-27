const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
(async()=>{
  const assessed=await db.execute({sql:"SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND notes LIKE '%Data Completeness%'"});
  const total=await db.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id=6'});
  const noAssess=await db.execute({sql:"SELECT l.id,l.company_name FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND (notes IS NULL OR notes NOT LIKE '%Data Completeness%')"});
  console.log('Assessed:',assessed.rows[0].c,'Total:',total.rows[0].c);
  console.log('Missing assessment:');
  for(const r of noAssess.rows) console.log('  '+r.id+'|'+r.company_name);
  process.exit(0);
})();
