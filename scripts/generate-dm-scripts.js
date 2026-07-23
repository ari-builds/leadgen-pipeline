const {createClient} = require('@libsql/client');
const tursoDb = createClient({
  url:'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

function extractHook(notes) {
  if (!notes) return '';
  const match = notes.match(/Hook:\s*(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : '';
}

function generateDMScript(lead) {
  const name = lead.contact_name || 'there';
  const firstName = name.split(' ')[0];
  const hook = extractHook(lead.notes);
  const score = lead.score || 5;
  const company = lead.company_name || '';
  
  let platform = '';
  let url = '';
  if (lead.contact_linkedin) {
    platform = 'LinkedIn';
    url = lead.contact_linkedin;
  } else if (lead.contact_instagram) {
    platform = 'Instagram';
    url = lead.contact_instagram;
  } else if (lead.contact_facebook) {
    platform = 'Facebook';
    url = lead.contact_facebook;
  } else if (lead.contact_twitter) {
    platform = 'X/Twitter';
    url = lead.contact_twitter;
  }

  let approach = '';
  let message = '';
  
  if (score >= 9) {
    approach = 'Direct value offer - this lead is highly engaged';
    message = `Hey ${firstName}! I came across your profile and noticed ${hook || 'your connection to the memorial services space'}. We help businesses like yours get more visibility and connect with families who need restoration services. Would love to share how we've been helping similar businesses grow. Open to a quick chat?`;
  } else if (score >= 7) {
    approach = 'Warm connection - shared interest in the industry';
    message = `Hi ${firstName}! ${hook || 'I noticed your work in the memorial/cemetery space'} - really cool stuff. We work with businesses in this industry to help them reach more families who need their services. Thought it might be worth connecting. No pressure, just genuine interest in what you do.`;
  } else {
    approach = 'Casual connection - build relationship first';
    message = `Hey ${firstName}! ${hook || 'Found your profile while researching the Yakima area memorial services community'}). Always great to connect with people in the space. Would love to learn more about what you do!`;
  }

  return {
    platform,
    url,
    approach,
    message,
    followUp: `Following up on my last message, ${firstName}. ${hook || 'I think there could be a great opportunity here for your business.'} Let me know if you'd like to chat!`,
  };
}

async function main() {
  // Get all leads with some social media
  const leads = await tursoDb.execute({
    sql: `SELECT l.* FROM leads l JOIN client_leads cl ON l.id = cl.lead_id 
          WHERE cl.client_id = 1 
          AND (l.contact_linkedin IS NOT NULL AND l.contact_linkedin != ''
               OR l.contact_instagram IS NOT NULL AND l.contact_instagram != ''
               OR l.contact_facebook IS NOT NULL AND l.contact_facebook != ''
               OR l.contact_twitter IS NOT NULL AND l.contact_twitter != '')`,
    args: []
  });

  console.log(`Generating DM scripts for ${leads.rows.length} leads...`);

  let created = 0;
  for (const lead of leads.rows) {
    const dm = generateDMScript(lead);
    
    // Create thread
    await tursoDb.execute({
      sql: `INSERT INTO outreach_threads (lead_id, client_id, platform, status) VALUES (?, 1, ?, 'pending')`,
      args: [lead.id, dm.platform]
    });
    
    const threadId = (await tursoDb.execute('SELECT last_insert_rowid() as id')).rows[0].id;
    
    // Create initial message
    await tursoDb.execute({
      sql: `INSERT INTO outreach_messages (thread_id, direction, content, is_ai_generated) VALUES (?, 'outbound', ?, 1)`,
      args: [threadId, dm.message]
    });
    
    // Create follow-up message
    await tursoDb.execute({
      sql: `INSERT INTO outreach_messages (thread_id, direction, content, is_ai_generated) VALUES (?, 'outbound', ?, 1)`,
      args: [threadId, dm.followUp]
    });
    
    created++;
  }

  console.log(`Created ${created} DM threads with scripts`);
  
  // Verify
  const threads = await tursoDb.execute('SELECT COUNT(*) as c FROM outreach_threads');
  const messages = await tursoDb.execute('SELECT COUNT(*) as c FROM outreach_messages');
  console.log(`Total threads: ${threads.rows[0].c}, messages: ${messages.rows[0].c}`);
}

main().catch(console.error);
