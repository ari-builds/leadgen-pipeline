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

CLIENT_ID = 3
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'local.db')

# Target real businesses in Dhaka that need websites
SEARCH_QUERIES = [
    # Restaurants - very likely to need website help
    "restaurant in Dhaka Bangladesh contact phone",
    "cafe coffee shop Dhaka Bangladesh phone number",
    "food delivery Dhaka Bangladesh website",
    "catering service Dhaka Bangladesh contact",
    # Healthcare - clinics often have bad websites
    "dental clinic Dhaka Bangladesh phone",
    "doctor clinic Dhaka Bangladesh contact",
    "pharmacy Dhaka Bangladesh phone number",
    "diagnostic center Dhaka Bangladesh contact",
    # Retail & shops
    "boutique shop Dhaka Bangladesh contact",
    "clothing store Dhaka Bangladesh phone",
    "electronics shop Dhaka Bangladesh contact",
    "gift shop Dhaka Bangladesh phone",
    # Services
    "salon beauty parlor Dhaka Bangladesh phone",
    "gym fitness center Dhaka Bangladesh contact",
    "photography studio Dhaka Bangladesh phone",
    "event management Dhaka Bangladesh contact",
    # Professional services
    "law firm Dhaka Bangladesh contact",
    "accounting firm Dhaka Bangladesh phone",
    "real estate agent Dhaka Bangladesh contact",
    "travel agency Dhaka Bangladesh phone",
    # Education
    "coaching center Dhaka Bangladesh contact",
    "tuition center Dhaka Bangladesh phone",
    "training institute Dhaka Bangladesh contact",
    # Construction & home
    "interior design Dhaka Bangladesh contact",
    "construction company Dhaka Bangladesh phone",
    "plumbing service Dhaka Bangladesh contact",
    "electrical service Dhaka Bangladesh phone",
]

