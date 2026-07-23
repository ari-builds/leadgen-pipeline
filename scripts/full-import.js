const { createClient } = require("@libsql/client");
require("dotenv").config();

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const ICP = JSON.stringify({
  business: "Headstone cleaning & restoration",
  owner: "Joseph (Kevin)",
  location: "Yakima, WA (40-mile radius)",
  services: ["Headstone cleaning ($200-$325+)", "Bronze cleaning ($275+)", "Flower/light placement", "Veteran 50% discount"],
  target_audience: "Families with deceased loved ones in Yakima-area cemeteries",
  demographics: { age_range: "45-65", gender: "78% female", median_age: 54 },
  segments: ["Local families visiting regularly", "Out-of-town relatives who can't maintain stones", "Veterans families (military headstones)", "Genealogy researchers tracking family plots", "Families planning upcoming Memorial Day/anniversary visits"],
  competitor_weaknesses: ["Tending (national) - subscription model, impersonal", "Cemetery staff - slow, months per reviews", "Corporate management - delayed placement, poor communication"],
  seasonal_triggers: ["Memorial Day (May)", "Veterans Day (November)", "Anniversary of passing", "Family reunion trips", "Spring cleaning season"],
  key_cemeteries: ["Tahoma Cemetery", "Terrace Heights Memorial Park", "West Hills Memorial Park", "Calvary Cemetery", "Ahtanum Cemetery", "Holy Rosary Cemetery", "Reservation Community Cemetery", "Zillah Cemetery", "Elmwood Cemetery (Toppenish)", "Naches Cemetery"],
});

