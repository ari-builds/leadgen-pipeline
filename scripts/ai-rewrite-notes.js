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
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function rewrite() {
  const clients = await db.execute('SELECT id, slug, name, ideal_customer_profile, description FROM clients');
  
  for (const c of clients.rows) {
    console.log(`\n=== ${c.slug} ===`);
    const icp = JSON.parse(c.ideal_customer_profile || '{}');
    
    const leads = await db.execute({
      sql: `SELECT l.* FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = ? ORDER BY l.id`,
      args: [c.id]
    });
    
    for (const l of leads.rows) {
      const oldNotes = l.notes || '';
      const company = l.company_name || '';
      const email = l.contact_email || '';
      const phone = l.contact_phone || '';
      const website = l.website_url || '';
      const location = l.location || '';
      const facebook = l.contact_facebook || '';
      const instagram = l.contact_instagram || '';
      const linkedin = l.contact_linkedin || '';
      const twitter = l.contact_twitter || '';
      
      // Calculate data completeness
      const fields = {
        name: company.length > 2,
        email: !!email,
        phone: !!phone,
        website: !!website,
        location: !!location,
        facebook: !!facebook,
        instagram: !!instagram,
        linkedin: !!linkedin,
        twitter: !!twitter,
      };
      const filledCount = Object.values(fields).filter(Boolean).length;
      const totalFields = Object.keys(fields).length;
      const completeness = Math.round((filledCount / totalFields) * 100);
      
      // Build social media list
      const socials = [];
      if (facebook) socials.push(`Facebook: ${facebook}`);
      if (instagram) socials.push(`Instagram: ${instagram}`);
      if (linkedin) socials.push(`LinkedIn: ${linkedin}`);
      if (twitter) socials.push(`Twitter/X: ${twitter}`);
      
      // Extract old context
      const hookMatch = oldNotes.match(/Hook:\s*(.+?)(?:\n|$)/i);
      const sourceMatch = oldNotes.match(/Source:\s*(.+?)(?:\n|$)/i);
      const hook = hookMatch ? hookMatch[1].trim() : '';
      const source = sourceMatch ? sourceMatch[1].trim() : (website ? new URL(website).hostname : '');
      
      // Generate AI assessment
      const prompt = `You are a lead analyst for a web design agency called NetClicks by Ari.

Analyze this lead and provide:
1. EXACTLY what this business/person does (1 sentence)
2. Their likely need for web design/marketing services (1-2 sentences, be specific about WHY)
3. What evidence supports this assessment (cite the specific data point)
4. A lead quality rating: "Strong" (has email+phone+social, clear business), "Good" (has 2+ contact methods, is a real business), or "Weak" (limited contact info or unclear fit)

Lead data:
- Business: ${company}
- Website: ${website || 'None'}
- Contact email: ${email || 'Not found'}
- Phone: ${phone || 'Not found'}
- Location: ${location || 'Not specified'}
- Social media: ${socials.length > 0 ? socials.join(', ') : 'None found'}
- Industry: ${l.industry || 'Unknown'}
- Original source: ${source || 'Web search'}

ICP for this client: ${c.description || 'Local businesses needing web design'}

Respond in EXACTLY this format:
QUALITY: [Strong/Good/Weak]
ASSESSMENT: [2-3 sentence analysis]
CONNECT: [1 sentence explaining their specific connection to this client's services]`;

      try {
        const aiResponse = await callGROQ(prompt);
        
        // Parse AI response
        const qualityMatch = aiResponse.match(/QUALITY:\s*(.+)/i);
        const assessmentMatch = aiResponse.match(/ASSESSMENT:\s*(.+?)(?=\n|CONNECT:)/is);
        const connectMatch = aiResponse.match(/CONNECT:\s*(.+)/i);
        
        const quality = qualityMatch ? qualityMatch[1].trim() : 'Unknown';
        const assessment = assessmentMatch ? assessmentMatch[1].trim() : '';
        const connect = connectMatch ? connectMatch[1].trim() : '';
        
        // Build new notes
        const newNotes = [];
        newNotes.push(`Business: ${company}`);
        if (email) newNotes.push(`Email: ${email}`);
        if (phone) newNotes.push(`Phone: ${phone}`);
        if (website) newNotes.push(`Website: ${website}`);
        if (location) newNotes.push(`Location: ${location}`);
        if (socials.length > 0) newNotes.push(`Social media: ${socials.join(' | ')}`);
        newNotes.push('');
        newNotes.push(`Assessment: ${assessment}`);
        if (connect) newNotes.push(`Connection: ${connect}`);
        newNotes.push('');
        newNotes.push(`Data completeness: ${completeness}% (${filledCount}/${totalFields} fields)`);
        newNotes.push(`Lead quality: ${quality}`);
        if (source) newNotes.push(`Source: ${source}`);
        
        // Calculate new score based on data completeness + quality
        let newScore = 5;
        if (quality === 'Strong') newScore = 8;
        else if (quality === 'Good') newScore = 6;
        else newScore = 4;
        
        // Adjust for data completeness
        if (completeness >= 70) newScore += 1;
        if (completeness >= 50) newScore += 1;
        newScore = Math.min(10, Math.max(1, newScore));
        
        await db.execute({
          sql: 'UPDATE leads SET notes = ?, score = ?, company_name = ? WHERE id = ?',
          args: [newNotes.join('\n'), newScore, company, l.id]
        });
        
        console.log(`[${l.id}] ${company.substring(0, 40)} → Score: ${newScore} | ${quality} | ${completeness}% complete`);
        
        // Rate limit
        await new Promise(r => setTimeout(r, 200));
        
      } catch (e) {
        console.log(`[${l.id}] ${company.substring(0, 40)} → ERROR: ${e.message}`);
      }
    }
  }
  
  // Final counts
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`\nTotal leads: ${total.rows[0].c}`);
  
  const clients2 = await db.execute('SELECT id, slug FROM clients');
  for (const c of clients2.rows) {
    const count = await db.execute({sql: 'SELECT COUNT(*) as c FROM client_leads WHERE client_id = ?', args: [c.id]});
    console.log(`${c.slug}: ${count.rows[0].c} leads`);
  }
}

rewrite().catch(e => console.error(e));