SKIP_DOMAINS = [
    'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
    'youtube.com', 'wikipedia.org', 'google.com', 'amazon.com', 'github.com',
    'reddit.com', 'pinterest.com', 'tiktok.com', 'tripadvisor.com',
    'zomato.com', 'google.com/maps', 'bing.com', 'yahoo.com',
    'yellowpages.com', 'yelp.com', 'bbb.org', 'angieslist.com',
    'businesslist.com.bd', 'dubai.com', 'expatriates.com',
    'justdial.com', 'sulekha.com', 'indiamart.com',
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

def scrape_business(url, timeout=10):
    """Scrape a business website for contact info and social links."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        }
        resp = requests.get(url, headers=headers, timeout=timeout, verify=False)
        if resp.status_code != 200:
            return None
        
        html = resp.text
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        
        # Company name from title or h1
        title_tag = soup.find('title')
        company_name = title_tag.get_text(strip=True) if title_tag else ''
        h1 = soup.find('h1')
        if h1:
            company_name = h1.get_text(strip=True)[:200]
        
        # Clean company name
        company_name = re.split(r'\s*[-|–]\s*', company_name)[0].strip()
        if not company_name or len(company_name) < 3:
            company_name = urlparse(url).netloc.replace('www.', '').split('.')[0].title()
        
        # Extract emails
        emails = list(set(re.findall(
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            html
        )))
        # Filter out common junk emails
        emails = [e for e in emails if not any(x in e.lower() for x in ['sentry', 'example', 'test', 'noreply', 'no-reply', '.png', '.jpg', '.gif'])]
        
        # Extract phones (Bangladesh format)
        phones = []
        for pattern in [
            r'(?:\+?880|01[3-9]\d)[-\s]?\d{3,4}[-\s]?\d{4}',
            r'\+880\d{10}',
            r'01[3-9]\d{8}',
        ]:
            phones.extend(re.findall(pattern, text))
        phones = list(set(phones))
        
        # Extract social links
        socials = {}
        social_patterns = {
            'facebook': r'https?://(?:www\.)?facebook\.com/[^\s"\'<>]+',
            'instagram': r'https?://(?:www\.)?instagram\.com/[^\s"\'<>]+',
            'twitter': r'https?://(?:www\.)?(?:twitter|x)\.com/[^\s"\'<>]+',
            'linkedin': r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[^\s"\'<>]+',
            'youtube': r'https?://(?:www\.)?youtube\.com/(?:c/|channel/|@)[^\s"\'<>]+',
        }
        for platform, pattern in social_patterns.items():
            matches = re.findall(pattern, html, re.IGNORECASE)
            if matches:
                socials[platform] = matches[0].split('"')[0].split("'")[0].split('<')[0].rstrip('/')
        
        # Detect industry
        industry = guess_industry(text + ' ' + company_name)
        
        # Score based on contact quality
        score = 5
        if emails: score += 2
        if phones: score += 2
        if socials: score += 1
        if len(socials) >= 2: score += 1
        score = min(10, score)
        
        return {
            'company_name': company_name[:200],
            'website': url,
            'industry': industry,
            'location': 'Dhaka, Bangladesh',
            'contact_email': emails[0] if emails else None,
            'contact_phone': phones[0] if phones else None,
            'contact_facebook': socials.get('facebook'),
            'contact_instagram': socials.get('instagram'),
            'contact_twitter': socials.get('twitter'),
            'contact_linkedin': socials.get('linkedin'),
            'score': score,
            'notes': f"Emails: {', '.join(emails[:3])} | Phones: {', '.join(phones[:3])} | Social: {', '.join(socials.keys())}",
        }
    except Exception as e:
        return None

def guess_industry(text):
    text_lower = text.lower()
    industries = {
        'Restaurant': ['restaurant', 'food', 'cafe', 'dining', 'cuisine', 'menu', 'kitchen', 'bakery', 'catering'],
        'Healthcare': ['clinic', 'hospital', 'doctor', 'medical', 'health', 'dental', 'pharmacy', 'diagnostic'],
        'Retail': ['shop', 'store', 'retail', 'boutique', 'fashion', 'clothing', 'electronics', 'gift'],
        'Real Estate': ['real estate', 'property', 'housing', 'apartment', 'realty'],
        'Education': ['school', 'college', 'university', 'education', 'academy', 'training', 'coaching', 'tuition'],
        'Beauty & Salon': ['salon', 'spa', 'beauty', 'cosmetic', 'hair', 'parlor'],
        'Fitness': ['gym', 'fitness', 'yoga', 'health club'],
        'Professional Services': ['law', 'legal', 'attorney', 'accounting', 'consulting', 'finance'],
        'Technology': ['software', 'tech', 'IT', 'digital', 'web development'],
        'Construction': ['construction', 'builder', 'contractor', 'interior', 'plumbing', 'electrical'],
        'Travel': ['travel', 'tour', 'agency', 'ticket', 'visa'],
        'Photography': ['photography', 'studio', 'photo', 'video'],
        'Events': ['event', 'management', 'wedding', 'party', 'planning'],
    }
    for industry, keywords in industries.items():
        for kw in keywords:
            if kw in text_lower:
                return industry
    return 'General Business'

def main():
    all_leads = []
    seen_domains = set()
    
    print(f"Scraping real businesses in Dhaka for client Niloy (ID: {CLIENT_ID})")
    print(f"Target: 50 leads with contact info\n")
    
    for i, query in enumerate(SEARCH_QUERIES):
        if len(all_leads) >= 55:
            break
        
        print(f"[{i+1}/{len(SEARCH_QUERIES)}] {query}")
        results = search_leads(query, max_results=10)
        
        for r in results:
            if len(all_leads) >= 55:
                break
            
            url = r['url']
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace('www.', '')
            
            if domain in seen_domains:
                continue
            seen_domains.add(domain)
            
            # Skip non-business domains
            if any(x in domain for x in ['.gov.bd', '.edu', '.org', 'wikipedia', 'youtube', 'facebook']):
                continue
            
            print(f"  Scraping: {domain[:50]}...", end=' ')
            lead = scrape_business(url)
            
            if lead and lead['company_name']:
                all_leads.append(lead)
                has_contact = bool(lead['contact_email'] or lead['contact_phone'] or lead['contact_facebook'])
                print(f"OK ({lead['industry']}, score:{lead['score']}, {'HAS CONTACT' if has_contact else 'NO CONTACT'})")
            else:
                print("SKIP")
            
            time.sleep(0.3)
        
        time.sleep(0.5)
    
    # Sort by score, prioritize those with contact info
    all_leads.sort(key=lambda x: (bool(x['contact_email'] or x['contact_phone'] or x['contact_facebook']), x['score']), reverse=True)
    top_leads = all_leads[:50]
    
    # Stats
    with_email = sum(1 for l in top_leads if l['contact_email'])
    with_phone = sum(1 for l in top_leads if l['contact_phone'])
    with_social = sum(1 for l in top_leads if l.get('contact_facebook') or l.get('contact_instagram'))
    industries = {}
    for l in top_leads:
        industries[l['industry']] = industries.get(l['industry'], 0) + 1
    
    print(f"\n{'='*60}")
    print(f"Total scraped: {len(all_leads)}")
    print(f"Top 50 selected")
    print(f"With email: {with_email}")
    print(f"With phone: {with_phone}")
    print(f"With social: {with_social}")
    print(f"\nIndustries:")
    for ind, cnt in sorted(industries.items(), key=lambda x: -x[1]):
        print(f"  {ind}: {cnt}")
    
    # Save to JSON
    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'niloy-leads-v2.json'), 'w', encoding='utf-8') as f:
        json.dump(top_leads, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to scripts/niloy-leads-v2.json")
    
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
            """, (CLIENT_ID, lead_id))
            
            imported += 1
        except Exception as e:
            print(f"  Import error: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\nImported {imported} leads to database for client {CLIENT_ID}")

if __name__ == '__main__':
    main()
