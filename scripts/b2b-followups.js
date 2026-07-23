const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const SIGNATURE = `Ariana
Digital Marketing Director | NetClicks by Ari
On behalf of Legacy Memorial Restorations
netclicksbyari@gmail.com | Yakima, WA`;

// Each follow-up has a NEW ANGLE — not just "checking in"
const sequences = [
  // ===== VALLEY HILLS FUNERAL HOME =====
  {
    lead_query: "Valley Hills Funeral Home",
    followups: [
      {
        delay_days: 3,
        subject: "I talked to Joseph about Valley Hills",
        body: `Hi there,

I spoke with Joseph at Legacy Memorial Restorations about your team at Valley Hills, and he was genuinely excited about the idea of partnering with you.

Here's what he told me: "Families who come to a funeral home already trust that facility. If that funeral home recommends us for headstone care, the family doesn't have to second-guess — they already trust the recommendation."

That stuck with me. It means the referral isn't just a lead — it's a warm introduction from someone the family already trusts. That's worth more than any ad.

Joseph handles everything end-to-end. Your staff just passes along a name. Would you have 10 minutes this week for a quick call with him?

${SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "What families say after getting headstones restored",
        body: `Hi there,

I wanted to share something Joseph told me last week. He just finished restoring a headstone for a family in Yakima — the wife had been visiting her husband's grave for 12 years, and the stone was so weathered she could barely read the name.

After the restoration, she called Joseph in tears. She said it felt like visiting him for the first time in years.

That's the kind of impact your referral could have. When families mention a headstone needing care during arrangements, you'd be connecting them with someone who genuinely changes how they experience grief.

Joseph handles everything. Zero work for your team. Would a quick call this week work?

${SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Before Memorial Day — timing matters",
        body: `Hi there,

Quick note: Memorial Day is coming up, and that's when families visit graves most often. It's also when they notice headstones the most — the ones that are weathered, stained, or hard to read.

If Valley Hills has families planning Memorial Day visits, now would be the perfect time to mention Legacy Memorial Restorations. Joseph can have headstones restored before the holiday.

No cost to you, no work for your staff. Just a name and number to pass along.

If this makes sense for Valley Hills, let me know. If not, I completely understand.

${SIGNATURE}`
      }
    ]
  },
  // ===== SHAW & SONS =====
  {
    lead_query: "Shaw & Sons Funeral Home",
    followups: [
      {
        delay_days: 3,
        subject: "I talked to Joseph about Shaw & Sons",
        body: `Hi there,

I spoke with Joseph at Legacy Memorial Restorations about your team at Shaw & Sons, and he had an interesting thought.

He said: "Funeral homes are the first call families make. If Shaw & Sons recommends us for headstone care, families don't have to Google 'headstone cleaning near me' and hope for the best. They get a trusted recommendation from someone they already depend on."

That's the value of this partnership — it's not a cold referral. It's a warm introduction from someone families already trust.

Joseph handles everything end-to-end. Your staff just passes along a name. Would you have 10 minutes this week for a quick call?

${SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "A story from last week",
        body: `Hi there,

Joseph shared a story with me last week that I think you'd appreciate. A daughter brought her mother's headstone in — it had been neglected for 15 years. She said she'd been too overwhelmed to know where to start.

Joseph cleaned it, restored it, and placed fresh flowers. The daughter said it was the first time she'd visited the grave without feeling guilt.

That's what happens when families get connected with the right resource. And it starts with someone like you mentioning it during arrangements.

Would a quick call this week work?

${SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "The families who need this most",
        body: `Hi there,

I've been thinking about something. The families who need headstone restoration the most are often the ones who don't know it exists. They visit a grave, see a weathered stone, and assume nothing can be done.

When a funeral home like Shaw & Sons mentions Legacy Memorial Restorations during arrangements, those families learn there's a local team that can help. That's not just a referral — it's solving a problem they didn't know had a solution.

Joseph handles everything. Zero work for your team. Let me know if you'd like to explore this.

${SIGNATURE}`
      }
    ]
  },
  // ===== WIEBE =====
  {
    lead_query: "Wiebe Funeral Homes",
    followups: [
      {
        delay_days: 3,
        subject: "75 years of trust — one more way to extend it",
        body: `Hi there,

I spoke with Joseph about Wiebe's 75-year legacy, and he said something that resonated: "After 75 years, families don't just trust Wiebe with arrangements — they trust Wiebe's judgment. If Wiebe says 'call Legacy Memorial for headstone care,' families will listen."

That's the power of a referral from a business with your reputation. It's not a suggestion — it's a trusted recommendation.

Joseph handles everything end-to-end. Your staff just passes along a name. Would you have 10 minutes this week?

${SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "What 75 years of families looks like",
        body: `Hi there,

Think about the thousands of families Wiebe has served over 75 years. How many of those families have loved ones buried in local cemeteries? How many of those headstones are now weathered, stained, or deteriorating?

Every one of those families is a potential referral. And every one of them already trusts Wiebe's recommendation.

Joseph at Legacy Memorial Restorations handles everything — inspection, estimate, restoration, follow-up. Zero work for your staff.

Would a quick call this week work?

${SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "One more way to honor 75 years of service",
        body: `Hi there,

After 75 years of serving families, Wiebe has built something remarkable. This partnership is just one more way to extend that care — connecting families with headstone restoration through someone they already trust.

Joseph handles everything. Zero work for your team. If you'd like to explore this, I'm here. If not, I wish you and your team all the best.

${SIGNATURE}`
      }
    ]
  },
  // ===== YAKIMA FLORAL =====
  {
    lead_query: "Yakima Floral",
    followups: [
      {
        delay_days: 3,
        subject: "I talked to Joseph about Yakima Floral",
        body: `Hi Larissa,

I spoke with Joseph at Legacy Memorial Restorations about your work at Yakima Floral, and he had a great idea.

He said: "When I restore a headstone, families always ask about flowers. I tell them I don't do flowers — but now I could say 'I know someone who does beautiful work.' That's Yakima Floral."

Here's the business case: memorial flower placements aren't one-time orders. Families want flowers on birthdays, anniversaries, Memorial Day, Veterans Day. That's 4-6 orders per year per family — repeat customers who already trust the recommendation.

Your custom arrangements are exactly what these families want. Would you have 10 minutes this week to chat with Joseph?

${SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "The repeat customer angle",
        body: `Hi Larissa,

I've been thinking about the revenue opportunity here. A family that gets a headstone restored through Joseph might order flowers 4-6 times per year — birthdays, anniversaries, holidays.

That's not a one-time sale. That's a recurring relationship. And they're already pre-sold because Joseph recommended you.

Your custom arrangements are exactly what these families want. Would a quick call work?

${SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "One last note — Yakima Floral",
        body: `Hi Larissa,

This is my final note. I wanted to leave the door open — when families get a headstone restored, they often want fresh flowers. We'd love to send those customers your way.

If you'd ever like to explore a referral partnership, just reply. Wishing you and Yakima Floral all the best!

${SIGNATURE}`
      }
    ]
  },
  // ===== SIMPLY CRAFTED FLORAL =====
  {
    lead_query: "Simply Crafted Floral",
    followups: [
      {
        delay_days: 3,
        subject: "Memorial flowers — the repeat customer opportunity",
        body: `Hi there,

I spoke with Joseph at Legacy Memorial Restorations about your boutique floral work, and he had a great idea.

When he restores a headstone, families always ask about flowers. He could recommend Simply Crafted — and those families become repeat customers. Birthdays, anniversaries, Memorial Day, Veterans Day — that's 4-6 orders per year per family.

Your boutique arrangements are exactly what these families want for someone they love. Would you have 10 minutes this week to chat?

${SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "The business case for memorial flowers",
        body: `Hi there,

Quick thought: memorial flower placements aren't one-time orders. They're recurring. A family might order 4-6 times per year — and they're already pre-sold because Joseph recommended you.

That's a new customer segment that orders regularly, with zero marketing cost on your end.

Would a quick call work?

${SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Final note — Simply Crafted Floral",
        body: `Hi there,

This is my last message. I wanted to leave the door open — when families get a headstone restored, they often want fresh flowers. We'd love to send those customers your way.

If you'd ever like to explore a referral partnership, just reply. Wishing you well!

${SIGNATURE}`
      }
    ]
  },
  // ===== ROOTS NURSERY =====
  {
    lead_query: "Roots Nursery",
    followups: [
      {
        delay_days: 3,
        subject: "I talked to Joseph about Roots Nursery",
        body: `Hi there,

I spoke with Joseph at Legacy Memorial Restorations about Roots Nursery, and he had a thought.

He said: "When I restore a headstone, families often look at the surrounding area and say 'this needs work too.' I can clean the stone, but I can't plant flowers or design a garden. If I could recommend someone for that, it would complete the experience."

That someone could be Roots Nursery. You'd get families who already care enough to invest in their loved one's memorial — and they want professional help making it beautiful.

Would you have 10 minutes this week to chat with Joseph?

${SIGNATURE}`
      },
      {
        delay_days: 7,
        subject: "The complete memorial experience",
        body: `Hi there,

Think about it: a family gets a headstone restored through Joseph. Then they look at the surrounding area — bare ground, weeds, nothing growing. They want to make it beautiful.

That's where Roots Nursery comes in. You'd get families who are already invested in honoring their loved one — and they want professional help.

New customer segment, people who value quality and care. Would a quick call work?

${SIGNATURE}`
      },
      {
        delay_days: 14,
        subject: "Final note — Roots Nursery",
        body: `Hi there,

This is my last message. I wanted to leave the door open — when families get a headstone restored, they often want landscaping. We'd love to send those customers your way.

If you'd ever like to explore a referral partnership, just reply. Wishing you and Roots Nursery all the best!

${SIGNATURE}`
      }
    ]
  }
];

async function main() {
  let totalInserted = 0;

  // First, delete old follow-ups (template_type starts with 'followup_')
  await db.execute("DELETE FROM outreach_emails WHERE template_type LIKE 'followup_%'");
  console.log('Cleared old follow-ups.\n');

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

  // Update initial emails with new signature
  const OLD_SIG = /Ariana\nFounder & CEO, NetClicks by Ari\nnetclicksbyari@gmail\.com/g;
  const NEW_SIG = SIGNATURE;
  const existing = await db.execute("SELECT id, body FROM outreach_emails WHERE template_type IS NULL OR template_type = 'initial'");
  let updated = 0;
  for (const row of existing.rows) {
    const newBody = row.body.replace(OLD_SIG, NEW_SIG);
    if (newBody !== row.body) {
      await db.execute({sql: 'UPDATE outreach_emails SET body = ? WHERE id = ?', args: [newBody, row.id]});
      updated++;
    }
  }

  console.log(`\nDone! Inserted ${totalInserted} follow-ups. Updated ${updated} initial emails.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
