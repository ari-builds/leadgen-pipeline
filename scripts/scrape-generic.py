import sys
import json
import time
import re
import sqlite3
import os
from urllib.parse import urlparse

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'local.db')

SKIP_DOMAINS = [
    'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
    'youtube.com', 'wikipedia.org', 'google.com', 'amazon.com', 'github.com',
    'reddit.com', 'pinterest.com', 'tiktok.com', 'yelp.com', 'bbb.org',
    'yellowpages.com', 'angieslist.com', 'angi.com', 'thumbtack.com',
    'homeadvisor.com', 'mapquest.com', 'bing.com', 'yahoo.com',
    'apple.com', 'microsoft.com', 'glassdoor.com', 'indeed.com',
    'craigslist.org', 'nextdoor.com', 'foursquare.com', 'tripadvisor.com',
    'opentable.com', 'grubhub.com', 'doordash.com', 'ubereats.com',
    'shutterstock.com', 'istockphoto.com', 'adobe.com', 'canva.com',
    'wix.com', 'squarespace.com', 'wordpress.com', 'shopify.com',
    'godaddy.com', 'namecheap.com', 'cloudflare.com',
]

# Fake/template email patterns - NEVER include these
FAKE_EMAIL_PATTERNS = [
    'noreply', 'no-reply', 'donotreply', 'do-not-reply',
    'sentry', 'example', 'test', 'user@', 'you@', 'admin@localhost',
    '.png', '.jpg', '.gif', '.webp', '.svg', '.ico',
    'sentry.io', 'w3.org', 'schema.org', 'googleapis.com',
    'placeholder', 'email@example', 'name@domain',
    'webmaster', 'postmaster', 'hostmaster', 'abuse@',
    'unsubscribe', 'bounce', 'feedback',
]

# Page title patterns that indicate article/list pages, not businesses
ARTICLE_PATTERNS = [
    r'^\d+\s+best\b', r'^top\s+\d+', r'^how\s+to\b', r'^\d+\s+signs\b',
    r'^\d+\s+reasons\b', r'^what\s+to\s+look\b', r'^guide\b',
    r'examples?\s*$', r'inspiration\s*$', r'compared\s*$',
    r'\d+\s+tips\b', r'tutorial\b', r'learn\s+how\b',
    r'blog\b', r'article\b', r'news\b',
]

# SaaS/product patterns - not local businesses
SAAS_PATTERNS = [
    r'software\b', r'platform\b', r'app\b', r'booking\s+system\b',
    r'management\s+system\b', r'crm\b', r'automation\b', r'ai\s+powered\b',
    r'get\s+started\b', r'sign\s+up\b', r'free\s+trial\b', r'pricing\b',
    r'integration\b', r'enterprise\b', r'scalable\b',
]

# Competitor patterns - web design/marketing agencies
COMPETITOR_PATTERNS = [
    r'web\s+design\b', r'website\s+design\b', r'digital\s+marketing\b',
    r'seo\s+(?:company|service|agency)\b', r'marketing\s+agency\b',
    r'branding\s+(?:agency|studio)\b', r'creative\s+agency\b',
]

# Non-business platforms
NON_BUSINESS_PATTERNS = [
    r'flipkart', r'amazon', r'ebay', r'walmart', r'target',
    r'verizon', r'att\b', r't-mobile', r'comcast', r'at&t',
    r'nextiva', r'ringcentral', r'grasshopper',
    r'indeed\.com', r'glassdoor', r'linkedin\.com/company',
    r'marketing360', r'hubspot', r'mailchimp', r'constant\s*contact',
    r'google\s+my\s+business', r'yelp\b', r'tripadvisor',
]


def search_leads(query, max_results=15):
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                url = r.get('href', r.get('link', ''))
                domain = urlparse(url).netloc.lower().replace('www.', '')
                if not any(sd in domain for sd in SKIP_DOMAINS):
                    results.append({
                        'title': r.get('title', ''),
                        'url': url,
                        'snippet': r.get('body', r.get('snippet', '')),
                    })
    except Exception as e:
        print(f"  Search error: {e}")
    return results


