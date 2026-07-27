const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  // Junk leads to remove from Niloy
  const niloyJunk=[
    'https://prethibi.com/2020/10/15/restaurants-list-in-dhaka-bangladesh/',
    'https://bangladeshbusinessdir.com/desh-catering/',
    'https://www.doctorlist.info.bd/searchdoctors',
    'https://pathao.com/food/',
    'https://bd.usembassy.gov/wp-content/uploads/sites/151/2026/04/2026-Mar-List-of-Physicians-and-Hospitals.pdf',
    'https://citymax.net/bangladesh/dhaka/restaurant-in-dhaka/',
    'https://doctorappointmentbd.com/doctors-in-dhaka/'
  ];
  
  // Junk leads to remove from Maria
  const mariaJunk=[
    'https://www.geico.com/',
    'https://www.serviceexperts.com/',
    'https://usinsurancedirectory.com/massachusetts/tyngsborough-ma/lewis-p-bither-insurance-agency',
    'https://reviews.birdeye.com/adamsky-law-offices-155667372898340',
    'https://www.lawyers.com/all-legal-issues/tyngsborough/massachusetts/law-firms/',
    'https://hotfitness.net/fitness-near-me/supreme-fitness-on-middlesex-road/',
    'https://businessyab.com/explore/united_states/massachusetts/middlesex_county/tyngsborough/progress_avenue/18/new_body_fitness.html',
    'https://www.hotfrog.com/company/1098357183033344/millbrook-chiropractic-office/millbrook/alternative-health-care',
    'https://www.yellowpages.ca/bus/Ontario/Espanola/Espanola-Chiropractic-Office/6298059.html',
    'https://www.findglocal.com/US/Boston/107312748397494/Boston-Veterinary-Clinic',
    'https://www.massautorepairshops.com/auto-repair-shops-tyngsborough-ma.html',
    'https://www.topnpi.com/ma1922125525/dr-david-frost'
  ];
  
  // Clean Niloy
  console.log('CLEANILO: Cleaning Niloy...');
  let niloyRemoved=0;
  for(const url of niloyJunk){
    const lead=await db.execute({sql:'SELECT id FROM leads WHERE website_url LIKE ?',args:['%'+url.replace('https://','').split('/')[0]+'%']});
    if(lead.rows.length>0){
      for(const l of lead.rows){
        await db.execute({sql:'DELETE FROM client_leads WHERE lead_id=? AND client_id=3',args:[l.id]});
        await db.execute({sql:'DELETE FROM leads WHERE id=?',args:[l.id]});
        niloyRemoved++;
        console.log('  Removed lead #'+l.id);
      }
    }
  }
  console.log('Niloy: Removed '+niloyRemoved+' junk leads');
  
  // Clean Maria
  console.log('\nCLEANILO: Cleaning Maria...');
  let mariaRemoved=0;
  for(const url of mariaJunk){
    const domain=url.replace('https://','').split('/')[0];
    const lead=await db.execute({sql:'SELECT id FROM leads WHERE website_url LIKE ?',args:['%'+domain+'%']});
    if(lead.rows.length>0){
      for(const l of lead.rows){
        await db.execute({sql:'DELETE FROM client_leads WHERE lead_id=? AND client_id=4',args:[l.id]});
        await db.execute({sql:'DELETE FROM leads WHERE id=?',args:[l.id]});
        mariaRemoved++;
        console.log('  Removed lead #'+l.id);
      }
    }
  }
  console.log('Maria: Removed '+mariaRemoved+' junk leads');
  
  // Verify
  const niloyCount=await db.execute({sql:'SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=3'});
  const mariaCount=await db.execute({sql:'SELECT COUNT(*) as c FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=4'});
  console.log('\nNiloy remaining: '+niloyCount.rows[0].c);
  console.log('Maria remaining: '+mariaCount.rows[0].c);
  
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
