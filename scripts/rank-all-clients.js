const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  const clientIds=[3,4,7];
  const clientNames={3:'Niloy',4:'Maria',7:'Carter'};
  
  // Directory/non-business domains to flag
  const dirDomains=['yelp.com','bbb.org','facebook.com','yellowpages.com','tripadvisor.com','foursquare.com','thumbtack.com','homeadvisor.com','angi.com','houzz.com','bark.com','expertise.com','porch.com','nextdoor.com','lawyers.com','findglocal.com','hotfrog.com','yellowpages.ca','businessyab.com','topnpi.com','usinsurancedirectory.com','reviews.birdeye.com','citymax.net','bangladeshbusinessdir.com','prethibi.com','doctorlist.info.bd','doctorappointmentbd.com','pathao.com','geico.com','serviceexperts.com','massautorepairshops.com','bd.usembassy.gov','hotfitness.net'];
  
  for(const cid of clientIds){
    console.log('\n'+'='.repeat(60));
    console.log('BEST LEADS: '+clientNames[cid]+' (ID: '+cid+')');
    console.log('='.repeat(60));
    
    const leads=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id='+cid+' ORDER BY l.id'});
    
    let best=[];
    let junk=[];
    let needsFix=[];
    
    for(const lead of leads.rows){
      const notes=(lead.notes||'').toLowerCase();
      const website=(lead.website_url||'').toLowerCase();
      const name=(lead.company_name||'').toLowerCase();
      
      // Check if it's a directory
      const isDirectory=dirDomains.some(d=>website.includes(d));
      
      // Check if it's a PDF or non-business
      const isPdf=website.includes('.pdf');
      const isNonBusiness=name.includes('directory')||name.includes('list')||name.includes('search')||name.includes('info')||name.includes('portal');
      
      if(isDirectory||isPdf){
        junk.push({id:lead.id,name:lead.company_name,website:lead.website_url,reason:'Directory/aggregator site'});
      }else if(isNonBusiness&&!name.includes('restaurant')&&!name.includes('salon')&&!name.includes('plumbing')){
        needsFix.push({id:lead.id,name:lead.company_name,website:lead.website_url,reason:'Not a real business'});
      }else{
        // Score it
        let score=0;
        const email=(lead.contact_email||'').toLowerCase();
        const phone=(lead.contact_phone||'').replace(/\s/g,'');
        
        if(email.length>3)score+=10;
        if(phone.length>=7)score+=8;
        if(lead.location&&lead.location!=='United States and Canada')score+=5;
        if(website.includes('squarespace')||website.includes('wix')||website.includes('godaddy'))score+=10;
        if(notes.includes('squarespace')||notes.includes('wix')||notes.includes('godaddy'))score+=10;
        if(notes.includes('no online booking'))score+=5;
        if(notes.includes('no google analytics'))score+=3;
        if(notes.includes('no schema'))score+=3;
        if(notes.includes('no meta description'))score+=2;
        if(notes.includes('no h1'))score+=2;
        if(notes.includes('not mobile'))score+=5;
        if(notes.includes('not responsive'))score+=5;
        if(notes.includes('flash'))score+=5;
        
        best.push({id:lead.id,name:lead.company_name,website:lead.website_url,score:score,email:lead.contact_email||'',phone:lead.contact_phone||'',location:lead.location||''});
      }
    }
    
    // Sort best by score
    best.sort((a,b)=>b.score-a.score);
    
    console.log('\nJUNK ('+junk.length+' leads - directory/aggregator sites):');
    for(const j of junk){
      console.log('  ❌ '+j.name+' ('+j.website+')');
    }
    
    console.log('\nNEEDS FIX ('+needsFix.length+' leads - not real businesses):');
    for(const n of needsFix){
      console.log('  ⚠️  '+n.name+' ('+n.website+')');
    }
    
    console.log('\nBEST LEADS ('+best.length+' valid businesses):');
    let rank=0;
    for(const b of best.slice(0,15)){
      rank++;
      console.log('  #'+rank+' (Score: '+b.score+') '+b.name);
      console.log('     Website: '+b.website);
      console.log('     Email: '+(b.email||'none'));
      console.log('     Phone: '+(b.phone||'none'));
      console.log('     Location: '+b.location);
    }
    
    console.log('\nSUMMARY: '+best.length+' valid, '+junk.length+' junk, '+needsFix.length+' needs fix');
  }
  
  process.exit(0);
}

run().catch(e=>{console.error(e);process.exit(1);});
