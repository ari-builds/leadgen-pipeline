const https = require('https');
const http = require('http');
const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://database-emerald-crystal-vercel-icfg-ahaivwqbfstqdpz03ndaozrs.aws-us-east-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

function fetchUrl(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.resolve({ html: '', finalUrl: url, statusCode: 0, headers: {} });
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchUrl(next, redirectCount + 1).then(resolve, reject);
      }
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ html: data, finalUrl: url, statusCode: res.statusCode, headers: res.headers }));
    });
    req.on('error', () => resolve({ html: '', finalUrl: url, statusCode: 0, headers: {} }));
    req.on('timeout', () => { req.destroy(); resolve({ html: '', finalUrl: url, statusCode: 0, headers: {} }); });
  });
}

function auditWebsite(html, url, responseHeaders) {
  const issues = {};
  const lower = html.toLowerCase();

  // ========== MOBILE ==========
  issues.mobile = {
    status: html.includes('viewport') ? 'pass' : 'fail',
    detail: html.includes('viewport')
      ? 'Viewport meta tag present'
      : 'No viewport meta tag — site will not render properly on mobile devices'
  };

  // ========== RESPONSIVE DESIGN ==========
  const mediaQueries = (html.match(/@media/g) || []).length;
  const flexbox = html.includes('display: flex') || html.includes('display:flex');
  const grid = html.includes('display: grid') || html.includes('display:grid');
  const bootstrap = html.includes('bootstrap');
  const tailwind = html.includes('tailwind');
  issues.responsive = {
    status: mediaQueries > 2 || bootstrap || tailwind || flexbox ? 'pass' : mediaQueries > 0 ? 'warn' : 'fail',
    detail: mediaQueries > 2
      ? `Responsive design detected (${mediaQueries} media queries)`
      : bootstrap ? 'Bootstrap framework detected (responsive)'
      : tailwind ? 'Tailwind CSS detected (responsive)'
      : mediaQueries > 0 ? `Basic responsiveness (${mediaQueries} media queries — may be incomplete)`
      : 'No CSS media queries found — site is not responsive'
  };

  // ========== PLATFORM / CMS ==========
  let platform = 'Unknown';
  let platformDetail = '';
  if (lower.includes('squarespace')) { platform = 'Squarespace'; platformDetail = 'Template-locked, limited customization, 3% transaction fees'; }
  else if (lower.includes('wix.com') || lower.includes('wixstatic')) { platform = 'Wix'; platformDetail = 'Drag-and-drop builder, slow load times, not exportable'; }
  else if (lower.includes('godaddy') || lower.includes('websitesettings')) { platform = 'GoDaddy'; platformDetail = 'Basic builder, limited SEO, poor performance'; }
  else if (lower.includes('wordpress') || lower.includes('wp-content')) { platform = 'WordPress'; platformDetail = 'Flexible but plugin-dependent, security concerns if unpatched'; }
  else if (lower.includes('shopify')) { platform = 'Shopify'; platformDetail = 'E-commerce focused, 0.5-2% transaction fees'; }
  else if (lower.includes('webflow')) { platform = 'Webflow'; platformDetail = 'Design-focused, higher learning curve'; }
  else if (lower.includes('framer')) { platform = 'Framer'; platformDetail = 'Newer builder, limited integrations'; }
  else if (lower.includes('react') || lower.includes('next.js') || lower.includes('__next')) { platform = 'Next.js/React'; platformDetail = 'Modern framework — well built'; }
  else if (lower.includes('vue.js') || lower.includes('nuxt')) { platform = 'Vue/Nuxt'; platformDetail = 'Modern framework — well built'; }
  else if (lower.includes('angular')) { platform = 'Angular'; platformDetail = 'Enterprise framework'; }
  else { platform = 'Custom/Unknown'; platformDetail = 'Custom build or unknown platform'; }

  issues.platform = {
    status: ['Squarespace', 'Wix', 'GoDaddy'].includes(platform) ? 'warn' : 'pass',
    detail: `${platform} — ${platformDetail}`,
    value: platform
  };

  // ========== FLASH ==========
  issues.flash = {
    status: (lower.includes('.swf') || lower.includes('flash') || lower.includes('object data=') && lower.includes('.swf')) ? 'fail' : 'pass',
    detail: (lower.includes('.swf') || lower.includes('flash'))
      ? 'Flash content detected — not supported on mobile, dead technology since 2020'
      : 'No Flash content'
  };

  // ========== BOOKING / RESERVATION ==========
  const bookingKeywords = ['booking', 'reservation', 'appointment', 'book now', 'schedule', 'order online', 'request a quote', 'get a quote', 'free estimate'];
  const hasBooking = bookingKeywords.some(k => lower.includes(k));
  issues.booking = {
    status: hasBooking ? 'pass' : 'fail',
    detail: hasBooking
      ? 'Booking/reservation system detected'
      : 'No online booking or reservation system — losing customers to competitors who offer instant booking'
  };

  // ========== GOOGLE ANALYTICS ==========
  const ga4 = lower.includes('gtag') || lower.includes('ga4') || lower.includes('measurement');
  const gtm = lower.includes('googletagmanager');
  const gaOld = lower.includes('google-analytics') || lower.includes('analytics.js');
  issues.analytics = {
    status: ga4 || gtm || gaOld ? 'pass' : 'fail',
    detail: ga4 ? 'Google Analytics 4 (gtag) detected'
      : gtm ? 'Google Tag Manager detected'
      : gaOld ? 'Universal Analytics detected (deprecated — should upgrade to GA4)'
      : 'No Google Analytics found — cannot track visitors, conversions, or performance'
  };

  // ========== FACEBOOK PIXEL ==========
  const fbPixel = lower.includes('facebook') && (lower.includes('pixel') || lower.includes('fbevents') || lower.includes('fbq('));
  issues.facebookPixel = {
    status: fbPixel ? 'pass' : 'warn',
    detail: fbPixel ? 'Facebook Pixel detected' : 'No Facebook Pixel — cannot run retargeting ads or track ad conversions'
  };

  // ========== HEATMAP / SESSION RECORDING ==========
  const heatmap = lower.includes('hotjar') || lower.includes('clarity') || lower.includes('fullstory') || lower.includes('mouseflow') || lower.includes('lucky orange');
  issues.heatmap = {
    status: heatmap ? 'pass' : 'warn',
    detail: heatmap ? 'Session recording/heatmap tool detected' : 'No heatmap or session recording — cannot see how users actually interact with the site'
  };

  // ========== SCHEMA / STRUCTURED DATA ==========
  const schemaLD = lower.includes('application/ld+json');
  const microdata = lower.includes('itemtype');
  issues.schema = {
    status: schemaLD || microdata ? 'pass' : 'fail',
    detail: schemaLD ? 'JSON-LD structured data detected'
      : microdata ? 'Microdata structured data detected (JSON-LD preferred)'
      : 'No schema markup — missing Google rich results (FAQ, reviews, hours, etc.)'
  };

  // ========== META DESCRIPTION ==========
  const metaDesc = html.match(/meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  issues.metaDescription = {
    status: metaDesc ? 'pass' : 'fail',
    detail: metaDesc
      ? `Meta description present (${metaDesc[1].length} chars)`
      : 'No meta description — Google will auto-generate one (usually poor quality), hurting click-through rate'
  };

  // ========== META TITLE ==========
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  issues.title = {
    status: titleMatch ? 'pass' : 'fail',
    detail: titleMatch
      ? `Title tag: "${titleMatch[1].trim().substring(0, 60)}" (${titleMatch[1].length} chars)`
      : 'No title tag — critical SEO issue'
  };

  // ========== H1 TAGS ==========
  const h1Matches = html.match(/<h1[^>]*>/gi) || [];
  issues.h1 = {
    status: h1Matches.length === 1 ? 'pass' : h1Matches.length === 0 ? 'fail' : 'warn',
    detail: h1Matches.length === 1 ? 'Exactly 1 H1 tag (optimal)'
      : h1Matches.length === 0 ? 'No H1 tag — critical SEO issue, Google can\'t understand page topic'
      : `${h1Matches.length} H1 tags found — should be exactly 1 per page for SEO`
  };

  // ========== HEADING HIERARCHY ==========
  const h2 = (html.match(/<h2/gi) || []).length;
  const h3 = (html.match(/<h3/gi) || []).length;
  issues.headings = {
    status: h2 > 0 ? 'pass' : 'warn',
    detail: h2 > 0 ? `Heading hierarchy: H1(${h1Matches.length}) → H2(${h2}) → H3(${h3})` : 'No H2 subheadings — poor content structure'
  };

  // ========== IMAGE ALT TEXT ==========
  const images = html.match(/<img[^>]*>/gi) || [];
  const imagesWithAlt = images.filter(i => i.includes('alt=') && !i.includes('alt=""') && !i.includes('alt=\'\''));
  const altPercent = images.length > 0 ? Math.round(imagesWithAlt.length / images.length * 100) : 100;
  issues.imageAlt = {
    status: altPercent > 80 ? 'pass' : altPercent > 40 ? 'warn' : 'fail',
    detail: images.length > 0
      ? `${imagesWithAlt.length}/${images.length} images have alt text (${altPercent}%) — ${altPercent > 80 ? 'good for accessibility and SEO' : 'missing alt text hurts SEO and accessibility'}`
      : 'No images found on page'
  };

  // ========== SOCIAL MEDIA LINKS ==========
  const fb = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/);
  const ig = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/);
  const tw = html.match(/twitter\.com\/[a-zA-Z0-9._-]+/) || html.match(/x\.com\/[a-zA-Z0-9._-]+/);
  const li = html.match(/linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+/);
  const socialCount = [fb, ig, tw, li].filter(Boolean).length;
  issues.social = {
    status: socialCount >= 2 ? 'pass' : socialCount > 0 ? 'warn' : 'fail',
    detail: socialCount >= 2
      ? `Social links found: ${[fb && 'Facebook', ig && 'Instagram', tw && 'Twitter/X', li && 'LinkedIn'].filter(Boolean).join(', ')}`
      : socialCount > 0
      ? `Only 1 social link found — should link all active profiles`
      : 'No social media links on website — missing trust signals and cross-promotion'
  };

  // ========== SSL / HTTPS ==========
  issues.ssl = {
    status: url.startsWith('https') ? 'pass' : 'fail',
    detail: url.startsWith('https') ? 'SSL certificate active (HTTPS)' : 'No SSL — site is insecure, browsers will show "Not Secure" warning'
  };

  // ========== MIXED CONTENT ==========
  const httpResources = (html.match(/http:\/\/[^"'\s]+/g) || []).length;
  issues.mixedContent = {
    status: httpResources === 0 ? 'pass' : 'warn',
    detail: httpResources === 0
      ? 'No mixed content (all resources loaded over HTTPS)'
      : `${httpResources} HTTP resources found on HTTPS page — may cause security warnings`
  };

  // ========== COPYRIGHT YEAR ==========
  const currentYear = new Date().getFullYear();
  const copyrightMatch = html.match(/©\s*(\d{4})/);
  const yearMatch = copyrightMatch ? parseInt(copyrightMatch[1]) : null;
  issues.copyright = {
    status: yearMatch === currentYear ? 'pass' : yearMatch && yearMatch >= currentYear - 1 ? 'warn' : 'fail',
    detail: yearMatch === currentYear
      ? `Copyright year is current (${currentYear})`
      : yearMatch
      ? `Copyright shows ${yearMatch} — ${currentYear - yearMatch} years outdated, looks abandoned`
      : 'No copyright year found'
  };

  // ========== CONTACT FORM ==========
  const contactForm = lower.includes('contact-form') || lower.includes('contactform') || lower.includes('<form') && lower.includes('contact');
  issues.contactForm = {
    status: contactForm ? 'pass' : 'warn',
    detail: contactForm ? 'Contact form detected' : 'No contact form found — visitors must copy email/phone to reach out'
  };

  // ========== PHONE NUMBER ==========
  const phoneLink = lower.includes('tel:');
  issues.phoneClickable = {
    status: phoneLink ? 'pass' : 'warn',
    detail: phoneLink ? 'Phone number is clickable (tel: link)' : 'Phone number not clickable — mobile visitors can\'t tap to call'
  };

  // ========== EMAIL CLICKABLE ==========
  const emailLink = lower.includes('mailto:');
  issues.emailClickable = {
    status: emailLink ? 'pass' : 'warn',
    detail: emailLink ? 'Email address is clickable (mailto: link)' : 'Email not clickable — visitors must manually copy address'
  };

  // ========== GOOGLE MAPS ==========
  const maps = lower.includes('google.com/maps') || lower.includes('maps.google') || lower.includes('goo.gl/maps');
  issues.googleMaps = {
    status: maps ? 'pass' : 'warn',
    detail: maps ? 'Google Maps embed detected' : 'No Google Maps embed — visitors can\'t easily find location'
  };

  // ========== LIVE CHAT ==========
  const liveChat = lower.includes('intercom') || lower.includes('drift') || lower.includes('crisp') || lower.includes('tawk') || lower.includes('livechat') || lower.includes('zendesk') || lower.includes('chatwoot');
  issues.liveChat = {
    status: liveChat ? 'pass' : 'warn',
    detail: liveChat ? 'Live chat widget detected' : 'No live chat — visitors with questions leave without converting'
  };

  // ========== NEWSLETTER / EMAIL CAPTURE ==========
  const newsletter = lower.includes('newsletter') || lower.includes('subscribe') || lower.includes('sign up') || lower.includes('join our mailing');
  issues.newsletter = {
    status: newsletter ? 'pass' : 'warn',
    detail: newsletter ? 'Email capture/newsletter signup detected' : 'No email capture — missing opportunity to build mailing list'
  };

  // ========== PAGE SIZE ==========
  const sizeKB = Math.round(html.length / 1024);
  issues.pageSize = {
    status: sizeKB < 500 ? 'pass' : sizeKB < 1000 ? 'warn' : 'fail',
    detail: `${sizeKB}KB HTML — ${sizeKB < 500 ? 'lean and fast' : sizeKB < 1000 ? 'moderate size' : 'very heavy, will load slowly on mobile'}`
  };

  // ========== SECURITY HEADERS ==========
  const hasCSP = responseHeaders['content-security-policy'];
  const hasXFrame = responseHeaders['x-frame-options'];
  const hasHSTS = responseHeaders['strict-transport-security'];
  const securityScore = [hasCSP, hasXFrame, hasHSTS].filter(Boolean).length;
  issues.securityHeaders = {
    status: securityScore >= 2 ? 'pass' : securityScore > 0 ? 'warn' : 'fail',
    detail: `${securityScore}/3 security headers present${hasCSP ? ' (CSP)' : ''}${hasXFrame ? ' (X-Frame)' : ''}${hasHSTS ? ' (HSTS)' : ''}`
  };

  // ========== FAVICON ==========
  const favicon = lower.includes('rel="icon"') || lower.includes('rel="shortcut icon"') || lower.includes('favicon');
  issues.favicon = {
    status: favicon ? 'pass' : 'warn',
    detail: favicon ? 'Favicon detected' : 'No favicon — site looks unprofessional in browser tabs'
  };

  // ========== OPEN GRAPH ==========
  const og = lower.includes('og:title') || lower.includes('og:description');
  issues.openGraph = {
    status: og ? 'pass' : 'warn',
    detail: og ? 'Open Graph tags present (good for social sharing)' : 'No Open Graph tags — shared links on social media will look broken'
  };

  // ========== INTERNAL LINKING ==========
  const internalLinks = (html.match(/href="[^"]*"/g) || []).filter(l => l.includes(url.split('//')[1]?.split('/')[0] || '')).length;
  issues.internalLinks = {
    status: internalLinks > 5 ? 'pass' : internalLinks > 0 ? 'warn' : 'fail',
    detail: `${internalLinks} internal links found — ${internalLinks > 5 ? 'good site structure' : internalLinks > 0 ? 'limited internal linking' : 'no internal links — poor SEO and navigation'}`
  };

  // ========== BLOG / CONTENT ==========
  const blog = lower.includes('/blog') || lower.includes('article') || lower.includes('post');
  issues.blog = {
    status: blog ? 'pass' : 'warn',
    detail: blog ? 'Blog/content section detected' : 'No blog — missing content marketing and SEO opportunity'
  };

  // ========== TESTIMONIALS / REVIEWS ==========
  const testimonials = lower.includes('testimonial') || lower.includes('review') || lower.includes('what our') || lower.includes('what clients');
  issues.testimonials = {
    status: testimonials ? 'pass' : 'warn',
    detail: testimonials ? 'Testimonials/reviews section detected' : 'No testimonials or reviews — missing social proof'
  };

  // ========== ABOUT PAGE ==========
  const about = lower.includes('/about') || lower.includes('about us');
  issues.aboutPage = {
    status: about ? 'pass' : 'warn',
    detail: about ? 'About page detected' : 'No about page — visitors can\'t learn about the business'
  };

  // ========== SERVICES PAGE ==========
  const services = lower.includes('/services') || lower.includes('/pricing') || lower.includes('what we do');
  issues.servicesPage = {
    status: services ? 'pass' : 'warn',
    detail: services ? 'Services/pricing page detected' : 'No services page — unclear what the business offers'
  };

  // ========== TEAM PAGE ==========
  const team = lower.includes('/team') || lower.includes('/about') && lower.includes('team');
  issues.teamPage = {
    status: team ? 'pass' : 'warn',
    detail: team ? 'Team page detected' : 'No team page — missing human connection'
  };

  // ========== PORTFOLIO / GALLERY ==========
  const portfolio = lower.includes('portfolio') || lower.includes('gallery') || lower.includes('our work') || lower.includes('case study');
  issues.portfolio = {
    status: portfolio ? 'pass' : 'warn',
    detail: portfolio ? 'Portfolio/gallery detected' : 'No portfolio — can\'t showcase past work'
  };

  // ========== FAQ ==========
  const faq = lower.includes('/faq') || lower.includes('frequently asked');
  issues.faq = {
    status: faq ? 'pass' : 'warn',
    detail: faq ? 'FAQ section detected' : 'No FAQ — answering common questions manually via email/phone'
  };

  // ========== 404 PAGE ==========
  // Can't easily test this without fetching a bad URL, skip for now

  // ========== ROBOTS.TXT ==========
  // Would need separate fetch, skip for now

  // ========== XML SITEMAP ==========
  // Would need separate fetch, skip for now

  return issues;
}

function buildAssessment(issues) {
  let passCount = 0, warnCount = 0, failCount = 0;
  const details = [];
  const recommendations = [];

  for (const [key, val] of Object.entries(issues)) {
    if (key === 'platform') continue; // handled separately
    if (val.status === 'pass') passCount++;
    else if (val.status === 'warn') { warnCount++; details.push(`⚠️ ${val.detail}`); }
    else if (val.status === 'fail') {
      failCount++;
      details.push(`❌ ${val.detail}`);
      // Generate recommendation
      if (key === 'booking') recommendations.push('Online booking system');
      if (key === 'analytics') recommendations.push('Google Analytics 4 setup');
      if (key === 'schema') recommendations.push('Schema markup implementation');
      if (key === 'metaDescription') recommendations.push('Meta description optimization');
      if (key === 'h1') recommendations.push('H1 tag optimization');
      if (key === 'social') recommendations.push('Social media integration');
      if (key === 'flash') recommendations.push('Remove Flash content');
      if (key === 'responsive') recommendations.push('Responsive design overhaul');
      if (key === 'mobile') recommendations.push('Mobile viewport fix');
      if (key === 'imageAlt') recommendations.push('Image alt text optimization');
      if (key === 'copyright') recommendations.push('Update copyright year');
    }
  }

  const total = passCount + warnCount + failCount;
  const healthScore = total > 0 ? Math.round(passCount / total * 100) : 0;

  return { passCount, warnCount, failCount, healthScore, details, recommendations };
}

async function run() {
  const clientIds = [6, 3, 4, 7, 2]; // Ethan, Niloy, Maria, Carter, Kevin
  const clientNames = { 6: 'Ethan', 3: 'Niloy', 4: 'Maria', 7: 'Carter', 2: 'Kevin' };

  for (const clientId of clientIds) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FULL WEBSITE AUDIT: ${clientNames[clientId]} (ID: ${clientId})`);
    console.log('='.repeat(60));

    const leads = await db.execute({
      sql: `SELECT l.id, l.company_name, l.website_url, l.contact_email, l.contact_phone,
                   l.contact_facebook, l.contact_instagram, l.location, l.notes
            FROM leads l
            JOIN client_leads cl ON l.id = cl.lead_id
            WHERE cl.client_id = ? AND l.website_url IS NOT NULL AND l.website_url != ''`,
      args: [clientId]
    });

    console.log(`Auditing ${leads.rows.length} websites...`);

    let totalIssues = 0;
    let audited = 0;

    for (const lead of leads.rows) {
      if (!lead.website_url) continue;

      process.stdout.write(`  ${lead.company_name} (${lead.website_url})... `);

      try {
        const { html, finalUrl, headers } = await fetchUrl(lead.website_url);
        if (!html) { console.log('SKIP (no content)'); continue; }

        const issues = auditWebsite(html, lead.website_url, headers);
        const assessment = buildAssessment(issues);

        // Build structured notes
        let notes = `Business: ${lead.company_name}\n`;
        notes += `Industry: ${(lead.notes || '').match(/Industry: ([^\n]+)/i)?.[1] || 'Unknown'}\n`;
        notes += `Website: ${lead.website_url}\n`;
        if (lead.contact_email) notes += `Email: ${lead.contact_email}\n`;
        if (lead.contact_phone) notes += `Phone: ${lead.contact_phone}\n`;
        if (lead.contact_facebook) notes += `Facebook: ${lead.contact_facebook}\n`;
        if (lead.contact_instagram) notes += `Instagram: ${lead.contact_instagram}\n`;
        if (lead.location) notes += `Location: ${lead.location}\n`;
        notes += `\n=== WEBSITE AUDIT (${assessment.healthScore}/100 health score) ===\n`;
        notes += `Platform: ${issues.platform.value} — ${issues.platform.detail}\n`;
        notes += `Results: ${assessment.passCount} pass, ${assessment.warnCount} warnings, ${assessment.failCount} critical issues\n\n`;

        notes += `CRITICAL ISSUES:\n`;
        for (const [key, val] of Object.entries(issues)) {
          if (key === 'platform') continue;
          if (val.status === 'fail') notes += `  ❌ ${val.detail}\n`;
        }

        notes += `\nWARNINGS:\n`;
        for (const [key, val] of Object.entries(issues)) {
          if (val.status === 'warn') notes += `  ⚠️ ${val.detail}\n`;
        }

        notes += `\nPASSES:\n`;
        for (const [key, val] of Object.entries(issues)) {
          if (val.status === 'pass') notes += `  ✅ ${val.detail}\n`;
        }

        notes += `\nData Completeness: ${((lead.contact_email ? 30 : 0) + (lead.contact_phone ? 20 : 0) + (lead.contact_facebook || lead.contact_instagram ? 15 : 0) + (lead.location ? 15 : 0) + 20)}%\n`;
        notes += `Lead Quality: ${lead.contact_email && lead.contact_phone ? 'Strong' : lead.contact_email || lead.contact_phone ? 'Good' : 'Weak'}\n`;
        notes += `\nOpportunity: `;
        if (assessment.recommendations.length > 0) notes += `Site needs ${assessment.recommendations.join(', ').toLowerCase()}. `;
        if (issues.platform.value === 'Squarespace' || issues.platform.value === 'Wix' || issues.platform.value === 'GoDaddy') notes += `Currently on ${issues.platform.value} — candidate for custom rebuild. `;
        notes += `Health score ${assessment.healthScore}/100.`;
        notes += `\nRecommended Services: ${assessment.recommendations.join(', ')}`;

        // Update lead notes in database
        await db.execute({
          sql: 'UPDATE leads SET notes = ? WHERE id = ?',
          args: [notes, lead.id]
        });

        totalIssues += assessment.failCount + assessment.warnCount;
        audited++;
        console.log(`Score: ${assessment.healthScore}/100 (${assessment.failCount} critical, ${assessment.warnCount} warnings)`);

        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.log(`ERROR: ${e.message}`);
      }
    }

    console.log(`\nAUDIT SUMMARY: ${audited} sites audited, avg ${audited > 0 ? Math.round(totalIssues / audited) : 0} issues per site`);
  }

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