def is_valid_email(email, html_context=''):
    """Check if email is likely real, not fake/template"""
    email_lower = email.lower()
    
    # Check fake patterns
    for pattern in FAKE_EMAIL_PATTERNS:
        if pattern in email_lower:
            return False
    
    # Check it's a real domain (not image files, etc.)
    domain = email.split('@')[1] if '@' in email else ''
    if not domain or '.' not in domain:
        return False
    tld = domain.split('.')[-1]
    if tld not in ['com', 'net', 'org', 'io', 'co', 'us', 'uk', 'ca', 'au', 'in', 'bd', 'dev', 'info', 'biz', 'me', 'xyz']:
        return False
    
    # Check it doesn't look like a CSS/image reference
    if re.match(r'^[a-z0-9_-]+\.(png|jpg|gif|webp|svg|ico|css|js)$', email_lower):
        return False
    
    return True


def is_valid_phone(phone):
    """Check if phone number looks real"""
    digits = re.sub(r'\D', '', phone)
    # US/Canada: 10-11 digits, Bangladesh: 11-14 digits
    if len(digits) < 10 or len(digits) > 15:
        return False
    # Not all zeros or repeating
    if len(set(digits)) <= 2:
        return False
    return True


def extract_business_name(soup, url):
    """Extract the actual business name, not a page title"""
    domain = urlparse(url).netloc.replace('www.', '').split('.')[0].title()
    
    # Try structured data first (most reliable)
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, list):
                data = data[0]
            if isinstance(data, dict):
                name = data.get('name', '')
                if name and 3 < len(name) < 100:
                    return name.strip()
                org = data.get('organization', {})
                if isinstance(org, dict):
                    name = org.get('name', '')
                    if name and 3 < len(name) < 100:
                        return name.strip()
        except:
            pass
    
    # Try meta tags
    og_site = soup.find('meta', property='og:site_name')
    if og_site and og_site.get('content'):
        name = og_site['content'].strip()
        if name and 3 < len(name) < 100:
            return name
    
    # Try <title> but clean it aggressively
    title_tag = soup.find('title')
    if title_tag:
        title = title_tag.get_text(strip=True)
        # Remove common suffixes
        for sep in [' - ', ' | ', ' – ', ' — ', ' :: ', ' // ']:
            if sep in title:
                title = title.split(sep)[0].strip()
        # Remove common prefixes
        for prefix in ['Welcome to ', 'Home - ', 'Home | ']:
            if title.lower().startswith(prefix.lower()):
                title = title[len(prefix):].strip()
        # Only use if it looks like a business name (not too long, not an article)
        if 3 < len(title) < 80 and not any(re.search(p, title.lower()) for p in ARTICLE_PATTERNS):
            return title
    
    # Try h1 but be very selective
    h1 = soup.find('h1')
    if h1:
        h1_text = h1.get_text(strip=True)[:100]
        # Only use if it looks like a name, not a sentence
        if 3 < len(h1_text) < 60 and not any(re.search(p, h1_text.lower()) for p in ARTICLE_PATTERNS):
            words = h1_text.split()
            if len(words) <= 8:  # Business names are usually short
                return h1_text
    
    # Fallback to domain name
    return domain


