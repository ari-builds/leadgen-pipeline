const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
async function go(){
  // 1. Remove the null lead
  await db.execute({sql:'DELETE FROM client_leads WHERE lead_id=612'});
  await db.execute({sql:'DELETE FROM leads WHERE id=612'});
  console.log('Removed null lead 612');
  
  // 2. Deduplicate by website_url — keep the one with more fields filled
  const dupes=await db.execute({sql:`SELECT website_url, GROUP_CONCAT(id) as ids, COUNT(*) as cnt FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND website_url IS NOT NULL GROUP BY website_url HAVING cnt > 1`});
  
  let removed=0;
  for(const row of dupes.rows){
    const ids=row.ids.split(',').map(Number);
    // For each duplicate group, check which has better data
    const leads=[];
    for(const id of ids){
      const r=await db.execute({sql:'SELECT * FROM leads WHERE id='+id});
      if(r.rows.length){
        const l=r.rows[0];
        let score=0;
        if(l.contact_email)score+=2;
        if(l.contact_phone)score+=1;
        if(l.contact_name)score+=1;
        if(l.location&&l.location!=='United States and Canada')score+=1;
        if((l.contact_facebook||l.contact_instagram||l.contact_linkedin||l.contact_twitter))score+=1;
        if(l.notes&&l.notes.length>100)score+=1;
        leads.push({id:id,score:score,lead:l});
      }
    }
    leads.sort((a,b)=>b.score-a.score);
    // Keep the best one, remove the rest
    for(let i=1;i<leads.length;i++){
      await db.execute({sql:'DELETE FROM client_leads WHERE lead_id='+leads[i].id+' AND client_id=6'});
      await db.execute({sql:'DELETE FROM leads WHERE id='+leads[i].id});
      removed++;
      console.log(`Removed duplicate ${leads[i].id} (kept ${leads[0].id}) - ${leads[i].lead.company_name}`);
    }
  }
  console.log(`\nRemoved ${removed} duplicates`);
  
  // 3. Check remaining count
  const count=await db.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id=6'});
  console.log(`Remaining for Ethan: ${count.rows[0].c}`);
}
go();
