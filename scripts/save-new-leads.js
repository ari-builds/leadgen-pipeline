const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const leads = [
  {
    company_name: "Valley Hills Funeral Home",
    website: "https://www.valleyhillsfh.com/",
    description: "Funeral home serving Yakima, WA area. Offers obituaries, condolences, and flower arrangements for memorial services.",
    industry: "Funeral Services",
    location: "Yakima, WA",
    score: 8,
    notes: "Funeral home within 30-mile radius. Partnership opportunity - referral program for headstone restoration services. Contact via phone or Facebook.",
    contact_phone: "(509) 877-4455",
    contact_email: "",
    contact_facebook: "https://facebook.com/p/Valley-Hills-Funeral-Home-100064028315863/",
    contact_instagram: "",
    contact_linkedin: "",
    contact_twitter: ""
  },
  {
    company_name: "Shaw & Sons Funeral Home",
    website: "https://www.shawandsons.com/",
    description: "Compassionate funeral and cremation services in Yakima, WA. Personalized support during times of need.",
    industry: "Funeral Services",
    location: "Yakima, WA",
    score: 9,
    notes: "Funeral home within 30-mile radius. Strong referral partnership opportunity. Active on Instagram (mohlerfamilyestablishments). Phone: (509) 453-0331.",
    contact_phone: "(509) 453-0331",
    contact_email: "",
    contact_facebook: "https://www.facebook.com/ShawandSonsFuneralHome/photos_by",
    contact_instagram: "https://www.instagram.com/mohlerfamilyestablishments/",
    contact_linkedin: "",
    contact_twitter: ""
  },
  {
    company_name: "Wiebe Funeral Homes",
    website: "https://www.wiebefuneralhomes.com/",
    description: "75 years of compassionate funeral care. Subscribe for notifications and send sympathy flowers.",
    industry: "Funeral Services",
    location: "Yakima area, WA",
    score: 7,
    notes: "Funeral home within 30-mile radius. 75 years in business. Partnership opportunity. Facebook active.",
    contact_phone: "",
    contact_email: "",
    contact_facebook: "https://www.facebook.com/2008/fbml",
    contact_instagram: "",
    contact_linkedin: "",
    contact_twitter: ""
  },
  {
    company_name: "Yakima Floral",
    website: "https://www.yakimafloral.com/",
    description: "Boutique floral shop owned by Larissa Manning. Custom designs, unique arrangements for every purchase. Delivery available.",
    industry: "Floral / Wedding",
    location: "Yakima, WA",
    score: 9,
    notes: "Floral shop within 30-mile radius. Partnership opportunity - referral program for memorial headstone flowers. Owner: Larissa Manning. Email: larissa@yakimafloral.com. Phone: (509) 840-4266.",
    contact_phone: "(509) 840-4266",
    contact_email: "larissa@yakimafloral.com",
    contact_facebook: "",
    contact_instagram: "https://www.instagram.com/yakimafloral/",
    contact_linkedin: "",
    contact_twitter: ""
  },
  {
    company_name: "Simply Crafted Floral",
    website: "https://www.simplycraftedfloral.com/",
    description: "Boutique retail gift shop in Yakima, WA. Sells clothing, candles, wine, floral delivery, events, and weddings.",
    industry: "Floral / Wedding",
    location: "Yakima, WA",
    score: 7,
    notes: "Floral shop within 30-mile radius. Partnership opportunity for memorial flower referrals. No direct contact info found - visit website or social media.",
    contact_phone: "",
    contact_email: "",
    contact_facebook: "",
    contact_instagram: "",
    contact_linkedin: "",
    contact_twitter: ""
  },
  {
    company_name: "Roots Nursery & Landscape",
    website: "https://www.rootsyakima.com/",
    description: "Nursery and landscape services in Yakima, WA. Contact for plants, garden supplies, and landscaping.",
    industry: "Landscaping / Nursery",
    location: "Yakima, WA",
    score: 6,
    notes: "Nursery/landscaping within 30-mile radius. Potential partnership for memorial garden referrals. Phone: (509) 966-0698.",
    contact_phone: "(509) 966-0698",
    contact_email: "",
    contact_facebook: "http://www.facebook.com/rootsnurseryyakima/",
    contact_instagram: "",
    contact_linkedin: "",
    contact_twitter: "http://www.twitter.com/Roots_Yakima"
  }
];

async function main() {
  let inserted = 0;
  let skipped = 0;
  
  for (const lead of leads) {
    try {
      const existing = await db.execute({
        sql: 'SELECT id FROM leads WHERE website_url = ?',
        args: [lead.website]
      });
      
      if (existing.rows.length > 0) {
        console.log(`SKIP (exists): ${lead.company_name}`);
        skipped++;
        continue;
      }
      
      const result = await db.execute({
        sql: `INSERT INTO leads (company_name, website_url, what_they_sell, industry, location, score, notes, contact_phone, contact_email, contact_facebook, contact_instagram, contact_linkedin, contact_twitter, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))`,
        args: [
          lead.company_name, lead.website, lead.description, lead.industry,
          lead.location, lead.score, lead.notes,
          lead.contact_phone, lead.contact_email, lead.contact_facebook,
          lead.contact_instagram, lead.contact_linkedin, lead.contact_twitter
        ]
      });
      
      await db.execute({
        sql: 'INSERT INTO client_leads (client_id, lead_id, assigned_at) VALUES (1, ?, datetime(\'now\'))',
        args: [Number(result.lastInsertRowid)]
      });
      
      console.log(`INSERTED: ${lead.company_name} (score ${lead.score})`);
      inserted++;
    } catch (e) {
      console.error(`ERROR on ${lead.company_name}: ${e.message}`);
    }
  }
  
  // Count total leads
  const count = await db.execute('SELECT COUNT(*) as c FROM leads WHERE client_id = 1');
  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}, Total leads: ${count.rows[0].c}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