def scrape_business(url, timeout=10):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        resp = requests.get(url, headers=headers, timeout=timeout, verify=False)
        if resp.status_code != 200:
            return None
        
        html = resp.text
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        
        # Extract business name properly
        company_name = extract_business_name(soup, url)
        
        # Validate it's not an article/SaaS/competitor page
        name_lower = company_name.lower()
        for pattern in ARTICLE_PATTERNS + SAAS_PATTERNS + COMPETITOR_PATTERNS + NON_BUSINESS_PATTERNS:
            if re.search(pattern, name_lower):
                return None
        
        # Extract emails - only from contact/about sections, not anywhere in HTML
        emails = set()
        # Look in contact sections specifically
        for el in soup.find_all(['a', 'span', 'p', 'div', 'td']):
            text_content = el.get_text(strip=True)
            found = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text_content)
            for e in found:
                if is_valid_email(e):
                    emails.add(e.lower())
        # Also check mailto links
        for a in soup.find_all('a', href=True):
            if a['href'].startswith('mailto:'):
                email = a['href'].replace('mailto:', '').split('?')[0].strip()
                if is_valid_email(email):
                    emails.add(email.lower())
        emails = list(emails)
        
        # Extract phones - from text, not HTML attributes
        phones = []
        for pattern in [
            r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'(?:\+?880|01[3-9]\d)[-\s]?\d{3,4}[-\s]?\d{4}',
        ]:
            found = re.findall(pattern, text)
            for p in found:
                if is_valid_phone(p):
                    phones.append(p)
        phones = list(set(phones))
        
        # Extract social media URLs
        socials = {}
        social_patterns = {
            'facebook': r'https?://(?:www\.)?facebook\.com/[^\s"\'<>]+',
            'instagram': r'https?://(?:www\.)?instagram\.com/[^\s"\'<>]+',
            'twitter': r'https?://(?:www\.)?(?:twitter|x)\.com/[^\s"\'<>]+',
            'linkedin': r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[^\s"\'<>]+',
            'youtube': r'https?://(?:www\.)?youtube\.com/(?:c/|channel/|@)[^\s"\'<>]+',
            'tiktok': r'https?://(?:www\.)?tiktok\.com/@[^\s"\'<>]+',
        }
        for platform, pattern in social_patterns.items():
            matches = re.findall(pattern, html, re.IGNORECASE)
            if matches:
                url_clean = matches[0].split('"')[0].split("'")[0].split('<')[0].rstrip('/')
                # Validate it's a real profile URL, not a share button
                if '/share' not in url_clean and '/login' not in url_clean:
                    socials[platform] = url_clean
        
        # Check for social media mentions in text (without URLs)
        social_mentions = set()
        text_lower = text.lower()
        for platform in ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube']:
            if platform in text_lower and platform not in socials:
                social_mentions.add(platform)
        
        # Determine industry
        industry = guess_industry(text + ' ' + company_name)
        
        # Calculate data completeness score (0-10)
        # Based on: name + email + phone + website + location + social media
        score = 3  # Base score for having a website
        if company_name and len(company_name) > 3: score += 1
        if emails: score += 2
        if phones: score += 2
        if socials: score += 1
        if len(socials) >= 2: score += 1
        score = min(10, score)
        
        # Build notes with specific context
        notes_parts = []
        notes_parts.append(f"Business: {company_name}")
        notes_parts.append(f"Website: {url}")
        if emails:
            notes_parts.append(f"Contact email: {', '.join(emails[:2])}")
        if phones:
            notes_parts.append(f"Phone: {', '.join(phones[:2])}")
        if socials:
            social_list = []
            for platform, social_url in socials.items():
                social_list.append(f"{platform}: {social_url}")
            notes_parts.append(f"Social media: {', '.join(social_list)}")
        if social_mentions:
            notes_parts.append(f"Mentioned on: {', '.join(social_mentions)} (no profile URL found)")
        
        # Industry-specific context
        notes_parts.append(f"Industry: {industry}")
        notes_parts.append(f"Source: {urlparse(url).netloc}")
        
        return {
            'company_name': company_name[:200],
            'website': url,
            'industry': industry,
            'contact_email': emails[0] if emails else None,
            'contact_phone': phones[0] if phones else None,
            'contact_facebook': socials.get('facebook'),
            'contact_instagram': socials.get('instagram'),
            'contact_twitter': socials.get('twitter'),
            'contact_linkedin': socials.get('linkedin'),
            'score': score,
            'notes': '\n'.join(notes_parts),
            'location': '',  # Will be set from query
        }
    except Exception as e:
        print(f"  Error: {e}")
        return None


def guess_industry(text):
    text_lower = text.lower()
    industries = {
        'Restaurant': ['restaurant', 'food', 'cafe', 'dining', 'cuisine', 'menu', 'kitchen', 'bakery', 'catering', 'pizza', 'burger', 'sushi', 'taco'],
        'Healthcare': ['clinic', 'hospital', 'doctor', 'medical', 'health', 'dental', 'pharmacy', 'diagnostic', 'chiropractic', 'veterinary', 'vet'],
        'Retail': ['shop', 'store', 'retail', 'boutique', 'fashion', 'clothing', 'electronics', 'gift'],
        'Real Estate': ['real estate', 'property', 'housing', 'apartment', 'realty', 'realtor'],
        'Beauty & Salon': ['salon', 'spa', 'beauty', 'cosmetic', 'hair', 'barber', 'nail'],
        'Fitness': ['gym', 'fitness', 'yoga', 'health club', 'personal trainer'],
        'Home Services': ['plumbing', 'electrical', 'hvac', 'roofing', 'landscaping', 'cleaning', 'pest control', 'moving'],
        'Auto': ['auto repair', 'auto shop', 'car wash', 'mechanic', 'automotive'],
        'Professional Services': ['law', 'legal', 'attorney', 'accounting', 'consulting', 'insurance', 'financial'],
        'Education': ['school', 'college', 'training', 'coaching', 'academy', 'tutoring'],
        'Construction': ['construction', 'builder', 'contractor', 'interior design'],
        'Events': ['event', 'wedding', 'party', 'photography', 'catering'],
    }
    for industry, keywords in industries.items():
        for kw in keywords:
            if kw in text_lower:
                return industry
    return 'General Business'


def main():
    if len(sys.argv) < 4:
        print("Usage: python scrape-generic.py <client_id> <location> <query1> <query2> ...")
        sys.exit(1)
    
    client_id = int(sys.argv[1])
    location = sys.argv[2]
    queries = sys.argv[3:]
    
    all_leads = []
    seen_domains = set()
    
    print(f"Scraping for client {client_id} in {location}")
    print(f"Queries: {len(queries)}")
    print(f"Target: 100 leads\n")
    
    for i, query in enumerate(queries):
        if len(all_leads) >= 110:
            break
        
        print(f"[{i+1}/{len(queries)}] {query}")
        results = search_leads(query, max_results=12)
        
        for r in results:
            if len(all_leads) >= 110:
                break
            
            url = r['url']
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace('www.', '')
            
            if domain in seen_domains:
                continue
            seen_domains.add(domain)
            
            if any(x in domain for x in ['.gov', '.edu', '.org', 'wikipedia', 'youtube', 'facebook']):
                continue
            
            print(f"  Scraping: {domain[:50]}...", end=' ')
            lead = scrape_business(url)
            
            if lead and lead['company_name']:
                # Final validation: must have at least one contact method
                has_contact = bool(lead['contact_email'] or lead['contact_phone'] or lead['contact_facebook'] or lead['contact_instagram'])
                if not has_contact:
                    print("SKIP (no contact)")
                    continue
                
                # Set location from query
                lead['location'] = location
                
                all_leads.append(lead)
                print(f"OK ({lead['industry']}, score:{lead['score']})")
            else:
                print("SKIP")
            
            time.sleep(0.3)
        
        time.sleep(0.5)
    
    # Sort by contact quality then score
    all_leads.sort(key=lambda x: (bool(x['contact_email'] or x['contact_phone'] or x['contact_facebook']), x['score']), reverse=True)
    top_leads = all_leads[:100]
    
    # Stats
    with_email = sum(1 for l in top_leads if l['contact_email'])
    with_phone = sum(1 for l in top_leads if l['contact_phone'])
    with_social = sum(1 for l in top_leads if l.get('contact_facebook') or l.get('contact_instagram'))
    industries = {}
    for l in top_leads:
        industries[l['industry']] = industries.get(l['industry'], 0) + 1
    
    print(f"\n{'='*60}")
    print(f"Total scraped: {len(all_leads)}")
    print(f"Top {len(top_leads)} selected")
    print(f"With email: {with_email}")
    print(f"With phone: {with_phone}")
    print(f"With social: {with_social}")
    print(f"\nIndustries:")
    for ind, cnt in sorted(industries.items(), key=lambda x: -x[1]):
        print(f"  {ind}: {cnt}")
    
    # Import to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    imported = 0
    for lead in top_leads:
        try:
            cursor.execute("""
                INSERT INTO leads (company_name, website_url, industry, location, score, notes,
                    contact_email, contact_phone, contact_facebook, contact_instagram,
                    contact_twitter, contact_linkedin, source_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                lead['company_name'][:200],
                lead['website'],
                lead['industry'],
                lead['location'],
                lead['score'],
                lead.get('notes', ''),
                lead.get('contact_email'),
                lead.get('contact_phone'),
                lead.get('contact_facebook'),
                lead.get('contact_instagram'),
                lead.get('contact_twitter'),
                lead.get('contact_linkedin'),
                lead['website'],
            ))
            lead_id = cursor.lastrowid
            
            cursor.execute("""
                INSERT INTO client_leads (client_id, lead_id, assigned_at)
                VALUES (?, ?, datetime('now'))
            """, (client_id, lead_id))
            
            imported += 1
        except Exception as e:
            print(f"  Import error: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\nImported {imported} leads to database for client {client_id}")

if __name__ == '__main__':
    main()
