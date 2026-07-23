const { createClient } = require("@libsql/client");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

function extractHook(lead) {
  const notes = (lead.notes || "").toLowerCase();
  if (notes.includes("veteran") || notes.includes("military"))
    return "your family's veteran headstone";
  if (notes.includes("genealog") || notes.includes("family history"))
    return "your work preserving your family's history";
  if (notes.includes("west hill")) return "your family headstones at West Hills";
  if (notes.includes("yakima")) return "your family's memorial in Yakima";
  if (notes.includes("clean") || notes.includes("restore"))
    return "getting your loved one's headstone cleaned and restored";
  if (notes.includes("tahoma")) return "your family's plot at Tahoma Cemetery";
  if (notes.includes("calvary"))
    return "your family's memorial at Calvary Cemetery";
  if (notes.includes("terrace"))
    return "your family's headstone at Terrace Heights";
  if (notes.includes("funeral"))
    return "the families you serve with headstone care";
  if (notes.includes("stolen") || notes.includes("vandal"))
    return "restoring and protecting memorials";
  if (notes.includes("mower") || notes.includes("damaged"))
    return "repairing weather-worn headstones";
  const sentences = (lead.notes || "")
    .split(/[.!\n]+/)
    .filter((s) => s.trim().length > 0);
  if (sentences.length > 0) return sentences[0].trim().substring(0, 100);
  return "honoring your loved one's memory";
}

function capitalize(name) {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function makeSeed(lead) {
  return (lead.id || 0) * 7 + (lead.contact_name || "").length * 13;
}

function scoreTier(score) {
  if (score >= 9) return "hot";
  if (score >= 7) return "warm";
  return "cool";
}

const SIGNATURE = "---\nAriana, Founder & CEO\nNetClicks by Ari\nnetclicksbyari@gmail.com";

function generateEmail(lead) {
  const name = capitalize(lead.contact_name || "Friend");
  const hook = extractHook(lead);
  const score = lead.score || 5;
  const tier = scoreTier(score);
  const seed = makeSeed(lead);
  const location = lead.location ? ` in ${lead.location}` : "";
  const locationRef = lead.location ? ` near ${lead.location}` : "";

  // Subject lines by tier
  const subjects = {
    hot: [
      `${name}, I found something for you`,
      `A thought about ${hook}`,
      `Quick question for you, ${name}`,
      `${name} — this reminded me of you`,
      `I couldn't help but think of you`,
    ],
    warm: [
      `Preserving what matters most${location}`,
      `A local resource for ${hook}`,
      `Something you might find meaningful`,
      `Connecting you with Legacy Memorial Restorations`,
      `${name}, a quick note about memorial care`,
    ],
    cool: [
      `A resource for families in Yakima`,
      `Headstone care — just in case you need it`,
      `Local restoration services available`,
      `Quick note about memorial preservation`,
      `Something for your family to know about`,
    ],
  };

  const subject = pick(subjects[tier], seed);

  // Openings by context
  const openings = [
    `I hope this message finds you well. I came across your connection to ${hook}, and I wanted to share something that might be meaningful to you.`,
    `I'm reaching out because I think you might appreciate knowing about a local resource for memorial care.`,
    `I wanted to reach out personally because I think this could matter to you and your family.`,
    `I noticed your connection to ${hook} and thought you'd want to know about this.`,
    `Someone who cares about ${hook} — I wanted to make sure you knew about this resource.`,
  ];

  const opening = pick(openings, seed);

  // Body by tier
  const bodies = {
    hot: `

Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time — gentle cleaning, full restoration, and even placing fresh flowers and lights for special occasions.

I'm reaching out now because ${hook} — and I didn't want you to miss the chance to have that taken care of while the weather is good. Joseph and his team are already working with families across the Yakima Valley, and they offer a 50% veteran discount as their way of giving back.

Would you like me to connect you directly with Joseph? He can give you a quick, no-obligation estimate for any memorials you have in mind.`,
    warm: `

Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time — whether it's gentle cleaning, full restoration, or placing fresh flowers and lights for special occasions.

I thought of you because ${hook}. If this is something you've been thinking about, I'd love to connect you with Joseph and his team. They're easy to work with and truly care about honoring every memorial they restore.

They also offer a 50% veteran discount, which is their way of honoring those who served.`,
    cool: `

Legacy Memorial Restorations is a Yakima-based team that specializes in headstone cleaning and restoration. They help families preserve the beauty and dignity of memorials — from gentle cleaning to full restoration, and even flower and light placements for special occasions.

If ${hook} is something you've ever thought about, this might be worth knowing about. No pressure at all — just wanted to make sure you knew this resource existed here in Yakima.

They also offer a 50% veteran discount.`,
  };

  // Closings by tier
  const closings = {
    hot: [
      `I'd love to hear from you, ${name}. Even a quick reply just so I know you saw this would be great.`,
      `Let me know if you'd like to connect with Joseph, ${name}. I think you'll really like what they do.`,
      `I'm here if you have any questions, ${name}. Just hit reply.`,
    ],
    warm: [
      `No pressure at all — just wanted to make sure you knew this resource existed here in Yakima.`,
      `Feel free to reply anytime if you'd like more information. I'm happy to help.`,
      `I hope this is helpful, ${name}. Wishing you and your family well.`,
    ],
    cool: [
      `No pressure at all — just wanted to make sure you knew this was available.`,
      `If you ever need it, you know where to find us. Wishing you well.`,
      `Just in case this is ever useful to you or your family. Take care, ${name}.`,
    ],
  };

  const closing = pick(closings[tier], seed);

  const body = `Hi ${name},

${opening}${bodies[tier]}

${closing}

${SIGNATURE}`;

  return { subject, body };
}

async function main() {
  console.log("=== Lead Outreach Email Generator (Unique Per Lead) ===\n");

  // Delete existing emails
  await db.execute("DELETE FROM outreach_emails");
  console.log("Cleared existing outreach emails\n");

  // Fetch all leads linked to any client
  const result = await db.execute({
    sql: `SELECT l.*, cl.client_id FROM leads l 
          INNER JOIN client_leads cl ON l.id = cl.lead_id`,
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
              VALUES (?, ?, 'initial', ?, ?, 'draft')`,
        args: [lead.id, lead.client_id, subject, body],
      });

      generated++;
      const hook = extractHook(lead);
      console.log(
        `[${generated}/${leads.length}] ${lead.contact_name} (ID: ${lead.id}, Score: ${lead.score}) — "${subject}"`
      );
    } catch (err) {
      errors++;
      console.error(
        `Error for lead ${lead.contact_name} (ID: ${lead.id}): ${err.message}`
      );
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total leads: ${leads.length}`);
  console.log(`Emails generated: ${generated}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
