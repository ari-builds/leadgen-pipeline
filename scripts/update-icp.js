const {createClient} = require('@libsql/client');
const db = createClient({
  url: 'libsql://leadgen-pipeline-ari-builds.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_TOKEN
});

const icp = JSON.stringify({
  business: "Headstone cleaning & restoration",
  owner: "Joseph (Kevin)",
  location: "Yakima, WA (30-mile radius)",
  radius: "30 miles from Yakima",
  neighboring_areas: [
    "Selah (5 mi)", "Union Gap (5 mi)", "Terrace Heights (5 mi)",
    "West Valley (5 mi)", "Moxee (8 mi)", "Buena (10 mi)",
    "Cowiche (12 mi)", "Zillah (12 mi)", "Wapato (12 mi)",
    "Toppenish (15 mi)", "Tieton (15 mi)", "Naches (15 mi)",
    "Harrah (15 mi)", "Granger (18 mi)", "Mabton (20 mi)",
    "White Swan (20 mi)", "Sunnyside (25 mi)", "Ellensburg (25 mi)"
  ],
  services: [
    "Headstone cleaning ($200-$325+)",
    "Bronze cleaning ($275+)",
    "Flower/light placement",
    "Veteran 50% discount"
  ],
  target_audience: "Families with deceased loved ones in Yakima Valley cemeteries, funeral homes, and floral shops",
  lead_types: [
    "Funeral homes (Yakima + neighboring towns)",
    "Cemeteries (Yakima + neighboring towns)",
    "Floral shops (Yakima + neighboring towns)",
    "Families with loved ones in cemeteries",
    "Veterans families",
    "Genealogy researchers"
  ],
  demographics: {
    age_range: "45-65",
    gender: "78% female",
    median_age: 54
  },
  segments: [
    "Local families visiting regularly",
    "Out-of-town relatives who cant maintain stones",
    "Veterans families (military headstones)",
    "Genealogy researchers tracking family plots",
    "Families planning upcoming Memorial Day/anniversary visits",
    "Floral shops seeking cemetery partnerships",
    "Funeral homes seeking restoration referrals"
  ],
  competitor_weaknesses: [
    "Tending (national) - subscription model, impersonal",
    "Cemetery staff - slow, months and months per reviews",
    "Corporate management - delayed placement, poor communication"
  ],
  seasonal_triggers: [
    "Memorial Day (May)", "Veterans Day (November)",
    "Anniversary of passing", "Family reunion trips",
    "Spring cleaning season"
  ],
  notes: "Already spoken to every funeral home and cemetery in Yakima proper. Focus on neighboring areas within 30 miles and floral shops."
});

async function main() {
  await db.execute({
    sql: 'UPDATE clients SET ideal_customer_profile = ? WHERE id = 1',
    args: [icp]
  });
  const r = await db.execute('SELECT ideal_customer_profile FROM clients WHERE id = 1');
  const parsed = JSON.parse(r.rows[0].ideal_customer_profile);
  console.log('Updated. Radius:', parsed.radius);
  console.log('Neighboring areas:', parsed.neighboring_areas.length);
  console.log('Lead types:', parsed.lead_types);
}
main().catch(e => { console.error(e.message); process.exit(1); });
