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
        
        title_tag = soup.find('title')
        company_name = title_tag.get_text(strip=True) if title_tag else ''
        h1 = soup.find('h1')
        if h1:
            company_name = h1.get_text(strip=True)[:200]
        
        company_name = re.split(r'\s*[-|–]\s*', company_name)[0].strip()
        if not company_name or len(company_name) < 3:
            company_name = urlparse(url).netloc.replace('www.', '').split('.')[0].title()
        
        emails = list(set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)))
        emails = [e for e in emails if not any(x in e.lower() for x in ['sentry', 'example', 'test', 'noreply', 'no-reply', '.png', '.jpg', '.gif'])]
        
        phones = []
        for pattern in [
            r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'(?:\+?880|01[3-9]\d)[-\s]?\d{3,4}[-\s]?\d{4}',
            r'\+1\d{10}',
        ]:
            phones.extend(re.findall(pattern, text))
        phones = list(set(phones))
        
        socials = {}
        social_patterns = {
            'facebook': r'https?://(?:www\.)?facebook\.com/[^\s"\'<>]+',
            'instagram': r'https?://(?:www\.)?instagram\.com/[^\s"\'<>]+',
            'twitter': r'https?://(?:www\.)?(?:twitter|x)\.com/[^\s"\'<>]+',
            'linkedin': r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[^\s"\'<>]+',
            'youtube': r'https?://(?:www\.)?youtube\.com/(?:c/|channel/|@)[^\s"\'<>]+',
            'tiktok': r'https?://(?:www\.)?tiktok\.com/@[^\s"\'<>]+',
            'yelp': r'https?://(?:www\.)?yelp\.com/biz/[^\s"\'<>]+',
        }
        for platform, pattern in social_patterns.items():
            matches = re.findall(pattern, html, re.IGNORECASE)
            if matches:
                socials[platform] = matches[0].split('"')[0].split("'")[0].split('<')[0].rstrip('/')
        
        industry = guess_industry(text + ' ' + company_name)
        
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
            'contact_email': emails[0] if emails else None,
            'contact_phone': phones[0] if phones else None,
            'contact_facebook': socials.get('facebook'),
            'contact_instagram': socials.get('instagram'),
            'contact_twitter': socials.get('twitter'),
            'contact_linkedin': socials.get('linkedin'),
            'score': score,
            'notes': f"Emails: {', '.join(emails[:3])} | Phones: {', '.join(phones[:3])} | Social: {', '.join(socials.keys())}",
        }
    except Exception:
        return None

def guess_industry(text):
    text_lower = text.lower()
    industries = {
        'Restaurant': ['restaurant', 'food', 'cafe', 'dining', 'cuisine', 'menu', 'kitchen', 'bakery', 'catering'],
        'Healthcare': ['clinic', 'hospital', 'doctor', 'medical', 'health', 'dental', 'pharmacy', 'diagnostic', 'chiropractic'],
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
                all_leads.append(lead)
                has_contact = bool(lead['contact_email'] or lead['contact_phone'] or lead['contact_facebook'])
                print(f"OK ({lead['industry']}, score:{lead['score']}, {'HAS CONTACT' if has_contact else 'NO CONTACT'})")
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
                location,
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
