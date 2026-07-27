const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

const nameMap={
  'Asheville Proper - Restaurant in Downtown Asheville, North Carolina':'Asheville Proper',
  'Capella on 9':'Capella on 9',
  'ASHES & STEEL STUDIO':'Ashes & Steel Studio',
  'Hairxtacy - Hair Salon in Burlington':'Hairxtacy',
  'Salon Vermont, Hair Salon South Burlington and Williston VT':'Salon Vermont',
  'Windjammer Restaurants Burlington VT - Steakhouses, Pubs, Seafood':'Windjammer',
  'RendezVous \u2022 French Restaurant in Asheville, North Carolina':'RendezVouz',
  'The Corner Kitchen Restaurant and Bar - Asheville, NC':'The Corner Kitchen',
  'Bloomsbury Hair Salon, Asheville, NC: High-End Holistic Hairstylist':'Bloomsbury Hair Salon',
  'Studio Chavarria - Hair Salon and Gallery':'Studio Chavarria',
  'Salon Della Vita \u2026Salon of Life':'Salon Della Vita',
  'PRISM HAIR':'PRISM Hair',
  'SAGE SALON':'Sage Salon',
  'Mango Salon | Richmond, VA':'Mango Salon',
  'Salon del Sol | Best Aveda Salon in Richmond, VA':'Salon del Sol',
  'La Playa Mexican Restaurant':'La Playa Mexican Restaurant',
  'Chianti Richmond':'Chianti',
  'The Continental Westhampton':'The Continental',
  'Old Original Bookbinder\'s':'Bookbinder\'s',
  'Farmhouse Tap & Grill Burlington':'Farmhouse Tap & Grill',
  'Statewide Contractors Inc':'Statewide Contractors',
  'Full Service Landscape Construction':'Full Service Landscape',
  'HotelGyms.com':'HotelGyms',
  'Burlington Vermont Restaurants':'Burlington Restaurants',
  'Asheville, NC':'Asheville Business',
  'Savannah, GA | Savannah.com':'Savannah.com',
  'Fitness Studio & Gym near Burlington, VT':'Fitness Studio',
  'Salon del Sol | Best Aveda Salon in Richmond, VA':'Salon del Sol',
  'Salon of Life':'Salon Della Vita',
  'Asheville Proper - Restaurant in Downtown Asheville, North Carolina':'Asheville Proper',
  'Hair by Ellie VT':'Hair by Ellie',
  '24/7 Gym in Burlington, VT - Snap Fitness USA':'Snap Fitness Burlington',
  'Crossfit Asheville ':'CrossFit Asheville',
  'Sitework Contractor':'Siteworks',
  'FORTITUDE':'Fortitude',
  'HITT Contracting':'HITT Contracting',
  'ARCO Design/Build':'ARCO Design/Build',
  'Integrity One Contracting':'Integrity One Contracting',
  'AHG Construction':'AHG Construction',
  'Boho Hair & Color Salon':'Boho Hair & Color',
  'Mane Focus Hair Salon':'Mane Focus',
  'Shine Salon Savannah':'Shine Salon',
  'Luminary Hair Co.':'Luminary Hair Co.',
  'Salon Roche\u2019':'Salon Roche',
  'Hairdo Salons Savannah - Savannah, GA':'Hairdo Salons',
  'MADabolic':'MADabolic',
  'Splash at the Boathouse':'Splash at the Boathouse',
  'McLean Family Restaurant':'McLean Family Restaurant',
  'Seven Days':'Seven Days',
  'ActiveVT':'ActiveVT',
  'Salt Yard Cafe + Bar':'Salt Yard Cafe',
  'Scales Restaurant Portland Maine':'Scales Restaurant',
  'CrossFit Burlington':'CrossFit Burlington',
  'Marketplace Fitness':'Marketplace Fitness',
  'Hot Fitness':'Hot Fitness',
  'The Front Room':'The Front Room',
  'Old Port Sea Grill':'Old Port Sea Grill',
  'Thames Landing':'Thames Landing',
  'Honey Road':'Honey Road',
  'piervana1':'Pier Vana Hair',
  'GOLD':'Gold',
  'Indigo':'Indigo',
  'Butter':'Butter',
  'Jargon':'Jargon',
  'Tupelo Honey':'Tupelo Honey',
  'Chestnut Asheville':'Chestnut',
  'C\u00fbrate Bar De Tapas':'C\u00fbrate',
  'adorn-salon':'Adorn Salon',
  'Code Style Club':'Code Style Club',
  'circlesquaresalon':'Circle Square Salon',
  'Salon AVL':'Salon AVL',
  '1308 Studio':'1308 Studio',
  'aqua':'Aqua Salon',
  'YY Salon':'YY Salon',
  'Grisette':'Grisette',
  'Chianti Richmond':'Chianti',
  'La Playa Mexican Restaurant':'La Playa Mexican',
  'Old Original Bookbinder\'s':'Bookbinder\'s',
  'Rowland':'Rowland',
  'The Roosevelt':'The Roosevelt',
  'Brazen RVA':'Brazen RVA',
  'Grace Salon RVA':'Grace Salon',
  'Hot Fitness':'Hot Fitness',
  'C\u00fbrate Bar De Tapas':'C\u00fbrate'
};

async function fixNames(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.id'});
  
  for(const row of r.rows){
    const orig=(row.company_name||'').trim();
    let name=nameMap[orig]||orig;
    
    // Generic: remove trailing state/city after dash
    if(name.includes(' - ')){
      name=name.split(' - ')[0].trim();
    }
    // Generic: remove trailing ", State"
    name=name.replace(/, (NC|VT|ME|GA|VA|NH|NY|MA)$/,'').trim();
    
    if(name!==orig&&name.length>2){
      console.log(`FIXED: "${orig}" -> "${name}"`);
      await db.execute({sql:'UPDATE leads SET company_name=? WHERE id=?',args:[name,row.id]});
    }
  }
}

fixNames().then(async()=>{
  console.log('\nDone fixing names');
  const r=await db.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id=6'});
  console.log('Total Ethan leads:',r.rows[0].c);
  process.exit(0);
}).catch(e=>{console.error(e);process.exit(1);});
