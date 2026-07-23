const { createClient } = require("@libsql/client");

const db = createClient({
  url: "libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ3NjcyNzksImlkIjoiMDE5ZjhiYjEtZTEwMS03YjFjLThjMGMtODRjZGI4ZWQ5MGQ4Iiwia2lkIjoidm9nSHl3cVBCY1J6d1NPVlJDWWhTZkFpN25VSGlNM0FlV0tONktsY0hoSSIsInJpZCI6IjNmNDlkMGViLTc3OWQtNGZmMy04YzQ2LTg5YWE4MTAwOGFjMSJ9.vmSmog-sLzR5_PTblNB7luC5ryTjm-c-XYdgwFmFoCDv1UEc9CS65E1NGY4qsBBy3vPXsEGiFW4HhUdBixEUCQ",
});

async function main() {
  const icp = JSON.stringify({
    business: "Headstone cleaning & restoration",
    owner: "Joseph (Kevin)",
    location: "Yakima, WA (100-mile radius)",
    services: ["Headstone cleaning ($200-$325+)", "Bronze cleaning ($275+)", "Flower/light placement", "Veteran 50% discount"],
    target_audience: "Families with deceased loved ones in Yakima-area cemeteries",
    demographics: { age_range: "45-65", gender: "78% female", median_age: 54 },
    segments: ["Local families visiting regularly", "Out-of-town relatives who cant maintain stones", "Veterans families (military headstones)", "Genealogy researchers tracking family plots", "Families planning upcoming Memorial Day/anniversary visits"],
    competitor_weaknesses: ["Tending (national) - subscription model, impersonal", "Cemetery staff - slow, months and months per reviews", "Corporate management - delayed placement, poor communication"],
    seasonal_triggers: ["Memorial Day (May)", "Veterans Day (November)", "Anniversary of passing", "Family reunion trips", "Spring cleaning season"],
  });

  const clientResult = await db.execute({
    sql: "INSERT INTO clients (name, slug, description, ideal_customer_profile) VALUES (?, ?, ?, ?)",
    args: [
      "Joseph (Kevin) - Legacy Memorial Restorations",
      "legacy-memorial-restorations",
      "Headstone cleaning and restoration business in Yakima, WA. Serves 40-mile radius. Targets older clientele (45-65, 78% female) with deceased family members in local cemeteries.",
      icp,
    ],
  });

  const clientId = clientResult.lastInsertRowid;
  console.log("Client created with ID:", clientId);

  const leads = [
    { name: "Doreen Thompson", hook: "History/Genealogy. Tracking family plots via FindAGrave. Deeply values monument care.", score: 8 },
    { name: "Kevin Wagner", hook: "Amateur genealogist tracking family history.", score: 7 },
    { name: "Suzi Williams", hook: "Explicitly managing a military headstone.", score: 9 },
    { name: "Mark Velasquez", hook: "Out-of-town relative who had a tough time physically locating grandparents plots.", score: 8 },
    { name: "Tracey Phillips", hook: "50-year legacy client who explicitly stated the headstones have looked dirty lately.", score: 9 },
    { name: "Tina Olney", hook: "Highly protective of her Aunts stone after past corporate management delayed placement.", score: 8 },
    { name: "Terra Reise", hook: "Visited plots exactly on Memorial Day. High candidate for a seasonal cleaning subscription.", score: 7 },
    { name: "Ashley Ruiz", hook: "Complained that standard cemetery staff takes months and months to care for stones.", score: 9 },
    { name: "Elizabeth Mendoza", hook: "Large family account. Notes they just bought numerous burial plots for future use.", score: 8 },
    { name: "ENDLESS SEWING", hook: "Noted a great-aunts grave was sinking on one side. High-intent leveling lead.", score: 9 },
  ];

  for (const lead of leads) {
    const leadResult = await db.execute({
      sql: "INSERT INTO leads (contact_name, industry, location, notes, score, status, source_url) VALUES (?, ?, ?, ?, ?, 'new', ?)",
      args: [lead.name, "Headstone Restoration - Lead", "Yakima, WA", "Hook: " + lead.hook + "\nSource: West Hills Memorial Park\nCampaign: Trial", lead.score, "west-hills-memorial-park"],
    });
    const leadId = leadResult.lastInsertRowid;
    await db.execute({ sql: "INSERT INTO client_leads (client_id, lead_id) VALUES (?, ?)", args: [clientId, leadId] });
    console.log("Imported: " + lead.name + " (ID: " + leadId + ")");
  }

  console.log("Done! Client ID: " + clientId + " - 10 leads imported.");
}

main().catch(console.error);
