const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

const noWebsiteLeads=[
  // From web research - businesses found only on Yelp/BBB/directories, no own website
  {company_name:"Jimmy Tarpley Plumbing",website_url:null,contact_phone:"(912) 414-6963",location:"Savannah, GA",industry:"Plumber",
   notes:"**Business:** Jimmy Tarpley Plumbing - licensed plumbing contractor in Savannah, GA.\n\n**No Website:** Only found on BBB (NOT BBB Accredited). No dedicated business website. Phone: (912) 414-6963. Address: 7602 Waters Ave Ste D, Savannah, GA 31406.\n\n**Opportunity:** Not BBB accredited and no website suggests they may not prioritize online presence. A professional website would help them build credibility and attract customers searching for plumbers in Savannah.\n\n**Recommended Services:** Custom responsive website, Google Business Profile optimization, local SEO, online booking/contact forms\n\n**Data Completeness:** 30% (phone + location, no email, no website)\n\n**Lead Quality:** Good prospect - has phone and location, no website = prime web dev target",score:7},

  {company_name:"Lumberjack Tree Service",website_url:null,contact_phone:"(804) 304-2786",location:"Richmond, VA",industry:"Tree Service",
   notes:"**Business:** Lumberjack Tree Service - tree care services in Richmond, VA area.\n\n**No Website:** Found on Yelp only (24 photos, services verified). No dedicated business website. Phone: (804) 304-2786.\n\n**Services on Yelp:** Tree care, tree pruning/trimming, tree removal.\n\n**Opportunity:** Active on Yelp with photos and verified services but no website. A professional site would showcase their work with a portfolio gallery and generate leads directly.\n\n**Recommended Services:** Custom website with project gallery, before/after photos, online quote requests, local SEO\n\n**Data Completeness:** 30% (phone + location, no email, no website)\n\n**Lead Quality:** Good - active on Yelp (shows they want customers) but no website to convert",score:7},

  {company_name:"River City Upholstery",website_url:null,contact_phone:null,location:"Richmond, VA",industry:"Furniture Upholstery",
   notes:"**Business:** River City Upholstery - family-owned furniture and auto upholstery business with 70+ years combined experience. 607 Wickham St, Richmond, VA 23222.\n\n**No Website:** Found on Yelp only (21 photos). No dedicated website. Specializes in furniture reupholstery, auto upholstery, and furniture repair.\n\n**Opportunity:** Strong craftsmanship story (70+ years experience) but zero web presence beyond Yelp. A portfolio website would showcase their work beautifully and drive direct inquiries.\n\n**Recommended Services:** Custom portfolio website, before/after gallery, online quote system, local SEO\n\n**Data Completeness:** 20% (location only, no phone/email/website)\n\n**Lead Quality:** Good - strong business story, needs web presence to grow",score:6},

  {company_name:"Absolute Pest Solutions",website_url:null,contact_phone:null,location:"Richmond, VA",industry:"Pest Control",
   notes:"**Business:** Absolute Pest Solutions - pest control company in Richmond, VA. Located at 7825 Midlothian Tpke, Richmond, VA 23235.\n\n**No Website:** Found on Yelp only. No dedicated business website visible.\n\n**Opportunity:** Pest control is a high-demand local service. A website with online booking, service descriptions, and customer reviews would generate significant leads.\n\n**Recommended Services:** Custom website with service pages, online booking, customer review integration, local SEO\n\n**Data Completeness:** 20% (location only)\n\n**Lead Quality:** Fair - needs contact info enrichment",score:5},

  {company_name:"VIVO Contracting",website_url:null,contact_phone:null,location:"Richmond, VA",industry:"General Contractor",
   notes:"**Business:** VIVO Contracting - Class A General Contractor specializing in home additions, full-home renovations, and structural repairs. Est. 2021. 608 W Bacon St, Richmond, VA 23222.\n\n**No Website:** Found on Yelp (5.0 rating, 1 review). No dedicated website. Also does decks & railings.\n\n**Opportunity:** New company (2021) with perfect Yelp rating but no website. A professional site would establish credibility and showcase renovation portfolio.\n\n**Recommended Services:** Custom website with project portfolio, before/after gallery, testimonial system, Google Business Profile\n\n**Data Completeness:** 20% (location only)\n\n**Lead Quality:** Good - new business that needs web presence to grow",score:6},

  {company_name:"Carena's Jamaican Grille",website_url:null,contact_phone:"(804) 422-5375",location:"Richmond, VA",industry:"Restaurant",
   notes:"**Business:** Carena's Jamaican Grille - Caribbean restaurant at 7102 Midlothian Tpke, Richmond, VA 23225.\n\n**No Website:** Found on Yelp, Instagram, and Facebook. No dedicated restaurant website. Phone: (804) 422-5375.\n\n**Opportunity:** Active on social media (Instagram + Facebook) but no website for menu, reservations, or online ordering. A restaurant website with menu, online ordering, and reservation system would boost revenue.\n\n**Recommended Services:** Custom restaurant website with menu system, online ordering, reservation integration, photo gallery\n\n**Data Completeness:** 40% (phone + location + social)\n\n**Lead Quality:** Strong - has phone, location, and social media presence (shows they're active)",score:8},

  {company_name:"Pho Tay Do",website_url:null,contact_phone:"(804) 288-3861",location:"Richmond, VA",industry:"Restaurant",
   notes:"**Business:** Pho Tay Do - Vietnamese noodle restaurant at 6328 Rigsby Rd, Richmond, VA 23226.\n\n**No Website:** Found on Yelp, Instagram, and Facebook. No dedicated restaurant website. Phone: (804) 288-3861.\n\n**Opportunity:** Popular Vietnamese restaurant with social media presence but no website. A website with menu, online ordering, and location info would capture customers searching for Vietnamese food in Richmond.\n\n**Recommended Services:** Custom restaurant website with menu, online ordering, location/hours, review integration\n\n**Data Completeness:** 40% (phone + location + social)\n\n**Lead Quality:** Strong - has phone, location, and social media",score:8},

  {company_name:"SHRIMPS",website_url:null,contact_phone:null,location:"Richmond, VA",industry:"Restaurant",
   notes:"**Business:** SHRIMPS - seafood and soul food restaurant at 17 W Brookland Park Blvd, Richmond, VA 23222. 3.9 stars on Yelp with 123 reviews.\n\n**No Website:** Found on Yelp only. No dedicated restaurant website. Popular spot with 123 reviews.\n\n**Opportunity:** Well-reviewed restaurant (123 Yelp reviews) but no website. A website with menu, online ordering, and reservation system would convert more of that Yelp traffic into direct customers.\n\n**Recommended Services:** Custom restaurant website with menu, online ordering, reservation system, review showcase\n\n**Data Completeness:** 20% (location only)\n\n**Lead Quality:** Good - strong Yelp presence shows demand, needs website to capture it",score:7},

  {company_name:"Dependable Plumbing",website_url:null,contact_phone:null,location:"Savannah, GA",industry:"Plumber",
   notes:"**Business:** Dependable Plumbing - plumbing, drain, and sewer cleaning services in Savannah, GA. 25+ years in business. Address: 3006 Gibbons St, Savannah, GA 31404.\n\n**No Website:** Found on Yahoo Local/Yelp. No dedicated business website. Mixed reviews (2.5 stars on Yelp).\n\n**Opportunity:** 25+ year established business with no website. A professional site with customer testimonials and service descriptions would help rebuild their online reputation.\n\n**Recommended Services:** Custom website, reputation management, review response strategy, local SEO\n\n**Data Completeness:** 20% (location only)\n\n**Lead Quality:** Fair - established business but reputation issues",score:5},

  {company_name:"Nomad Deli and Catering Company",website_url:"http://nomaddelicc.com",contact_phone:"(804) 397-4865",location:"Richmond, VA",industry:"Restaurant/Catering",
   notes:"**Business:** Nomad Deli and Catering Company - catering and meal prep at 207 W Brookland Park Blvd, Richmond, VA 23222. 46 photos on Yelp, 46 reviews.\n\n**Website Assessment:** Website is nomaddelicc.com (linked from Yelp). Need to verify if this is an active, professional site.\n\n**Opportunity:** Active catering business with strong Yelp presence (46 reviews, 86 photos). Website quality TBD - may need professional redesign.\n\n**Recommended Services:** Website audit and potential redesign, online ordering, menu system, event booking\n\n**Data Completeness:** 50% (phone + location + website)\n\n**Lead Quality:** Strong - has phone, location, and website (may need redesign)",score:8},

  {company_name:"Flipclean Gutters",website_url:"http://flipcleanguttersystems.com",contact_phone:"(804) 233-4845",location:"Richmond, VA",industry:"Gutter Services",
   notes:"**Business:** Flipclean Gutters - gutter services at 2104-A Decatur St, Richmond, VA 23224.\n\n**Website Assessment:** Has website flipcleanguttersystems.com (found on Yelp). Phone: (804) 233-4845.\n\n**Opportunity:** Niche gutter service with website - may need redesign or optimization for better lead generation.\n\n**Data Completeness:** 50% (phone + location + website)\n\n**Lead Quality:** Good - has website but may need professional overhaul",score:7},
];

