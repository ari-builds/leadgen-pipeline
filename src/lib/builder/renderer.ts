import fs from 'fs';
import path from 'path';

export interface BusinessConfig {
  businessName: string;
  tagline?: string;
  description?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  heroImage?: string;
  services?: { title: string; description: string }[];
  features?: { title: string; description: string }[];
  testimonials?: { text: string; name: string; title?: string }[];
}

interface IndustryTheme {
  primary: string;
  primaryHex: string;
  primaryHexDark: string;
  primaryHexLight: string;
  neutral: string;
  accent: string;
  headingFont: string;
  bodyFont: string;
  icon: string;
  defaultServices: { title: string; description: string }[];
  defaultFeatures: { title: string; description: string }[];
}

const themes: Record<string, IndustryTheme> = {
  professional: {
    primary: 'blue-600', primaryHex: '#2563eb', primaryHexDark: '#1d4ed8', primaryHexLight: '#dbeafe',
    neutral: 'slate', accent: 'indigo-500',
    headingFont: 'DM+Sans', bodyFont: 'DM+Sans',
    icon: '🏢',
    defaultServices: [
      { title: 'Professional Consultation', description: 'Expert advice tailored to your unique needs and goals.' },
      { title: 'Strategic Planning', description: 'Comprehensive strategies designed to drive measurable results.' },
      { title: 'Ongoing Support', description: 'Dedicated support to ensure your continued success and growth.' },
    ],
    defaultFeatures: [
      { title: 'Expert Team', description: 'Years of combined experience serving our community.' },
      { title: 'Proven Results', description: 'Track record of delivering exceptional outcomes for our clients.' },
      { title: 'Client Focused', description: 'Your success is our priority. We put our clients first.' },
    ],
  },
  restaurant: {
    primary: 'red-600', primaryHex: '#dc2626', primaryHexDark: '#b91c1c', primaryHexLight: '#fee2e2',
    neutral: 'stone', accent: 'amber-500',
    headingFont: 'Playfair+Display', bodyFont: 'Source+Sans+3',
    icon: '🍽️',
    defaultServices: [
      { title: 'Dine In', description: 'Enjoy our carefully crafted dishes in a warm, inviting atmosphere.' },
      { title: 'Takeout', description: 'Same great food, ready when you are. Order ahead for quick pickup.' },
      { title: 'Catering', description: 'Let us cater your next event with our delicious menu options.' },
    ],
    defaultFeatures: [
      { title: 'Fresh Ingredients', description: 'We source the finest local and seasonal ingredients.' },
      { title: 'Family Recipe', description: 'Generations of tradition in every dish we serve.' },
      { title: 'Cozy Atmosphere', description: 'The perfect setting for any occasion.' },
    ],
  },
  health: {
    primary: 'emerald-600', primaryHex: '#059669', primaryHexDark: '#047857', primaryHexLight: '#d1fae5',
    neutral: 'slate', accent: 'teal-500',
    headingFont: 'Nunito', bodyFont: 'Nunito+Sans',
    icon: '💚',
    defaultServices: [
      { title: 'Wellness Services', description: 'Comprehensive wellness programs designed for your health goals.' },
      { title: 'Expert Care', description: 'Professional, compassionate care from certified practitioners.' },
      { title: 'Wellness Plans', description: 'Personalized plans to help you achieve optimal health.' },
    ],
    defaultFeatures: [
      { title: 'Holistic Approach', description: 'We treat the whole person, not just symptoms.' },
      { title: 'Certified Professionals', description: 'Our team brings expertise and compassion to every visit.' },
      { title: 'Modern Facility', description: 'State-of-the-art equipment in a comfortable setting.' },
    ],
  },
  tech: {
    primary: 'indigo-600', primaryHex: '#4f46e5', primaryHexDark: '#4338ca', primaryHexLight: '#e0e7ff',
    neutral: 'slate', accent: 'purple-600',
    headingFont: 'Sora', bodyFont: 'Inter+Tight',
    icon: '💻',
    defaultServices: [
      { title: 'Software Development', description: 'Custom solutions built with modern technologies.' },
      { title: 'IT Consulting', description: 'Expert guidance on technology strategy and implementation.' },
      { title: 'Technical Support', description: 'Reliable support to keep your systems running smoothly.' },
    ],
    defaultFeatures: [
      { title: 'Innovation First', description: 'Cutting-edge solutions for modern challenges.' },
      { title: 'Reliable Delivery', description: 'On-time, on-budget project delivery every time.' },
      { title: 'Expert Team', description: 'Seasoned professionals passionate about technology.' },
    ],
  },
  creative: {
    primary: 'violet-600', primaryHex: '#7c3aed', primaryHexDark: '#6d28d9', primaryHexLight: '#ede9fe',
    neutral: 'zinc', accent: 'pink-500',
    headingFont: 'Space+Grotesk', bodyFont: 'Outfit',
    icon: '🎨',
    defaultServices: [
      { title: 'Brand Design', description: 'Visual identities that tell your unique story.' },
      { title: 'Content Creation', description: 'Engaging content that connects with your audience.' },
      { title: 'Creative Direction', description: 'Strategic creative vision for your projects.' },
    ],
    defaultFeatures: [
      { title: 'Creative Excellence', description: 'Bold, original work that stands out.' },
      { title: 'Collaborative Process', description: 'We work closely with you to bring your vision to life.' },
      { title: 'Attention to Detail', description: 'Every pixel, every word, every detail matters.' },
    ],
  },
  home_services: {
    primary: 'orange-600', primaryHex: '#ea580c', primaryHexDark: '#c2410c', primaryHexLight: '#ffedd5',
    neutral: 'stone', accent: 'amber-500',
    headingFont: 'DM+Sans', bodyFont: 'DM+Sans',
    icon: '🔧',
    defaultServices: [
      { title: 'Repair & Maintenance', description: 'Reliable repairs and regular maintenance to keep everything running.' },
      { title: 'Installation', description: 'Professional installation of fixtures, appliances, and systems.' },
      { title: 'Emergency Service', description: 'Fast response when you need it most. Available for urgent needs.' },
    ],
    defaultFeatures: [
      { title: 'Licensed & Insured', description: 'Fully licensed and insured for your peace of mind.' },
      { title: 'Same-Day Service', description: 'Most jobs scheduled within 24 hours of your call.' },
      { title: 'Satisfaction Guaranteed', description: 'We stand behind every job, big or small.' },
    ],
  },
};

