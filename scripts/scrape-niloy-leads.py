import sys
import json
import time
import re
from urllib.parse import urlparse, unquote

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

CLIENT_ID = 3
import os
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'local.db')
ICP_KEYWORDS = [
    "small business Dhaka Bangladesh website",
    "restaurant Dhaka Bangladesh no website",
    "clinic Dhaka Bangladesh website development",
    "real estate Dhaka Bangladesh website",
    "retail shop Dhaka Bangladesh online presence",
    "education institute Dhaka Bangladesh website",
    "e-commerce business Dhaka Bangladesh",
    "salon spa Dhaka Bangladesh website",
    "gym fitness center Dhaka Bangladesh website",
    "boutique shop Dhaka Bangladesh online store",
    "Dhaka business directory",
    "Dhaka Bangladesh small business contact",
    "Dhaka shop phone number address",
    "Bangladesh startup company Dhaka",
    "Dhaka local business listing",
]

def search_leads(query, max_results=20):
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append({
                    'title': r.get('title', ''),
                    'url': r.get('href', r.get('link', '')),
                    'snippet': r.get('body', r.get('snippet', ''))
                })
    except Exception as e:
        print(f"  Search error for '{query[:40]}...': {e}")
    return results

def extract_business_info(result):
    title = result['title']
    url = result['url']
    snippet = result['snippet']
    
    name = title.split(' - ')[0].split(' | ')[0].split(' – ')[0].strip()
    
    # Extract location from snippet
    location = 'Dhaka, Bangladesh'
    
    # Extract phone
    phone_match = re.search(r'(?:\+?880|01[3-9]\d)[-\s]?\d{3,4}[-\s]?\d{4}', snippet)
    phone = phone_match.group(0) if phone_match else None
    
    # Extract email
    email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', snippet)
    email = email_match.group(0) if email_match else None
    
    # Try to find business name from URL
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '')
    
    return {
        'name': name[:200],
        'website': url,
        'domain': domain,
        'location': location,
        'phone': phone,
        'email': email,
        'snippet': snippet[:500],
        'industry': guess_industry(snippet + ' ' + title),
        'score': calculate_score(result)
    }

def guess_industry(text):
    text_lower = text.lower()
    industries = {
        'Restaurant': ['restaurant', 'food', 'cafe', 'dining', 'cuisine', 'menu', 'kitchen'],
        'Retail': ['shop', 'store', 'retail', 'boutique', 'fashion', 'clothing'],
        'Healthcare': ['clinic', 'hospital', 'doctor', 'medical', 'health', 'dental'],
        'Real Estate': ['real estate', 'property', 'housing', 'apartment', 'realty'],
        'Education': ['school', 'college', 'university', 'education', 'academy', 'training'],
        'E-commerce': ['ecommerce', 'e-commerce', 'online shop', 'online store', 'marketplace'],
        'Beauty': ['salon', 'spa', 'beauty', 'cosmetic', 'hair'],
        'Fitness': ['gym', 'fitness', 'yoga', 'health club'],
        'Technology': ['software', 'tech', 'IT', 'digital', 'web development'],
        'Construction': ['construction', 'builder', 'contractor', 'engineering'],
    }
    for industry, keywords in industries.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return industry
    return 'General Business'

def calculate_score(result):
    score = 5
    snippet = result['snippet'].lower()
    title = result['title'].lower()
    
    # Boost for business signals
    if any(w in snippet for w in ['phone', 'call', 'contact', 'address', 'location']):
        score += 1
    if any(w in snippet for w in ['dhaka', 'bangladesh']):
        score += 1
    if any(w in snippet for w in ['restaurant', 'shop', 'clinic', 'store', 'business']):
        score += 1
    # Penalize tech companies and agencies
    if any(w in snippet for w in ['software company', 'web agency', 'digital agency', 'IT company']):
        score -= 2
    if any(w in title for w in ['linkedin', 'facebook', 'wikipedia', 'youtube']):
        score -= 2
    
    return max(1, min(10, score))

def main():
    all_leads = []
    seen_domains = set()
    
    print(f"Scraping leads for ICP: Dhaka businesses needing web development")
    print(f"Target: 50 leads\n")
    
    for i, keyword in enumerate(ICP_KEYWORDS):
        if len(all_leads) >= 60:
            break
            
        print(f"[{i+1}/{len(ICP_KEYWORDS)}] Searching: {keyword}")
        results = search_leads(keyword, max_results=10)
        
        for r in results:
            if len(all_leads) >= 60:
                break
                
            parsed = urlparse(r['url'])
            domain = parsed.netloc.replace('www.', '')
            
            # Skip duplicates and irrelevant domains
            if domain in seen_domains:
                continue
            skip_domains = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com', 
                          'youtube.com', 'wikipedia.org', 'google.com', 'amazon.com',
                          'github.com', 'stackoverflow.com', 'reddit.com', 'pinterest.com',
                          'tiktok.com', 'trustpilot.com', 'glassdoor.com', 'indeed.com']
            if any(sd in domain for sd in skip_domains):
                continue
            
            seen_domains.add(domain)
            lead = extract_business_info(r)
            all_leads.append(lead)
        
        time.sleep(1)
    
    # Sort by score and take top 50
    all_leads.sort(key=lambda x: x['score'], reverse=True)
    top_leads = all_leads[:50]
    
    print(f"\nTotal unique leads found: {len(all_leads)}")
    print(f"Top 50 selected for client\n")
    
    # Print summary
    industries = {}
    phones = 0
    emails = 0
    for lead in top_leads:
        ind = lead['industry']
        industries[ind] = industries.get(ind, 0) + 1
        if lead['phone']:
            phones += 1
        if lead['email']:
            emails += 1
    
    print("Industry breakdown:")
    for ind, count in sorted(industries.items(), key=lambda x: -x[1]):
        print(f"  {ind}: {count}")
    print(f"\nContact info: {phones} phones, {emails} emails")
    
    # Save to JSON for import
    script_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(script_dir, 'niloy-leads.json'), 'w', encoding='utf-8') as f:
        json.dump(top_leads, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved to scripts/niloy-leads.json")
    
    # Now import to local.db
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    imported = 0
    for lead in top_leads:
        try:
            cursor.execute("""
                INSERT INTO leads (company_name, website_url, industry, location, score, notes, contact_email, contact_phone, source_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                lead['name'][:200],
                lead['website'],
                lead['industry'],
                lead['location'],
                lead['score'],
                lead['snippet'][:1000],
                lead.get('email'),
                lead.get('phone'),
                lead['website'],
            ))
            lead_id = cursor.lastrowid
            
            # Link to client
            cursor.execute("""
                INSERT INTO client_leads (client_id, lead_id, assigned_at)
                VALUES (?, ?, datetime('now'))
            """, (CLIENT_ID, lead_id))
            
            imported += 1
        except Exception as e:
            print(f"  Import error: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\nImported {imported} leads to database and linked to client {CLIENT_ID}")

if __name__ == '__main__':
    main()