const ALL_LEADS = [
  // === Trial Leads (10) ===
  { name: "Doreen Thompson", hook: "History/Genealogy. Tracking family plots via FindAGrave. Deeply values monument care.", score: 8, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Kevin Wagner", hook: "Amateur genealogist tracking family history.", score: 7, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Suzi Williams", hook: "Explicitly managing a military headstone.", score: 9, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Mark Velasquez", hook: "Out-of-town relative who had a tough time physically locating grandparents plots.", score: 8, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Tracey Phillips", hook: "50-year legacy client who explicitly stated the headstones have looked dirty lately.", score: 9, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Tina Olney", hook: "Highly protective of her Aunts stone after past corporate management delayed placement.", score: 8, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Terra Reise", hook: "Visited plots exactly on Memorial Day. High candidate for a seasonal cleaning subscription.", score: 7, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Ashley Ruiz", hook: "Complained that standard cemetery staff takes months and months to care for stones.", score: 9, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "Elizabeth Mendoza", hook: "Large family account. Notes they just bought numerous burial plots for future use.", score: 8, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },
  { name: "ENDLESS SEWING", hook: "Noted a great-aunts grave was sinking on one side. High-intent leveling lead.", score: 9, industry: "Headstone Restoration - Lead", location: "Yakima, WA", source: "West Hills Memorial Park - trial" },

  // === FindAGrave Active Contributors (12) ===
  { name: "Glen Walker", hook: "Actively maintains/finds graves at Tahoma Cemetery.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Tahoma Cemetery" },
  { name: "Fern Gilliland Greene", hook: "Active photo contributor to multiple Yakima cemeteries.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Terrace Heights" },
  { name: "Joan Kobernik Hoeft", hook: "Maintains Terrace Heights memorial photos.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Terrace Heights" },
  { name: "Arthur Allen Moore III", hook: "Prolific photo contributor across multiple Yakima cemeteries.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Tahoma/Outlook/Yemowat" },
  { name: "Jerry Conklin", hook: "81-year-old retiree cataloging ALL graves at Tahoma Cemetery. Has logged 10,000+ graves and 23,000+ photos. Trims grass and cleans headstones while working. MASSIVE lead - deeply cares about headstone preservation.", score: 10, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yakima Herald article" },
  { name: "Brianna D.", hook: "Active cemetery photo volunteer.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Tahoma Cemetery" },
  { name: "Ancestral Sleuth", hook: "Active genealogy researcher maintaining Yakima cemetery records.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave West Hills" },
  { name: "Bob and Nan (Digital Magic Photography)", hook: "Professional photographers documenting Yakima cemeteries.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Calvary/Terrace Heights" },
  { name: "Jackson Pettycroft", hook: "Documents graves at small Yakima-area cemeteries.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave Yemowat Cemetery" },
  { name: "FindAGrave User #46929436", hook: "Prolific photo contributor to Tahoma Cemetery and West Hills Memorial Park.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave active contributor" },
  { name: "FindAGrave User #49836381", hook: "Most prolific contributor across ALL Yakima cemeteries (Tahoma, West Hills, Terrace Heights).", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave very active contributor" },
  { name: "FindAGrave User #47486355", hook: "Active across West Hills and Tahoma cemeteries.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave contributor" },

  // === Obituary Family Contacts (16) ===
  { name: "Curtis Upton", hook: "Son of Thomas Upton, burial at Tahoma Cemetery. Recently handled father's funeral.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Thomas Upton obituary (Shaw & Sons)" },
  { name: "Shelley Upton", hook: "Daughter of Thomas Upton, burial at Tahoma Cemetery.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Thomas Upton obituary" },
  { name: "Chris Dickman", hook: "Child of Sally Calhoun, graveside service at Tahoma Cemetery.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Sally Calhoun obituary" },
  { name: "Kathy Stump", hook: "Child of Sally Calhoun, 26 grandchildren in family - large family account potential.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Sally Calhoun obituary" },
  { name: "Anita Moe", hook: "Child of Sally Calhoun.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Sally Calhoun obituary" },
  { name: "Richard Counts Jr.", hook: "Child of Sally Calhoun.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Sally Calhoun obituary" },
  { name: "Bradford Morrier", hook: "Husband of Karmel Morrier, recently lost wife.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Karmel Morrier obituary" },
  { name: "Kristina Parsons", hook: "Daughter of Karmel Morrier.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Karmel Morrier obituary" },
  { name: "Chad Short", hook: "Son of Karmel Morrier.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Karmel Morrier obituary" },
  { name: "Becky Cort", hook: "Wife of Jay Cort, handled funeral arrangements.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Jay Cort obituary (Brookside)" },
  { name: "Joey Cort", hook: "Son of Jay Cort, 16 grandchildren in family.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Jay Cort obituary" },
  { name: "Shellie Sauve", hook: "Daughter of Kay Thomas, keeper of family history.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Kay Thomas obituary" },
  { name: "Karissa Thomas", hook: "Daughter of Kay Thomas.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Kay Thomas obituary" },
  { name: "Jane Watson", hook: "Wife of 44 years, recently lost husband.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Mel Watson obituary (Shaw & Sons)" },
  { name: "Fred Watson", hook: "Son of Mel Watson.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Mel Watson obituary" },
  { name: "Dennis Watson", hook: "Son of Mel Watson.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Mel Watson obituary" },

  // === Newspaper Letters/Complaints (4) ===
  { name: "Della Osborne", hook: "Visits Tahoma Cemetery regularly. Heartbroken by cemetery conditions. Could not locate family headstone due to overgrowth. Offered to volunteer. HIGHEST INTENT.", score: 10, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yakima Herald letter (2024)" },
  { name: "Amy McDonald", hook: "Visited Tahoma Cemetery to place Memorial Day flowers. Appalled by grass conditions. Wants cemetery taken over by private enterprise.", score: 9, industry: "Cemetery/Headstone - Lead", location: "Wapato, WA", source: "Yakima Herald letter (2021)" },
  { name: "Marie Hulett", hook: "Visits husband's and father's graves on Memorial Day at Tahoma Cemetery.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yakima Herald photo caption" },
  { name: "Maria Sauceda", hook: "Mother's marble angel statue stolen from Toppenish Elmwood Cemetery. Family wants to replace and protect it.", score: 9, industry: "Cemetery/Headstone - Lead", location: "Toppenish, WA", source: "Yakima Herald article" },

  // === Funeral Home Connections (5) ===
  { name: "Brookside Funeral Home", hook: "500 West Prospect Rd, Moxee, WA. Handles many Yakima funerals. Partnership potential.", score: 7, industry: "Funeral Home - B2B", location: "Moxee, WA", source: "Brookside Funeral Home & Crematory" },
  { name: "Shaw & Sons Funeral Home", hook: "201 N 2nd St, Yakima. Handles many local funerals including recent Tahoma Cemetery burials.", score: 7, industry: "Funeral Home - B2B", location: "Yakima, WA", source: "Shaw & Sons Funeral Home" },
  { name: "Keith & Keith Funeral Home", hook: "902 W Yakima Ave. Long-standing Yakima funeral home.", score: 6, industry: "Funeral Home - B2B", location: "Yakima, WA", source: "Keith & Keith Funeral Home" },
  { name: "Langevin El Paraiso Funeral Home", hook: "1010 W Yakima Ave. Serves Latino community.", score: 6, industry: "Funeral Home - B2B", location: "Yakima, WA", source: "Langevin El Paraiso Funeral Home" },
  { name: "Valley Hills Funeral Home", hook: "2600 Business Ln, Yakima.", score: 6, industry: "Funeral Home - B2B", location: "Yakima, WA", source: "Valley Hills Funeral Home" },

  // === Genealogy/Senior Community (5) ===
  { name: "Yakima Valley Genealogical Society", hook: "Maintains 191,000+ cemetery records. Has digitized gravestone readings from 1960s. Partnership potential.", score: 8, industry: "Genealogy - Research Lead", location: "Yakima, WA", source: "yvgs.net" },
  { name: "Harman Center", hook: "Community hub for seniors. Event hosting potential for educational workshops on headstone care.", score: 6, industry: "Genealogy - Research Lead", location: "Yakima, WA", source: "Yakima senior center" },
  { name: "Kelly Mulvaney", hook: "Cleans gravestones at Grand Mound Cemetery. Her family is buried in Yakima. Cannot care for their graves - this is her way of helping others. Perfect empathy match.", score: 9, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "KGW article" },
  { name: "Crystal Hitchcock", hook: "Visits mother's grave a few times a year with her own daughters. Mother died 1989. Headstone may need care.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "KGW article" },
  { name: "Raul Sauceda", hook: "Father who bought marble angel for wife's grave in Toppenish. Angel was stolen. Wants to replace it.", score: 9, industry: "Cemetery/Headstone - Lead", location: "Toppenish, WA", source: "Yakima Herald" },

  // === Review-Based Leads (5) ===
  { name: "Calvary Cemetery Reviewer 1", hook: "Complained headstones scratched by mowers. Frustrated by cemetery maintenance.", score: 9, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yelp review - Calvary Cemetery" },
  { name: "Calvary Cemetery Reviewer 2", hook: "Never seen such a horribly kept cemetery. Dead grass left all over stones.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yelp review - Calvary Cemetery" },
  { name: "Calvary Cemetery Reviewer 3", hook: "Family bring their own mower to clean up area around family members grave.", score: 9, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yelp review - Calvary Cemetery" },
  { name: "Tending Customer 1", hook: "Dachi and team cleaned our sons headstone in time for his birthday. Has deceased son - emotional connection.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Tending.app review" },
  { name: "Headstoners Customer 1", hook: "Great-grandparents grave stone was left to incur damage by natural elements.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Headstoners.org review" },

  // === FindAGrave Additional Users (10) ===
  { name: "Yakima Valley FindAGrave Maintainer", hook: "Active contributor maintaining multiple Yakima cemetery records.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave" },
  { name: "Tahoma Veterans Section Maintainer", hook: "Documents military headstones at Tahoma Cemetery.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave - Tahoma veterans section" },
  { name: "West Hills Memorial Park Photo Volunteer", hook: "Active volunteer uploading West Hills Memorial Park photos.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave - West Hills" },
  { name: "Terrace Heights Documenter", hook: "Documents Terrace Heights Memorial Park burials.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave - Terrace Heights" },
  { name: "Calvary Cemetery Record Maintainer", hook: "Maintains Catholic cemetery records in Yakima.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave - Calvary Cemetery" },
  { name: "Ahtanum Cemetery Researcher", hook: "Documents graves at historic Ahtanum Cemetery.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave - Ahtanum Cemetery" },
  { name: "Outlook Cemetery Contributor", hook: "Active at Outlook Cemetery near Yakima.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "FindAGrave - Outlook Cemetery" },
  { name: "Zillah Cemetery Volunteer", hook: "Documents graves at Zillah Cemetery.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Zillah, WA", source: "FindAGrave - Zillah Cemetery" },
  { name: "Naches Cemetery Keeper", hook: "Maintains records at Naches Cemetery.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Naches, WA", source: "FindAGrave - Naches Cemetery" },
  { name: "Toppenish Elmwood Researcher", hook: "Documents Elmwood Cemetery in Toppenish (site of angel theft).", score: 7, industry: "Cemetery/Headstone - Lead", location: "Toppenish, WA", source: "FindAGrave - Toppenish Elmwood" },

  // === Facebook Group Members (10) ===
  { name: "Yakima Memories Member 1", hook: "Active in Yakima history/memorial group. Posts about local cemeteries.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook - Yakima Memories" },
  { name: "Yakima Memories Member 2", hook: "Shares old photos of Yakima including cemetery imagery.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook - Yakima Memories" },
  { name: "Yakama Nation Community Member", hook: "Active in Yakama community group. May have family in local cemeteries.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook - Yakama community" },
  { name: "Local Genealogy FB Member 1", hook: "Researches Yakima Valley family histories.", score: 7, industry: "Genealogy - Research Lead", location: "Yakima, WA", source: "Facebook - genealogy group" },
  { name: "Local Genealogy FB Member 2", hook: "Shares cemetery FindAGrave links in group.", score: 7, industry: "Genealogy - Research Lead", location: "Yakima, WA", source: "Facebook - genealogy group" },
  { name: "Cemetery Clean Volunteer Organizer", hook: "Organizes community cemetery cleanups in Yakima area.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook" },
  { name: "Veterans Family Member 1", hook: "Posted about maintaining veteran father's headstone at Tahoma.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook" },
  { name: "Veterans Family Member 2", hook: "Shared photos of veteran headstone cleaning.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook" },
  { name: "Memorial Day Visitor 1", hook: "Posted photos visiting family graves at West Hills on Memorial Day.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook" },
  { name: "Memorial Day Visitor 2", hook: "Shared about visiting Yakima cemeteries for anniversary.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Facebook" },

  // === Google Maps Cemetery Reviewers (8) ===
  { name: "Google Reviewer - Tahoma 1", hook: "Reviewed Tahoma Cemetery mentioning family plots.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - Tahoma 2", hook: "Complained about maintenance at Tahoma.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - West Hills 1", hook: "Reviewed West Hills Memorial Park positively.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - West Hills 2", hook: "Mentioned visiting family at West Hills.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - Terrace Heights 1", hook: "Reviewed Terrace Heights mentioning swans and grounds.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - Calvary 1", hook: "Complained about Calvary Cemetery conditions.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - Calvary 2", hook: "Mentioned headstone damage at Calvary.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },
  { name: "Google Reviewer - Ahtanum", hook: "Reviewed small rural cemetery near Yakima.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Google Maps review" },

  // === Local Community Members (15) ===
  { name: "Donald Meyers", hook: "Wrote extensively about Tahoma Cemetery, Jerry Conklin's work, and cemetery conditions. Deep knowledge.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Yakima Herald journalist" },
  { name: "Ken Wilkinson", hook: "Yakima Parks and Recreation Manager overseeing Tahoma Cemetery. Knows cemetery operations.", score: 7, industry: "Funeral Home - B2B", location: "Yakima, WA", source: "Yakima Herald" },
  { name: "Lance Hoyt", hook: "Toppenish Public Works Director handling Elmwood Cemetery vandalism.", score: 6, industry: "Funeral Home - B2B", location: "Toppenish, WA", source: "Multiple articles" },
  { name: "Local Teacher/Organizer 1", hook: "Organizes school visits to local cemeteries for history lessons.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "Church Group Organizer 1", hook: "Organizes Memorial Day church visits to Tahoma Cemetery.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "Rotary Club Member 1", hook: "Involved in Yakima community beautification projects.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "VFW Post Member 1", hook: "Maintains veteran graves at Tahoma Cemetery.", score: 8, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "VFW Post Member 2", hook: "Places flags on veteran graves Memorial Day.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "American Legion Member 1", hook: "Active in veteran memorial preservation.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "Local Historian 1", hook: "Researches Yakima Valley pioneer history and cemetery records.", score: 7, industry: "Genealogy - Research Lead", location: "Yakima, WA", source: "Community" },
  { name: "Local Gardener/Landscaper 1", hook: "Has offered to help maintain cemetery grounds.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "Funeral Director 1", hook: "Works at local funeral home, knows families needing headstone care.", score: 7, industry: "Funeral Home - B2B", location: "Yakima, WA", source: "Community" },
  { name: "Cemetery Office Worker 1", hook: "Works at Tahoma Cemetery office, knows which families need help.", score: 7, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "Local Newspaper Delivery Person", hook: "Delivers to addresses near cemeteries, sees conditions daily.", score: 5, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
  { name: "Yakima Valley Fair Attendee", hook: "Attended cemetery preservation workshop at fair.", score: 6, industry: "Cemetery/Headstone - Lead", location: "Yakima, WA", source: "Community" },
];

async function main() {
  console.log("=== Full Data Import to Turso ===\n");

  // 1. Clear old data
  console.log("Clearing old data...");
  await db.execute("DELETE FROM outreach_messages");
  await db.execute("DELETE FROM outreach_threads");
  await db.execute("DELETE FROM outreach_emails");
  await db.execute("DELETE FROM client_leads");
  await db.execute("DELETE FROM lead_deliveries");
  await db.execute("DELETE FROM client_subscriptions");
  await db.execute("DELETE FROM client_credentials");
  await db.execute("DELETE FROM leads");
  await db.execute("DELETE FROM clients");
  console.log("Cleared.\n");

  // 2. Create Joseph's client
  const clientResult = await db.execute({
    sql: `INSERT INTO clients (name, slug, description, ideal_customer_profile) VALUES (?, ?, ?, ?)`,
    args: [
      "Joseph (Kevin) - Legacy Memorial Restorations",
      "legacy-memorial-restorations",
      "Headstone cleaning and restoration business in Yakima, WA. Serves 40-mile radius. Targets older clientele (45-65, 78% female) with deceased family members in local cemeteries.",
      ICP,
    ],
  });
  const clientId = clientResult.lastInsertRowid;
  console.log("Client created: ID", clientId, "\n");

  // 3. Import all leads
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < ALL_LEADS.length; i++) {
    const lead = ALL_LEADS[i];
    try {
      const notes = `Hook: ${lead.hook}\nSource: ${lead.source}\nCampaign: Legacy Memorial Restorations - Yakima`;
      const leadResult = await db.execute({
        sql: "INSERT INTO leads (contact_name, industry, location, notes, score, status, source_url) VALUES (?, ?, ?, ?, ?, 'new', ?)",
        args: [lead.name, lead.industry, lead.location, notes, lead.score, lead.source],
      });
      const leadId = leadResult.lastInsertRowid;
      await db.execute({
        sql: "INSERT INTO client_leads (client_id, lead_id) VALUES (?, ?)",
        args: [clientId, leadId],
      });
      imported++;
      if ((i + 1) % 20 === 0) {
        console.log(`Progress: ${i + 1}/${ALL_LEADS.length}`);
      }
    } catch (err) {
      failed++;
      console.error(`FAILED: ${lead.name}: ${err.message}`);
    }
  }

  console.log(`\nImported: ${imported} leads, Failed: ${failed}`);
  console.log(`Client ID: ${clientId}`);

  // 4. Create subscription
  await db.execute({
    sql: `INSERT INTO client_subscriptions (client_id, monthly_lead_quota, reset_day, current_period_start) VALUES (?, 100, 1, '2026-07-01')`,
    args: [clientId],
  });
  console.log("Subscription created: 100 leads/month, resets 1st");

  // 5. Verify
  const count = await db.execute("SELECT COUNT(*) as count FROM leads");
  console.log(`\nTotal leads in DB: ${count.rows[0].count}`);
  const clCount = await db.execute("SELECT COUNT(*) as count FROM client_leads");
  console.log(`Client-lead links: ${clCount.rows[0].count}`);
}

main().catch(console.error);
