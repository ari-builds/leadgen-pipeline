const { createClient } = require("@libsql/client");

const db = createClient({
  url: "libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ3NjcyNzksImlkIjoiMDE5ZjhiYjEtZTEwMS03YjFjLThjMGMtODRjZGI4ZWQ5MGQ4Iiwia2lkIjoidm9nSHl3cVBCY1J6d1NPVlJDWWhTZkFpN25VSGlNM0FlV0tONktsY0hoSSIsInJpZCI6IjNmNDlkMGViLTc3OWQtNGZmMy04YzQ2LTg5YWE4MTAwOGFjMSJ9.vmSmog-sLzR5_PTblNB7luC5ryTjm-c-XYdgwFmFoCDv1UEc9CS65E1NGY4qsBBy3vPXsEGiFW4HhUdBixEUCQ",
});

function extractHook(lead) {
  const notes = (lead.notes || '').toLowerCase();
  if (notes.includes('veteran') || notes.includes('military')) return 'your family\'s veteran headstone';
  if (notes.includes('genealog') || notes.includes('family history')) return 'your work preserving your family\'s history';
  if (notes.includes('west hill')) return 'your family headstones at West Hills';
  if (notes.includes('yakima')) return 'your family\'s memorial in Yakima';
  if (notes.includes('clean') || notes.includes('restore')) return 'getting your loved one\'s headstone cleaned and restored';
  if (notes.includes('tahoma')) return 'your family\'s plot at Tahoma Cemetery';
  if (notes.includes('calvary')) return 'your family\'s memorial at Calvary Cemetery';
  if (notes.includes('terrace')) return 'your family\'s headstone at Terrace Heights';
  if (notes.includes('funeral')) return 'helping families you serve with headstone care';
  if (notes.includes('genealogical society')) return 'connecting families with memorial preservation resources';
  if (notes.includes('vfw') || notes.includes('american legion')) return 'honoring veterans\' memorials';
  if (notes.includes('stolen') || notes.includes('vandal')) return 'restoring and protecting memorials';
  if (notes.includes('mower') || notes.includes('damaged')) return 'repairing weather-worn headstones';
  // Try to extract from notes
  const sentences = (lead.notes || '').split(/[.!\n]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) return sentences[0].trim().substring(0, 100);
  return 'honoring your loved one\'s memory';
}

function capitalize(name) {
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function generateEmail(lead) {
  const name = capitalize(lead.contact_name || 'Friend');
  const hook = extractHook(lead);
  const locationRef = lead.location ? ` near ${lead.location}` : '';
  const signature = '---\nAriana, Founder & CEO\nNetClicks by Ari\nnetclicksbyari@gmail.com';
  
  const subject = `Preserving your family's memorial${locationRef ? ` in ${lead.location}` : ''}`;
  const body = `Hi ${name},

I hope this message finds you well. I'm reaching out because I came across your connection to ${hook}, and I wanted to share something that might be meaningful to you.

Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time — whether it's gentle cleaning, full restoration, or even placing fresh flowers and lights for special occasions.

I know how important it is to keep a loved one's memorial looking its best, and I thought of you because ${hook}. If this is something you've been thinking about, I'd love to connect you with Joseph and his team.

They also offer a 50% veteran discount, which is their way of honoring those who served.

No pressure at all — just wanted to make sure you knew this resource existed here in Yakima.

${signature}`;
  
  return { subject, body };
}

async function main() {
  console.log("=== Lead Outreach Email Generator ===\n");

  // Fetch all leads linked to client_id 1
  const result = await db.execute({
    sql: `SELECT l.* FROM leads l 
          INNER JOIN client_leads cl ON l.id = cl.lead_id 
          WHERE cl.client_id = 1`,
    args: [],
  });

  const leads = result.rows;
  console.log(`Found ${leads.length} leads for client_id 1\n`);

  let generated = 0;
  let errors = 0;

  for (const lead of leads) {
    try {
      const { subject, body } = generateEmail(lead);
      
      await db.execute({
        sql: `INSERT INTO outreach_emails (lead_id, client_id, template_type, subject, body, status) 
              VALUES (?, 1, 'initial', ?, ?, 'draft')`,
        args: [lead.id, subject, body],
      });
      
      generated++;
      console.log(`✓ [${generated}/${leads.length}] ${lead.contact_name} (ID: ${lead.id})`);
    } catch (err) {
      errors++;
      console.error(`✗ Error for lead ${lead.contact_name} (ID: ${lead.id}): ${err.message}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total leads: ${leads.length}`);
  console.log(`Emails generated: ${generated}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