async function run(){
  let saved=0;
  for(const lead of noWebsiteLeads){
    try{
      // Check if already exists
      const existing=await db.execute({sql:'SELECT id FROM leads WHERE company_name=? AND (SELECT client_id FROM client_leads WHERE lead_id=leads.id)=6',args:[lead.company_name]});
      if(existing.rows.length>0){
        console.log('SKIP (exists): '+lead.company_name);
        continue;
      }
      
      const now=new Date().toISOString();
      const wUrl=lead.website_url||null;
      const cPhone=lead.contact_phone||null;
      await db.execute({sql:'INSERT INTO leads (company_name,website_url,contact_email,contact_phone,location,industry,source_url,notes,score,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        args:[lead.company_name,wUrl,null,cPhone,lead.location,lead.industry,null,lead.notes,lead.score,now,now]});
      
      const idResult=await db.execute({sql:'SELECT last_insert_rowid() as id'});
      const leadId=idResult.rows[0].id;
      
      await db.execute({sql:'INSERT INTO client_leads (client_id,lead_id,assigned_at) VALUES (6,?,?)',args:[leadId,now]});
      saved++;
      console.log('SAVED: '+lead.company_name+' (id:'+leadId+')');
    }catch(e){
      console.log('ERROR: '+lead.company_name+' - '+e.message);
    }
  }
  
  const count=await db.execute({sql:'SELECT COUNT(*) as c FROM client_leads WHERE client_id=6'});
  console.log('\nTotal Ethan leads: '+count.rows[0].c+' ('+saved+' new)');
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