function detectIndustry(category: string): string {
  const cat = (category || '').toLowerCase();
  if (/restaurant|cafe|bakery|food|dining|pizza|bar|grill|kitchen|catering/i.test(cat)) return 'restaurant';
  if (/health|wellness|fitness|yoga|spa|medical|dental|doctor|therapy|massage|nutrition/i.test(cat)) return 'health';
  if (/tech|software|saas|it |computer|developer|digital|app|startup|web/i.test(cat)) return 'tech';
  if (/creative|design|photo|video|studio|artist|agency|marketing|brand/i.test(cat)) return 'creative';
  if (/plumber|electrician|hvac|contractor|roofing|landscap|cleaning|handyman|pest|home|repair|construction|painter|remodel/i.test(cat)) return 'home_services';
  return 'professional';
}

function renderCard(title: string, desc: string, icon: string): string {
  return `<div class="card"><div class="w-12 h-12 rounded-lg bg-brand flex items-center justify-center text-white text-xl">${icon}</div><h3 class="mt-6 text-lg font-semibold text-slate-900">${title}</h3><p class="mt-2 text-slate-600">${desc}</p></div>`;
}

function renderTestimonial(text: string, name: string, title: string | undefined): string {
  const initial = name.charAt(0);
  return `<div class="card"><p class="text-slate-700 italic">"${text}"</p><div class="mt-6 flex items-center gap-x-4"><div class="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-semibold text-sm">${initial}</div><div><p class="text-sm font-semibold text-slate-900">${name}</p>${title ? `<p class="text-sm text-slate-500">${title}</p>` : ''}</div></div></div>`;
}

