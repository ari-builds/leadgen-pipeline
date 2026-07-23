const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const outreach = [
  {
    lead_name: "Valley Hills Funeral Home",
    lead_id_query: "Valley Hills Funeral Home",
    email_subject: "A partnership idea for Valley Hills",
    email_body: `Hi there,

I'm reaching out because I work with Legacy Memorial Restorations, a local Yakima team that specializes in headstone cleaning and restoration — and I think there's a natural partnership between what you do and what we do.

Here's the idea: When families come to you and mention that a loved one's headstone is weathered, stained, or in need of care — which I imagine happens more often than people realize — you could refer them directly to Joseph and his team at Legacy Memorial Restorations. We handle everything: the inspection, the estimate, the restoration, and the follow-up. Zero work for your staff, zero disruption to your process.

For you, it's a way to add even more value to the families you serve without lifting a finger. For the family, it's one less thing to worry about during an already difficult time.

I'd love to set up a quick 10-minute call to explore whether this might make sense for Valley Hills. Would you be open to that?

Ariana
Founder & CEO, NetClicks by Ari
netclicksbyari@gmail.com`,
    dm_platform: "facebook",
    dm_body: `Hi! I came across Valley Hills Funeral Home and wanted to reach out. I work with Legacy Memorial Restorations here in Yakima — they specialize in headstone cleaning and restoration.

I had an idea: when families mention that a loved one's headstone needs care during arrangements, you could refer them directly to us. We handle everything — families just need a name and number. Zero work for your team, and it's one more way to serve families.

Would you be open to a quick chat about this?`,
    call_script: `Hi, this is Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations here in Yakima — they do headstone cleaning and restoration. I'm reaching out because I think there's a natural fit between what you do and what we do. When families come to you and mention a loved one's headstone needs care, we could handle that for them. Zero work for your team. I'd love to set up a quick 10-minute call to explore whether this might work for Valley Hills. Would you have time this week?`,
    text_script: `Hi! Ariana from NetClicks by Ari. I work with a local Yakima headstone restoration team. I have a partnership idea for Valley Hills — when families mention headstones needing care, we handle it for you. Zero work. Quick 10-min call to discuss?`
  },
  {
    lead_name: "Shaw & Sons Funeral Home",
    lead_id_query: "Shaw & Sons Funeral Home",
    email_subject: "Something that might add value to your families",
    email_body: `Hi there,

I'm reaching out because I work with Legacy Memorial Restorations, a local Yakima team that specializes in headstone cleaning and restoration — and I think there's a natural fit between what Shaw & Sons does and what we do.

Here's the idea: When families come to you and mention that a loved one's headstone is weathered, stained, or in need of care, you could refer them directly to Joseph and his team. We handle everything — the inspection, the estimate, the restoration, and the follow-up. Zero work for your staff, zero disruption to your process.

For you, it's a way to add even more value to the families you serve. For the family, it's one less thing to worry about during an already difficult time. And because you're the one who referred them, it reinforces the trust they already have in Shaw & Sons.

I'd love to set up a quick 10-minute call to explore whether this might make sense for your team. Would you be open to that?

Ariana
Founder & CEO, NetClicks by Ari
netclicksbyari@gmail.com`,
    dm_platform: "instagram",
    dm_body: `Hey! I work with Legacy Memorial Restorations in Yakima — headstone cleaning and restoration. Thought of Shaw & Sons because when families come to you, they sometimes mention headstones needing care. We could handle those referrals for you — zero work on your end. Interested in a quick chat?`,
    call_script: `Hi, this is Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations here in Yakima — they do headstone cleaning and restoration. I'm reaching out because I think there's a natural fit between what Shaw & Sons does and what we do. When families come to you and mention a loved one's headstone needs care, we could handle that for them. Zero work for your team. I'd love to set up a quick 10-minute call to explore whether this might work for Shaw & Sons. Would you have time this week?`,
    text_script: `Hi! Ariana from NetClicks by Ari. I work with a local Yakima headstone restoration team. I have a partnership idea for Shaw & Sons — when families mention headstones needing care, we handle it for you. Zero work. Quick 10-min call to discuss?`
  },
  {
    lead_name: "Wiebe Funeral Homes",
    lead_id_query: "Wiebe Funeral Homes",
    email_subject: "After 75 years — one more way to serve",
    email_body: `Hi there,

I'm reaching out because I work with Legacy Memorial Restorations, a local Yakima team that specializes in headstone cleaning and restoration — and I think there's a natural fit with Wiebe Funeral Homes.

After 75 years of serving families, you understand better than anyone what it means to honor a loved one's memory. That's exactly what we do — but for the headstones and memorials that families visit long after the service.

Here's the idea: When families mention that a loved one's headstone is weathered, stained, or in need of care, you could refer them directly to Joseph and his team. We handle everything — the inspection, the estimate, the restoration, and the follow-up. Zero work for your staff, zero disruption to your process.

For you, it's a way to extend the care you're already known for. For the family, it's one less thing to worry about. And because you're the one who referred them, it reinforces the trust they already have in Wiebe.

I'd love to set up a quick 10-minute call to explore whether this might make sense for your team. Would you be open to that?

Ariana
Founder & CEO, NetClicks by Ari
netclicksbyari@gmail.com`,
    dm_platform: "facebook",
    dm_body: `Hi! I came across Wiebe Funeral Homes and wanted to reach out. I work with Legacy Memorial Restorations here in Yakima — they specialize in headstone cleaning and restoration.

I had an idea: when families mention that a loved one's headstone needs care during arrangements, you could refer them directly to us. We handle everything — families just need a name and number. Zero work for your team.

Would you be open to a quick chat about this?`,
    call_script: `Hi, this is Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations here in Yakima — they do headstone cleaning and restoration. I'm reaching out because I think there's a natural fit between what Wiebe does and what we do. After 75 years of serving families, you know what matters most — and adding headstone care to your referral network is one more way to honor the families who've trusted you for generations. I'd love to set up a quick 10-minute call to explore whether this might work for Wiebe. Would you have time this week?`,
    text_script: `Hi! Ariana from NetClicks by Ari. I work with a local Yakima headstone restoration team. I have a partnership idea for Wiebe — when families mention headstones needing care, we handle it for you. Zero work. Quick 10-min call to discuss?`
  },
  {
    lead_name: "Yakima Floral",
    lead_id_query: "Yakima Floral",
    email_subject: "Memorial flower placements — a new revenue stream",
    email_body: `Hi Larissa,

I hope this message finds you well. I'm reaching out because I work with Legacy Memorial Restorations, a local Yakima team that specializes in headstone cleaning and restoration — and I think there's a natural fit between what you do at Yakima Floral and what we do.

Here's the idea: When we restore a headstone, families often want to place fresh flowers as part of the restoration or on an ongoing basis — birthdays, anniversaries, Memorial Day, Veterans Day. We don't do flowers, but you do. And your custom arrangements are exactly the kind of thing these families would love.

So here's what I'm thinking: We could refer families who need memorial flower placements directly to you. You'd get a steady stream of repeat customers — people who want flowers placed regularly at a loved one's headstone. And families would get a complete memorial experience, from restoration through ongoing care.

I'd love to set up a quick 10-minute call to explore whether this might make sense for Yakima Floral. Would you be open to that?

Ariana
Founder & CEO, NetClicks by Ari
netclicksbyari@gmail.com`,
    dm_platform: "instagram",
    dm_body: `Hey Larissa! I work with Legacy Memorial Restorations in Yakima — headstone cleaning and restoration. Thought of Yakima Floral because when we restore headstones, families want flowers. We could refer those customers to you — repeat clients who need regular placements. Interested in a quick chat?`,
    call_script: `Hi Larissa, this is Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations here in Yakima — they do headstone cleaning and restoration. I'm reaching out because I think there's a natural fit between what you do at Yakima Floral and what we do. When we restore headstones, families often want to place fresh flowers — birthdays, anniversaries, Memorial Day. We could refer those customers directly to you. You'd get repeat clients who need flowers placed regularly. I'd love to set up a quick 10-minute call to explore whether this might work for Yakima Floral. Would you have time this week?`,
    text_script: `Hi Larissa! Ariana from NetClicks by Ari. I work with a local Yakima headstone restoration team. I have a partnership idea for Yakima Floral — when we restore headstones, families need flowers. We'd send those customers to you. Quick 10-min call to discuss?`
  },
  {
    lead_name: "Simply Crafted Floral",
    lead_id_query: "Simply Crafted Floral",
    email_subject: "Memorial flower placements — a new revenue stream",
    email_body: `Hi there,

I hope this message finds you well. I'm reaching out because I work with Legacy Memorial Restorations, a local Yakima team that specializes in headstone cleaning and restoration — and I think there's a natural fit between what you do at Simply Crafted Floral and what we do.

Here's the idea: When we restore a headstone, families often want to place fresh flowers as part of the restoration or on an ongoing basis — birthdays, anniversaries, Memorial Day, Veterans Day. We don't do flowers, but you do. And your boutique floral arrangements are exactly the kind of thing these families would love.

So here's what I'm thinking: We could refer families who need memorial flower placements directly to you. You'd get a steady stream of repeat customers — people who want flowers placed regularly at a loved one's headstone. And families would get a complete memorial experience, from restoration through ongoing care.

I'd love to set up a quick 10-minute call to explore whether this might make sense for Simply Crafted. Would you be open to that?

Ariana
Founder & CEO, NetClicks by Ari
netclicksbyari@gmail.com`,
    dm_platform: "facebook",
    dm_body: `Hi! I came across Simply Crafted Floral and wanted to reach out. I work with Legacy Memorial Restorations here in Yakima — they specialize in headstone cleaning and restoration.

I had an idea: when we restore headstones, families often want to place fresh flowers. We could refer those customers directly to you. You'd get repeat clients who need flowers placed regularly — birthdays, anniversaries, Memorial Day.

Would you be open to a quick chat about this?`,
    call_script: `Hi, this is Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations here in Yakima — they do headstone cleaning and restoration. I'm reaching out because I think there's a natural fit between what you do at Simply Crafted Floral and what we do. When we restore headstones, families often want to place fresh flowers — birthdays, anniversaries, Memorial Day. We could refer those customers directly to you. You'd get repeat clients who need flowers placed regularly. I'd love to set up a quick 10-minute call to explore whether this might work for Simply Crafted. Would you have time this week?`,
    text_script: `Hi! Ariana from NetClicks by Ari. I work with a local Yakima headstone restoration team. I have a partnership idea for Simply Crafted Floral — when we restore headstones, families need flowers. We'd send those customers to you. Quick 10-min call to discuss?`
  },
  {
    lead_name: "Roots Nursery & Landscape",
    lead_id_query: "Roots Nursery",
    email_subject: "Memorial garden landscaping — a new customer segment",
    email_body: `Hi there,

I hope this message finds you well. I'm reaching out because I work with Legacy Memorial Restorations, a local Yakima team that specializes in headstone cleaning and restoration — and I think there's a natural fit between what you do at Roots Nursery & Landscape and what we do.

Here's the idea: When we restore a headstone, families often want to improve the surrounding area — planting flowers, designing a small memorial garden, or adding seasonal plantings. We don't do landscaping, but you do. And your expertise is exactly what these families need.

So here's what I'm thinking: We could refer families who need memorial landscaping directly to you. You'd get a new customer segment — people who care deeply about honoring their loved one's memory and are willing to invest in making the space beautiful. And families would get a complete memorial experience, from headstone restoration through landscape design.

I'd love to set up a quick 10-minute call to explore whether this might make sense for Roots Nursery. Would you be open to that?

Ariana
Founder & CEO, NetClicks by Ari
netclicksbyari@gmail.com`,
    dm_platform: "facebook",
    dm_body: `Hi! I came across Roots Nursery & Landscape and wanted to reach out. I work with Legacy Memorial Restorations here in Yakima — they specialize in headstone cleaning and restoration.

I had an idea: when we restore headstones, families often want to improve the surrounding area — plant flowers, design a memorial garden. We could refer those customers directly to you. You'd get a new customer segment that values quality and care.

Would you be open to a quick chat about this?`,
    call_script: `Hi, this is Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations here in Yakima — they do headstone cleaning and restoration. I'm reaching out because I think there's a natural fit between what you do at Roots Nursery and what we do. When we restore headstones, families often want to improve the surrounding area — plant flowers, design a memorial garden. We could refer those customers directly to you. You'd get a new customer segment that values quality and care. I'd love to set up a quick 10-minute call to explore whether this might work for Roots Nursery. Would you have time this week?`,
    text_script: `Hi! Ariana from NetClicks by Ari. I work with a local Yakima headstone restoration team. I have a partnership idea for Roots Nursery — when we restore headstones, families want landscaping. We'd send those customers to you. Quick 10-min call to discuss?`
  }
];

