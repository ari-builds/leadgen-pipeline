const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
const GROQ_API_KEY=process.env.GROQ_API_KEY;

async function callGROQ(prompt,retries=3){
  for(let i=0;i<retries;i++){
    try{
      const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Authorization':`Bearer ${GROQ_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'user',content:prompt}],temperature:0.3,max_tokens:400}),
      });
      if(res.status===429){
        const wait=(i+1)*5000;
        console.log(`  Rate limited, waiting ${wait/1000}s...`);
        await new Promise(r=>setTimeout(r,wait));
        continue;
      }
      if(!res.ok){
        const err=await res.text();
        console.log(`  HTTP ${res.status}: ${err.substring(0,100)}`);
        await new Promise(r=>setTimeout(r,3000));
        continue;
      }
      const data=await res.json();
      if(data.choices?.[0]?.message?.content)return data.choices[0].message.content;
      console.log('  Empty response from GROQ');
    }catch(e){
      console.log(`  Network error: ${e.message}`);
      await new Promise(r=>setTimeout(r,3000));
    }
  }
  return null;
}

async function assessLead(lead){
  const prompt=`You are a web dev agency analyst for ArcTik Dev (Ethan Grandet). Analyze this lead.

Business: ${lead.company_name}
Website: ${lead.website_url||'None'}
Email: ${lead.contact_email||'None'}
Phone: ${lead.contact_phone||'None'}
Location: ${lead.location||'Unknown'}
Notes: ${(lead.notes||'').substring(0,500)}

Write concise assessment:

**Business:** [What they do]
**Website Assessment:** [Current website weaknesses]
**Opportunity:** [Why they need a new website]
**Recommended Services:** [Ethan's pitch]
**Data Completeness:** X% (out of 9: name, email, phone, website, location, facebook, instagram, linkedin, twitter)
**Lead Quality:** [Strong/Good/Weak]`;
  return await callGROQ(prompt);
}

async function run(){
  const leads=await db.execute({sql:"SELECT l.* FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 AND (notes IS NULL OR notes NOT LIKE '%Data Completeness%') ORDER BY l.id"});
  console.log(`Processing ${leads.rows.length} remaining Ethan leads...`);
  
  let processed=0;
  let failed=0;
  for(const lead of leads.rows){
    const assessment=await assessLead(lead);
    if(assessment){
      let score=5;
      if(assessment.includes('Strong'))score=9;
      else if(assessment.includes('Good'))score=8;
      else if(assessment.includes('Weak'))score=6;
      
      await db.execute({sql:'UPDATE leads SET score=?, notes=? WHERE id=?',args:[score,assessment,lead.id]});
      processed++;
      console.log(`[${processed}/${leads.rows.length}] ${lead.company_name} -> score:${score}`);
    }else{
      failed++;
      console.log(`FAILED: ${lead.company_name} (id:${lead.id})`);
    }
    // Delay between requests
    await new Promise(r=>setTimeout(r,2000));
  }
  console.log(`\nDone! Processed: ${processed}, Failed: ${failed}`);
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
