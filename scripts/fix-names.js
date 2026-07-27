const {createClient} = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function callGROQ(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function fixNames() {
  // Fix leads with page titles as company names
  const badLeads = await db.execute({
    sql: `SELECT l.id, l.company_name, l.website_url, l.notes FROM leads l 
          WHERE l.company_name LIKE '%Best%' OR l.company_name LIKE '%Top %' 
          OR l.company_name LIKE '%Our %' OR l.company_name LIKE '%Welcome to%'
          OR l.company_name LIKE '%Expert %' OR l.company_name LIKE '%Trusted %'
          OR l.company_name LIKE '%Achieve%' OR l.company_name LIKE '%Open to%'
          OR l.company_name LIKE '%Get the best%' OR l.company_name LIKE '%Websites%'
          OR l.company_name LIKE '%Restaurant &%' OR l.company_name LIKE '%Turning%'
          OR l.company_name LIKE '%Transform%' OR l.company_name LIKE '%Create a%'
          OR l.company_name LIKE '%A dental%' OR l.company_name LIKE '%The Plumbing%'
          OR l.company_name LIKE '%Find a%' OR l.company_name LIKE '%Do More%'
          OR l.company_name LIKE '%Routine%' OR l.company_name LIKE '%Welcome%'
          OR l.company_name LIKE '%Tyngsboro%' OR l.company_name LIKE '%Browsing%'
          OR l.company_name = 'Bd' OR l.company_name = 'PLUMBING'`
  });
  
  console.log(`Found ${badLeads.rows.length} leads with bad names`);
  
  for (const l of badLeads.rows) {
    // Extract real name from notes or website
    let newName = l.company_name;
    const websiteMatch = (l.notes || '').match(/Business:\s*(.+)/i);
    if (websiteMatch) newName = websiteMatch[1].trim();
    
    // Try to extract from website URL
    if (newName.length > 60 || newName.includes('Best') || newName.includes('Top') || newName.includes('Welcome')) {
      try {
        const url = new URL(l.website_url);
        const domain = url.hostname.replace('www.', '').split('.')[0];
        newName = domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch {}
    }
    
    // Use GROQ to extract the real business name
    const prompt = `Extract the actual business name from this data. Return ONLY the business name, nothing else.

Data: ${l.company_name}
Website: ${l.website_url || 'None'}
Notes excerpt: ${(l.notes || '').substring(0, 200)}`;
    
    try {
      const aiName = await callGROQ(prompt);
      if (aiName && aiName.length > 2 && aiName.length < 80 && !aiName.includes('\n')) {
        newName = aiName.trim();
      }
    } catch {}
    
    if (newName !== l.company_name) {
      console.log(`[${l.id}] "${l.company_name}" → "${newName}"`);
      await db.execute({sql: 'UPDATE leads SET company_name = ? WHERE id = ?', args: [newName, l.id]});
    }
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Now fix leads with empty assessments
  const emptyAssessments = await db.execute({
    sql: `SELECT l.id, l.company_name, l.notes FROM leads l 
          WHERE l.notes NOT LIKE '%Assessment:%' OR l.notes LIKE '%Assessment: \n%'`
  });
  
  console.log(`\nFound ${emptyAssessments.rows.length} leads with empty assessments`);
  
  for (const l of emptyAssessments.rows) {
    const prompt = `Analyze this lead for a web design agency. Return exactly:
ASSESSMENT: [2-3 sentences about what the business does and why they might need web services]
QUALITY: [Strong/Good/Weak]

Lead: ${l.company_name}
Data: ${(l.notes || '').substring(0, 300)}`;
    
    try {
      const response = await callGROQ(prompt);
      const assessmentMatch = response.match(/ASSESSMENT:\s*(.+?)(?:\n|$)/i);
      const qualityMatch = response.match(/QUALITY:\s*(.+)/i);
      
      if (assessmentMatch) {
        const assessment = assessmentMatch[1].trim();
        const quality = qualityMatch ? qualityMatch[1].trim() : 'Unknown';
        
        // Update notes to include assessment
        let notes = l.notes || '';
        if (notes.includes('Assessment: ')) {
          notes = notes.replace(/Assessment: \n/, `Assessment: ${assessment}\n`);
        } else {
          // Add assessment before data completeness line
          const insertPoint = notes.indexOf('Data completeness:');
          if (insertPoint > 0) {
            notes = notes.substring(0, insertPoint) + `Assessment: ${assessment}\n\n` + notes.substring(insertPoint);
          }
        }
        
        // Update quality if it was Unknown
        if (quality !== 'Unknown') {
          notes = notes.replace(/Lead quality: Unknown/, `Lead quality: ${quality}`);
        }
        
        await db.execute({sql: 'UPDATE leads SET notes = ? WHERE id = ?', args: [notes, l.id]});
        console.log(`[${l.id}] Fixed assessment for "${l.company_name}"`);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\nDone!');
}

fixNames().catch(e => console.error(e));