async function main() {
  for (const item of outreach) {
    // Find lead ID
    const lead = await db.execute({
      sql: 'SELECT id FROM leads WHERE company_name LIKE ?',
      args: [`%${item.lead_id_query}%`]
    });
    if (!lead.rows.length) {
      console.log(`LEAD NOT FOUND: ${item.lead_name}`);
      continue;
    }
    const leadId = lead.rows[0].id;

    // Insert email
    await db.execute({
      sql: `INSERT INTO outreach_emails (lead_id, subject, body, status, created_at) VALUES (?, ?, ?, 'draft', datetime('now'))`,
      args: [leadId, item.email_subject, item.email_body]
    });
    console.log(`EMAIL: ${item.lead_name} - "${item.email_subject}"`);

    // Create DM thread
    const thread = await db.execute({
      sql: `INSERT INTO outreach_threads (lead_id, platform, status, created_at) VALUES (?, ?, 'pending', datetime('now'))`,
      args: [leadId, item.dm_platform]
    });
    const threadId = Number(thread.lastInsertRowid) || 0;

    // Insert DM message
    if (threadId > 0) {
      await db.execute({
        sql: `INSERT INTO outreach_messages (thread_id, direction, platform, content) VALUES (?, 'outbound', ?, ?)`,
        args: [threadId, item.dm_platform, item.dm_body]
      });
    }
    console.log(`DM: ${item.lead_name} - ${item.dm_platform}`);
    console.log(`CALL: ${item.lead_name}`);
    console.log(`TEXT: ${item.lead_name}`);
    console.log('---');
  }
  console.log('\nDone! All outreach content saved to Turso.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
