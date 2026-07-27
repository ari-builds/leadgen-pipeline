const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
const GROQ_API_KEY=process.env.GROQ_API_KEY;

async function callGROQ(prompt){
  const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    headers:{'Authorization':`Bearer ${GROQ_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'llama-3.3-70b-versatile',
      messages:[{role:'user',content:prompt}],
      temperature:0.3,
      max_tokens:400,
    }),
  });
  const data=await res.json();
  return data.choices?.[0]?.message?.content||'';
}

const ETHAN_ICP=`Target: US/Canada local businesses that need professional websites but currently have outdated, slow, poorly designed, or no websites at all. Focus on restaurants, contractors (plumbing, HVAC, electrical, landscaping), salons/barbershops, gyms/fitness studios, auto repair shops, medical/dental offices, real estate agents, and retail shops.

Ideal signals:
- Outdated design (old templates, flash elements, broken layout)
- Slow load times (check PageSpeed if available)
- Missing mobile responsiveness
- No online booking/scheduling
- No online menu/catalog
- Using free builders (Wix, Squarespace, GoDaddy basic) with poor results
- No Google Business optimization
- Missing social media integration
- Poor SEO (not ranking for local searches)
- No e-commerce when they sell products`;

async function assessLead(lead){
  const prompt=`You are a web development agency analyst for ArcTik Dev (run by Ethan Grandet). Analyze this business lead and write a professional assessment.

Business: ${lead.company_name}
Website: ${lead.website_url||'None'}
Email: ${lead.contact_email||'None'}
Phone: ${lead.contact_phone||'None'}
Location: ${lead.location||'Unknown'}
Existing notes: ${(lead.notes||'').substring(0,500)}

ICP: ${ETHAN_ICP}

Write a structured assessment with these EXACT sections:

**Business:** [What does this business do? Be specific about their services/products.]

**Website Assessment:** [Analyze their current website - is it professional, modern, mobile-friendly? What are the weaknesses?]

**Opportunity:** [Why would they benefit from a new/professional website? What specific improvements could drive more customers?]

**Recommended Services:** [Specific services Ethan should pitch - e.g., custom website, online booking, menu system, SEO, etc.]

**Data Completeness:** X% (count: name, email, phone, website, location, facebook, instagram, linkedin, twitter - how many are filled out of 9)

**Lead Quality:** [Strong/Good/Weak] - Strong=has email+phone+website+location, Good=has email or phone+website, Weak=phone only or missing key info

Keep it concise but specific. No generic statements.`;

  try{
    const assessment=await callGROQ(prompt);
    return assessment;
  }catch(e){
    console.error('GROQ error for',lead.company_name,e.message);
    return null;
  }
}

async function run(){
  const leads=await db.execute({sql:'SELECT l.* FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.id'});
  console.log(`Processing ${leads.rows.length} Ethan leads...`);
  
  let processed=0;
  for(const lead of leads.rows){
    const assessment=await assessLead(lead);
    if(assessment){
      // Parse score from assessment
      let score=5;
      if(assessment.includes('Strong'))score=9;
      else if(assessment.includes('Good'))score=8;
      else if(assessment.includes('Weak'))score=6;
      
      // Parse data completeness
      const dcMatch=assessment.match(/Data Completeness:\s*(\d+)%/);
      const dc=dcMatch?dcMatch[1]:'50';
      
      await db.execute({
        sql:'UPDATE leads SET score=?, notes=? WHERE id=?',
        args:[score,assessment,lead.id]
      });
      processed++;
      console.log(`[${processed}/${leads.rows.length}] ${lead.company_name} -> score:${score}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r=>setTimeout(r,200));
  }
  console.log(`\nDone! Processed ${processed} leads`);
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
