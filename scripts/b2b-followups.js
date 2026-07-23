const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const NEW_SIGNATURE = `Ariana
Founder & CEO | NetClicks by Ari
📞 netclicksbyari@gmail.com
🌐 Yakima, WA
"Helping local businesses get found by the families who need them"`;

// Follow-up sequences: initial + 2 follow-ups per lead
const sequences = [
  // ===== VALLEY HILLS FUNERAL HOME =====
  {
    lead_query: "Valley Hills Funeral Home",
    followups: [
      {
        delay_days: 3,
        subject: "Quick follow-up — partnership for Valley Hills",
        body: `Hi there,

I wanted to follow up on my last message about a potential partnership between Valley Hills and Legacy Memorial Restorations.

I know you're busy caring for families every day, so I'll keep this short: when families mention a loved one's headstone needing care during arrangements, you could refer them to us. We handle everything — inspection, estimate, restoration, follow-up. Zero work for your team.

I'd love just 10 minutes to show you how this works. Would Thursday or Friday work for a quick call?

${NEW_SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "Still here for Valley Hills",
        body: `Hi there,

I know you're probably swamped, so I won't take much of your time. I reached out last week about a referral partnership — when families mention headstones needing care, you send them our way, we handle everything.

No cost to you, no extra work for your staff. Just one more way to serve families.

If now isn't the right time, no worries at all. But if you'd like to learn more, I'm just a reply away.

${NEW_SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "One last note — Valley Hills",
        body: `Hi there,

This is my last follow-up. I wanted to leave the door open — if families ever mention a loved one's headstone needing care, Legacy Memorial Restorations is here to help. Zero work for your team.

If you'd like to explore a referral partnership, just reply "yes" and I'll send over the details. If not, I completely understand.

Wishing you and your team all the best.

${NEW_SIGNATURE}`
      }
    ]
  },
  // ===== SHAW & SONS =====
  {
    lead_query: "Shaw & Sons Funeral Home",
    followups: [
      {
        delay_days: 3,
        subject: "Partnership idea for Shaw & Sons",
        body: `Hi there,

I wanted to circle back on my message about a referral partnership between Shaw & Sons and Legacy Memorial Restorations.

Here's the short version: when families mention a headstone needing care during arrangements, you refer them to us. We handle everything — no work for your staff, no disruption to your process.

I'd love to show you how this works in a quick 10-minute call. Would Tuesday or Wednesday work?

${NEW_SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "Shaw & Sons — quick thought",
        body: `Hi there,

I know you're busy, so I'll be brief. The offer still stands — a referral partnership where families who mention headstone care get connected to Legacy Memorial Restorations. Zero work for your team.

If this isn't the right time, no worries. But if you'd like to explore it, just reply and I'll send over the details.

${NEW_SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Closing the loop — Shaw & Sons",
        body: `Hi there,

This is my final note. I wanted to make sure you knew about Legacy Memorial Restorations — a local Yakima team that handles headstone cleaning and restoration.

If families ever mention a headstone needing care, we're here. Zero work for your staff.

If you'd like to chat, I'm just a reply away. Wishing you well.

${NEW_SIGNATURE}`
      }
    ]
  },
  // ===== WIEBE =====
  {
    lead_query: "Wiebe Funeral Homes",
    followups: [
      {
        delay_days: 3,
        subject: "After 75 years — one more way to serve",
        body: `Hi there,

I wanted to follow up on my message about a referral partnership with Wiebe Funeral Homes.

After 75 years of serving families, you know what matters most. Adding headstone care to your referral network is one more way to honor the families who've trusted you for generations.

We handle everything — inspection, estimate, restoration, follow-up. Zero work for your staff.

Would you have 10 minutes this week for a quick call?

${NEW_SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "Wiebe — still here",
        body: `Hi there,

I know you're busy, so I'll keep this short. The offer still stands — a referral partnership where families who mention headstone care get connected to Legacy Memorial Restorations. Zero work for your team.

After 75 years of building trust with families, this is one more way to extend that care.

If you'd like to explore it, just reply. If not, no worries at all.

${NEW_SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Final note — Wiebe Funeral Homes",
        body: `Hi there,

This is my last message. After 75 years of serving families, you've built something truly special. I wanted to leave the door open — if families ever mention a headstone needing care, Legacy Memorial Restorations is here to help.

If you'd like to chat, I'm just a reply away. Wishing you and your team all the best.

${NEW_SIGNATURE}`
      }
    ]
  },
  // ===== YAKIMA FLORAL =====
  {
    lead_query: "Yakima Floral",
    followups: [
      {
        delay_days: 3,
        subject: "Memorial flowers — follow-up for Yakima Floral",
        body: `Hi Larissa,

I wanted to follow up on my message about memorial flower placements.

When we restore a headstone, families often want to place fresh flowers — birthdays, anniversaries, Memorial Day. We don't do flowers, but you do. And your custom arrangements are exactly what these families would love.

You'd get repeat customers who order regularly. Would you have 10 minutes this week to chat about it?

${NEW_SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "Yakima Floral — quick thought",
        body: `Hi Larissa,

I know you're busy, so I'll be brief. The offer still stands — when we restore headstones, families want flowers. We'd send those customers directly to you.

Repeat clients, regular orders, no extra marketing needed on your end.

If you'd like to explore it, just reply. If not, no worries — your arrangements are beautiful, and I'm sure business is going well!

${NEW_SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "One last note — Yakima Floral",
        body: `Hi Larissa,

This is my final note. I wanted to leave the door open — when families get a headstone restored, they often want fresh flowers. We'd love to send those customers your way.

If you'd ever like to explore a referral partnership, just reply. Wishing you and Yakima Floral all the best!

${NEW_SIGNATURE}`
      }
    ]
  },
  // ===== SIMPLY CRAFTED FLORAL =====
  {
    lead_query: "Simply Crafted Floral",
    followups: [
      {
        delay_days: 3,
        subject: "Memorial flowers — follow-up",
        body: `Hi there,

I wanted to follow up on my message about memorial flower placements.

When we restore a headstone, families often want to place fresh flowers — birthdays, anniversaries, Memorial Day. We don't do flowers, but you do. And your boutique arrangements are exactly what these families would love.

You'd get repeat customers who order regularly. Would you have 10 minutes this week to chat?

${NEW_SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "Quick thought — Simply Crafted",
        body: `Hi there,

I know you're busy, so I'll keep this short. The offer still stands — when we restore headstones, families want flowers. We'd send those customers directly to you.

Repeat clients, regular orders, no extra marketing needed.

If you'd like to explore it, just reply. If not, no worries at all.

${NEW_SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Final note — Simply Crafted Floral",
        body: `Hi there,

This is my last message. I wanted to leave the door open — when families get a headstone restored, they often want fresh flowers. We'd love to send those customers your way.

If you'd ever like to explore a referral partnership, just reply. Wishing you well!

${NEW_SIGNATURE}`
      }
    ]
  },
  // ===== ROOTS NURSERY =====
  {
    lead_query: "Roots Nursery",
    followups: [
      {
        delay_days: 3,
        subject: "Memorial landscaping — follow-up",
        body: `Hi there,

I wanted to follow up on my message about memorial landscaping referrals.

When we restore a headstone, families often want to improve the surrounding area — plant flowers, design a memorial garden, add seasonal plantings. We don't do landscaping, but you do.

You'd get a new customer segment — people who care deeply about honoring their loved one's memory. Would you have 10 minutes this week to chat?

${NEW_SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "Roots Nursery — quick thought",
        body: `Hi there,

I know you're busy, so I'll keep this short. The offer still stands — when we restore headstones, families want landscaping. We'd send those customers directly to you.

New customer segment, people who value quality and care. No extra marketing needed.

If you'd like to explore it, just reply. If not, no worries.

${NEW_SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Final note — Roots Nursery",
        body: `Hi there,

This is my last message. I wanted to leave the door open — when families get a headstone restored, they often want landscaping. We'd love to send those customers your way.

If you'd ever like to explore a referral partnership, just reply. Wishing you and Roots Nursery all the best!

${NEW_SIGNATURE}`
      }
    ]
  }
];

async function main() {
  let totalInserted = 0;

  for (const seq of sequences) {
    const lead = await db.execute({
      sql: 'SELECT id FROM leads WHERE company_name LIKE ?',
      args: [`%${seq.lead_query}%`]
    });
    if (!lead.rows.length) {
      console.log(`LEAD NOT FOUND: ${seq.lead_query}`);
      continue;
    }
    const leadId = lead.rows[0].id;

    for (let i = 0; i < seq.followups.length; i++) {
      const fu = seq.followups[i];
      await db.execute({
        sql: `INSERT INTO outreach_emails (lead_id, subject, body, status, template_type, created_at) VALUES (?, ?, ?, 'draft', ?, datetime('now'))`,
        args: [leadId, fu.subject, fu.body, `followup_${i + 1}`]
      });
      totalInserted++;
      console.log(`[${seq.lead_query}] Follow-up ${i + 1}: "${fu.subject}"`);
    }
  }

  // Also update existing emails with new signature
  const existing = await db.execute("SELECT id, body FROM outreach_emails WHERE template_type IS NULL OR template_type = 'initial'");
  let updated = 0;
  for (const row of existing.rows) {
    const newBody = row.body.replace(
      /Ariana\nFounder & CEO, NetClicks by Ari\nnetclicksbyari@gmail\.com/,
      NEW_SIGNATURE
    );
    if (newBody !== row.body) {
      await db.execute({sql: 'UPDATE outreach_emails SET body = ? WHERE id = ?', args: [newBody, row.id]});
      updated++;
    }
  }

  console.log(`\nDone! Inserted ${totalInserted} follow-ups. Updated ${updated} existing emails with new signature.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
