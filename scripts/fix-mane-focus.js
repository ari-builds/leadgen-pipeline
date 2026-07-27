const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
(async()=>{
  const notes='**Business:** Mane Focus - hair salon in Savannah, GA.\n\n**Phone:** (912) 689-0888\n\n**No Website:** Currently using a GoDaddy placeholder email. No functional website for customers to find services, hours, or book appointments.\n\n**Opportunity:** A professional salon website would showcase their work, enable online booking, and attract new clients through local search.\n\n**Recommended Services:** Custom salon website, online booking integration, portfolio gallery, Google Business Profile optimization\n\n**Data Completeness:** 20% (phone + location only)\n\n**Lead Quality:** Good - has phone and location, needs website';
  await db.execute({sql:'UPDATE leads SET score=7, notes=? WHERE id=752',args:[notes]});
  console.log('Fixed Mane Focus');
  process.exit(0);
})();
