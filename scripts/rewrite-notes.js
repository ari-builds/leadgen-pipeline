const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODUxMDExNzgsImlkIjoiMDE5ZmEwNTItNTUwMS03YmYyLTkwY2UtYzA3NzM0MzI4YTg3Iiwia2lkIjoiWXRDZ0VtRDJFenJISVdQUkVwbkNPZWdmZUdmcEpTN3dwY0p0cVdMQXdXayIsInJpZCI6IjU0NjM5NDI1LTBhNmUtNGZlYS1iYzVlLWRhYTQwNzdiOGI3NCJ9.yrGxTRNTbKWzJO9XKN_yWjmU_smBTyoKu9ZDXlMMINItQ3NupHZdS7dbGrojAACiCSYP6Dv13F7u9EJAVnYUAA'
});

async function rewrite() {
  // Process Niloy leads first (Dhaka businesses)
  const clients = await db.execute('SELECT id, slug, ideal_customer_profile FROM clients');
  
  for (const c of clients.rows) {
    console.log(`\n=== ${c.slug} ===`);
    const leads = await db.execute({
      sql: `SELECT l.id, l.company_name, l.contact_name, l.contact_email, l.contact_phone, l.location, l.notes, l.score, l.website_url, l.contact_linkedin, l.contact_twitter, l.contact_facebook, l.contact_instagram
            FROM leads l JOIN client_leads cl ON l.id = cl.lead_id
            WHERE cl.client_id = ? ORDER BY l.id`,
      args: [c.id]
    });
    
    for (const l of leads.rows) {
      const notes = (l.notes || '');
      const company = l.company_name || 'Unknown';
      const website = l.website_url || '';
      const location = l.location || '';
      const email = l.contact_email || '';
      const phone = l.contact_phone || '';
      
      // Parse existing contact info from notes - detect suspicious emails
      const hasEmail = email && !email.includes('user@') && !email.includes('you@') && 
                       email.includes('@') && email.length > 5 &&
                       !email.includes('.webp') && !email.includes('.png') && !email.includes('.jpg');
      const hasPhone = phone && phone.length > 5 && /\d/.test(phone);
      
      // Extract social media - from dedicated columns AND from notes
      const socialPlatforms = [];
      const socialUrls = {};
      if (l.contact_facebook) { socialPlatforms.push('Facebook'); socialUrls.facebook = l.contact_facebook; }
      if (l.contact_instagram) { socialPlatforms.push('Instagram'); socialUrls.instagram = l.contact_instagram; }
      if (l.contact_linkedin) { socialPlatforms.push('LinkedIn'); socialUrls.linkedin = l.contact_linkedin; }
      if (l.contact_twitter) { socialPlatforms.push('Twitter/X'); socialUrls.twitter = l.contact_twitter; }
      // Also check notes for platforms (may have URLs or just names)
      const socialMatch = notes.match(/Social:\s*(.+)/i);
      if (socialMatch) {
        const notePlatforms = socialMatch[1].split(',').map(s => s.trim());
        for (const p of notePlatforms) {
          const lower = p.toLowerCase();
          if (!socialPlatforms.find(sp => sp.toLowerCase() === lower)) {
            // Check if it's a URL
            if (p.startsWith('http')) {
              if (lower.includes('facebook')) { socialPlatforms.push('Facebook'); socialUrls.facebook = p; }
              else if (lower.includes('instagram')) { socialPlatforms.push('Instagram'); socialUrls.instagram = p; }
              else if (lower.includes('linkedin')) { socialPlatforms.push('LinkedIn'); socialUrls.linkedin = p; }
              else if (lower.includes('twitter') || lower.includes('x.com')) { socialPlatforms.push('Twitter/X'); socialUrls.twitter = p; }
              else if (lower.includes('tiktok')) { socialPlatforms.push('TikTok'); socialUrls.tiktok = p; }
              else if (lower.includes('youtube')) { socialPlatforms.push('YouTube'); socialUrls.youtube = p; }
            } else {
              // Just a platform name - note it exists but no URL
              socialPlatforms.push(p);
            }
          }
        }
      }
      const hasSocial = socialPlatforms.length > 0;
      
      // Extract hook from notes
      const hookMatch = notes.match(/Hook:\s*(.+?)(?:\n|$)/i);
      const hook = hookMatch ? hookMatch[1].trim() : '';
      
      // Extract source
      const sourceMatch = notes.match(/Source:\s*(.+?)(?:\n|$)/i);
      const source = sourceMatch ? sourceMatch[1].trim() : '';
      
      // Build new notes based on actual data
      let newNotes = [];
      let newScore = 5; // Default middle score
      let scoreReason = '';
      
      if (c.slug === 'legacy-memorial-restorations') {
        // Kevin's leads - individuals, not businesses
        newNotes.push(`Contact: ${l.contact_name || 'Name not available'}`);
        if (hasEmail) newNotes.push(`Email: ${email}`);
        if (hasPhone) newNotes.push(`Phone: ${phone}`);
        if (hook) newNotes.push(`Context: ${hook}`);
        if (source) newNotes.push(`Found at: ${source}`);
        
        // Score based on engagement signals
        if (hook.includes('military') || hook.includes('headstone')) newScore = 9;
        else if (hook.includes('genealog') || hook.includes('family')) newScore = 8;
        else if (hook.includes('cleaning') || hook.includes('dirty')) newScore = 9;
        else if (hook.includes('Memorial Day')) newScore = 7;
        else newScore = 6;
        
        scoreReason = hook ? `Based on ${hook.toLowerCase().includes('complaint') || hook.toLowerCase().includes('dirty') ? 'explicit restoration need' : 'family connection to cemetery'}` : 'Individual with cemetery connection';
        
      } else {
        // Business leads
        newNotes.push(`Business: ${company}`);
        if (location) newNotes.push(`Location: ${location}`);
        if (hasEmail) newNotes.push(`Email: ${email}`);
        if (hasPhone) newNotes.push(`Phone: ${phone}`);
        if (website) newNotes.push(`Website: ${website}`);
        if (socialPlatforms.length > 0) {
          newNotes.push(`Social presence: ${socialPlatforms.join(', ')}`);
          // Add URLs when we have them
          const urls = Object.entries(socialUrls).filter(([k,v]) => v && v.startsWith('http'));
          if (urls.length > 0) newNotes.push(`Social links: ${urls.map(([k,v]) => `${k}: ${v}`).join(' | ')}`);
          // Note platforms without URLs
          const noUrl = socialPlatforms.filter(p => !socialUrls[p.toLowerCase()] && !Object.values(socialUrls).some(v => p.toLowerCase().includes(v)));
          if (noUrl.length > 0) newNotes.push(`Social platforms (no URL found): ${noUrl.join(', ')}`);
        }
        if (hook) newNotes.push(`Key detail: ${hook}`);
        
        // Score based on ICP fit
        const icp = JSON.parse(c.ideal_customer_profile || '{}');
        let fitScore = 5;
        
        // Has website = might need redesign
        if (website && !website.includes('facebook.com') && !website.includes('google.com')) fitScore += 2;
        
        // Has social media = active online
        if (socialPlatforms.length >= 2) fitScore += 1;
        if (Object.values(socialUrls).some(v => v && v.startsWith('http'))) fitScore += 1; // Has actual social URLs
        
        // Has contact info = reachable
        if (hasEmail && hasPhone) fitScore += 1;
        else if (hasEmail || hasPhone) fitScore += 0.5;
        
        // Location check (basic)
        const locLower = location.toLowerCase();
        if (icp.targetLocation) {
          const targetLoc = icp.targetLocation.toLowerCase();
          if (locLower.includes(targetLoc) || locLower.includes('yakima') || locLower.includes('seattle')) fitScore += 1;
        }
        
        newScore = Math.min(10, Math.max(3, fitScore));
        
        if (fitScore >= 8) scoreReason = 'Strong fit: established business with online presence, likely needs website improvements or redesign';
        else if (fitScore >= 6) scoreReason = 'Good fit: business with some online presence, potential website or marketing needs';
        else scoreReason = 'Moderate fit: business exists but limited online signals';
      }
      
      // Update the lead - embed score reason in notes
      const finalNotes = newNotes.join('\n') + `\n\nAssessment: ${scoreReason}`;
      await db.execute({
        sql: 'UPDATE leads SET notes = ?, score = ? WHERE id = ?',
        args: [finalNotes, newScore, l.id]
      });
      
      console.log(`[${l.id}] ${company} → Score: ${newScore} | ${scoreReason.substring(0, 60)}`);
    }
  }
  
  // Final counts
  const total = await db.execute('SELECT COUNT(*) as c FROM leads');
  console.log(`\nTotal leads: ${total.rows[0].c}`);
}

rewrite().catch(e => console.error(e));