const serviceIcons = ['✨', '⭐', '💎', '🔧', '🛠️', '📋', '🎯', '🏆'];
const featureIcons = ['👍', '💪', '❤️', '✅', '🌟', '📈', '🎉', '🔥'];

export function renderSite(config: BusinessConfig): string {
  const templatePath = path.join(process.cwd(), 'scripts', 'builder-templates', 'base.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  const theme = themes[detectIndustry(config.category || config.tagline || '')];
  const services = config.services && config.services.length >= 3 ? config.services : theme.defaultServices;
  const features = config.features && config.features.length >= 3 ? config.features : theme.defaultFeatures;
  const testimonials = config.testimonials || [
    { text: `Amazing service from ${config.businessName}. They went above and beyond our expectations!`, name: 'Sarah Johnson', title: 'Happy Customer' },
    { text: `Professional, reliable, and truly cares about their clients. Highly recommend!`, name: 'Michael Chen', title: 'Satisfied Client' },
    { text: `The best decision we made was choosing ${config.businessName}. Outstanding results!`, name: 'Emily Rodriguez', title: 'Loyal Customer' },
  ];

  const tagline = config.tagline || `Your Trusted ${config.category || 'Professional'} Service`;
  const description = config.description || `${config.businessName} - ${tagline}. We provide professional, reliable services to our community.`;
  const heroImage = config.heroImage || `https://placehold.co/1200x600/${theme.primaryHexLight}/${theme.primaryHex}?text=${encodeURIComponent(config.businessName)}`;

  const servicesCards = services.map((s, i) => renderCard(s.title, s.description, serviceIcons[i % serviceIcons.length])).join('\n          ');
  const aboutCards = features.map((f, i) => renderCard(f.title, f.description, featureIcons[i % featureIcons.length])).join('\n          ');
  const testimonialCards = testimonials.map(t => renderTestimonial(t.text, t.name, t.title)).join('\n          ');

  const year = new Date().getFullYear();

  const replacements: Record<string, string> = {
    '{{BUSINESS_NAME}}': config.businessName,
    '{{TAGLINE}}': tagline,
    '{{DESCRIPTION}}': description,
    '{{KEYWORDS}}': `${config.businessName}, ${config.category || 'services'}, ${tagline}`,
    '{{PHONE}}': config.phone || '(555) 123-4567',
    '{{EMAIL}}': config.email || 'info@example.com',
    '{{ADDRESS}}': config.address || '123 Main Street, Your City, ST 12345',
    '{{HOURS}}': config.hours || 'Mon-Fri: 9AM-5PM',
    '{{PRIMARY_HEX}}': theme.primaryHex,
    '{{PRIMARY_HEX_DARK}}': theme.primaryHexDark,
    '{{PRIMARY_HEX_LIGHT}}': theme.primaryHexLight,
    '{{HEADING_FONT}}': theme.headingFont,
    '{{BODY_FONT}}': theme.bodyFont,
    '{{ICON}}': theme.icon,
    '{{SITE_URL}}': '#',
    '{{HERO_IMAGE}}': heroImage,
    '{{HERO_HEADLINE}}': `Welcome to ${config.businessName}`,
    '{{HERO_SUBTEXT}}': description,
    '{{SERVICES_INTRO}}': `Explore our range of professional services designed to meet your needs.`,
    '{{SERVICES_CARDS}}': servicesCards,
    '{{ABOUT_INTRO}}': 'We are dedicated to providing exceptional service and building lasting relationships with our clients.',
    '{{ABOUT_CARDS}}': aboutCards,
    '{{TESTIMONIALS_INTRO}}': `Don't just take our word for it — hear from our satisfied clients.`,
    '{{TESTIMONIALS_CARDS}}': testimonialCards,
    '{{CTA_HEADLINE}}': 'Ready to Get Started?',
    '{{CTA_SUBTEXT}}': `Contact ${config.businessName} today and let us help you.`,
    '{{CTA_BUTTON}}': 'Contact Us Today',
    '{{CONTACT_INTRO}}': `We'd love to hear from you. Reach out to ${config.businessName} using the information below.`,
    '{{YEAR}}': year.toString(),
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return html;
}

export { detectIndustry, themes };
