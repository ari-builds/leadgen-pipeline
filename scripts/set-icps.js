const db = require('./db');

async function main() {
  const clients = [
    {
      slug: 'ashes-niloy',
      description: 'Full-Stack Developer (Angular, Laravel, React, .NET) based in Dhaka, Bangladesh. Trial client - 50 leads.',
      icp: JSON.stringify({
        business_type: 'Web Development / Software Engineering Services',
        target_businesses: 'Small to medium businesses without websites or with outdated websites',
        industries: ['Restaurants', 'Retail Shops', 'Clinics', 'Real Estate', 'Education', 'E-commerce'],
        location: 'Dhaka, Bangladesh',
        radius: 'Dhaka metro area',
        keywords: ['website development', 'web design', 'landing page', 'e-commerce website', 'business website', 'Angular development', 'Laravel API', 'React development'],
        min_employees: '1-50',
        exclude: ['Already has modern website', 'Tech companies', 'Agencies'],
        notes: 'Niloy is a full-stack developer (Angular, Laravel, React, .NET). Trial client - 50 leads. Focus on businesses that need websites built or redesigned.'
      })
    },
    {
      slug: 'maria-khan',
      description: 'MZ Automation - AI automation solutions for service-based businesses. Chatbots, call agents, appointment booking, WhatsApp/email automation, lead capture workflows.',
      icp: JSON.stringify({
        business_type: 'AI Automation / Chatbot / Call Agent Services',
        target_businesses: 'Service-based businesses that need AI automation for customer support, appointment booking, lead capture, and follow-up workflows',
        industries: ['Dental offices', 'Medical clinics', 'Salons & spas', 'HVAC companies', 'Plumbers', 'Electricians', 'Real estate agencies', 'Insurance agencies', 'Financial advisors', 'Law firms', 'Gyms & fitness', 'Restaurants', 'Auto repair shops'],
        location: 'United States and Canada',
        radius: 'Nationwide',
        keywords: ['AI chatbot', 'automated booking', 'lead capture', 'customer support automation', 'appointment scheduling', 'WhatsApp automation', 'email automation', 'follow-up workflows'],
        min_employees: '1-50',
        exclude: ['Tech companies', 'Already has AI automation', 'Large enterprises'],
        notes: 'Maira Khan (MZ Automation) is a PARTNER who provides AI automation. She needs leads for her own business - service-based businesses that would buy AI chatbots, call agents, and automation. White-label partnership with NetClicks.'
      })
    },
    {
      slug: 'ethan-grandet',
      description: 'ArcTik Dev - Web developer targeting local businesses in US and Canada. Restaurants, contractors, salons, gyms. Wants 30 leads/month with bulk lead generation + initial outreach.',
      icp: JSON.stringify({
        business_type: 'Web Development Services',
        target_businesses: 'Local businesses with weak or no websites that need professional web development',
        industries: ['Restaurants', 'Contractors', 'Salons', 'Gyms', 'Retail shops', 'Local services'],
        location: 'United States and Canada',
        radius: 'Nationwide',
        keywords: ['website development', 'web design', 'landing page', 'business website', 'local business website', 'restaurant website', 'contractor website', 'salon website', 'gym website'],
        min_employees: '1-20',
        exclude: ['Already has modern website', 'Tech companies', 'Agencies', 'Large enterprises'],
        notes: 'Ethan Grandet (ArcTik Dev) is a web developer. Targets local businesses in US/Canada. Wants 30 leads initially. Wants bulk lead generation + initial outreach. Payment: monthly depending on leads wanted. Commission on closed deals if outreach included.'
      })
    },
    {
      slug: 'carter-garcia',
      description: 'Web developer - makes websites for people. Interested in bulk lead generation partnership.',
      icp: JSON.stringify({
        business_type: 'Web Development Services',
        target_businesses: 'Local businesses and individuals that need websites built',
        industries: ['Restaurants', 'Contractors', 'Salons', 'Gyms', 'Retail shops', 'Local services', 'Personal brands', 'Small businesses'],
        location: 'United States and Canada',
        radius: 'Nationwide',
        keywords: ['website development', 'web design', 'landing page', 'business website', 'personal website', 'portfolio website'],
        min_employees: '1-20',
        exclude: ['Already has modern website', 'Tech companies', 'Agencies'],
        notes: 'Carter Garcia - web developer. Makes websites for people. Interested in bulk lead generation partnership. Less specific than Ethan. Landing 1-2 clients/month should cover the cost.'
      })
    }
  ];

  for (const c of clients) {
    await db.execute({
      sql: "UPDATE clients SET description = ?, ideal_customer_profile = ? WHERE slug = ?",
      args: [c.description, c.icp, c.slug]
    });
    console.log('✅', c.slug, '- ICP updated');
  }

  // Verify
  const all = await db.execute({ sql: 'SELECT id, name, slug, description FROM clients ORDER BY id', args: [] });
  for (const row of all.rows) {
    console.log(`\n[${row.id}] ${row.name}`);
    console.log(`    Slug: ${row.slug}`);
    console.log(`    Desc: ${row.description}`);
  }
}

main().catch(console.error);
