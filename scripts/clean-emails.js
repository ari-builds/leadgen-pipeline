const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});

async function run(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6'});
  
  for(const row of r.rows){
    const email=(row.contact_email||'').trim();
    const notes=(row.notes||'');
    let fixed=false;
    
    // Fix corrupted emails (phone numbers mixed in)
    // Pattern: numbers followed by "email" followed by actual email
    const corruptMatch=email.match(/(\d[\d\-]+)email([a-zA-Z0-9@\.]+)/);
    if(corruptMatch){
      const realEmail=corruptMatch[2];
      console.log('FIX corrupted: '+email+' -> '+realEmail+' ('+row.company_name+')');
      await db.execute({sql:'UPDATE leads SET contact_email=? WHERE id=?',args:[realEmail,row.id]});
      fixed=true;
    }
    
    // Fix emails that are just phone numbers + email
    const phoneEmailMatch=email.match(/^[\d\-\(\)\s\.]+([a-zA-Z0-9@\.]+)$/);
    if(phoneEmailMatch&&!fixed){
      const possibleEmail=phoneEmailMatch[1];
      if(possibleEmail.includes('@')){
        console.log('FIX phone+email: '+email+' -> '+possibleEmail+' ('+row.company_name+')');
        await db.execute({sql:'UPDATE leads SET contact_email=? WHERE id=?',args:[possibleEmail,row.id]});
        fixed=true;
      }
    }
    
    // Fix filler/godaddy emails
    if(email==='filler@godaddy.com'){
      console.log('REMOVE filler email: '+row.company_name);
      await db.execute({sql:'UPDATE leads SET contact_email=NULL WHERE id=?',args:[row.id]});
      fixed=true;
    }
    
    // Fix null emails
    if(email==='null'){
      console.log('REMOVE null email: '+row.company_name);
      await db.execute({sql:'UPDATE leads SET contact_email=NULL WHERE id=?',args:[row.id]});
      fixed=true;
    }
  }
  
  console.log('\nDone cleaning emails');
  process.exit(0);
}

run().catch(function(e){console.error(e);process.exit(1);});
