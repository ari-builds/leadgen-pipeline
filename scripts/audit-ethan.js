const {createClient}=require('@libsql/client');
const db=createClient({url:'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',authToken:process.env.TURSO_AUTH_TOKEN});
async function go(){
  const r=await db.execute({sql:'SELECT l.id,l.company_name,l.contact_email,l.contact_phone,l.website_url,l.location,l.contact_facebook,l.contact_instagram,l.contact_linkedin,l.contact_twitter,l.notes FROM leads l JOIN client_leads cl ON l.id=cl.lead_id WHERE cl.client_id=6 ORDER BY l.id'});
  let hasEmail=0,hasPhone=0,hasWebsite=0,hasAnySocial=0,noContact=0;
  const bad=[];
  for(const row of r.rows){
    const e=(row.contact_email||'').toLowerCase();
    const p=(row.contact_phone||'').replace(/\s/g,'');
    const w=row.website_url||'';
    const fb=row.contact_facebook||'';
    const ig=row.contact_instagram||'';
    const li=row.contact_linkedin||'';
    const tw=row.contact_twitter||'';
    const social=fb+ig+li+tw;
    const fakeEmails=['user@','you@','name@','your@','business@','email@','image','qq.com','filler@','support@','noreply','admin@example','test@'];
    const hasE=e.length>3&&!fakeEmails.some(f=>e.includes(f));
    const tollFree=['800-','888-','877-','866-','855-','844-','833-','1800','+1888','+1800'];
    const hasP=p.length>6&&!tollFree.some(t=>p.includes(t));
    if(hasE)hasEmail++;
    if(hasP)hasPhone++;
    if(w)hasWebsite++;
    if(social.length>2)hasAnySocial++;
    if(!hasE&&!hasP&&social.length<3){noContact++;bad.push(`${row.id} ${row.company_name}`);}
  }
  console.log('Total:',r.rows.length);
  console.log('Has email:',hasEmail);
  console.log('Has phone:',hasPhone);
  console.log('Has website:',hasWebsite);
  console.log('Has social:',hasAnySocial);
  console.log('NO contact at all:',noContact);
  if(bad.length)console.log('Bad leads:\n'+bad.join('\n'));
}
go();
