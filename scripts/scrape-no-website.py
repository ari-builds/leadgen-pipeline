import sys
import time
import json
import sqlite3
import urllib.request
import urllib.parse
import re

# Use local.db
DB_PATH = "local.db"

def ddg_search(query, num_results=20):
    """Use ddgs package for reliable search"""
    try:
        from duckduckgo_search import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=num_results):
                results.append({
                    'url': r.get('href', ''),
                    'title': r.get('title', ''),
                    'snippet': r.get('body', '')
                })
        return results
    except Exception as e:
        print(f"  ddgs error: {e}", file=sys.stderr)
        return []


DIRECTORY_DOMAINS = [
    'yelp.com', 'bbb.org', 'facebook.com', 'instagram.com', 'twitter.com',
    'yellowpages.com', 'tripadvisor.com', 'foursquare.com', 'mapquest.com',
    'manta.com', 'chamberofcommerce.com', 'superpages.com', 'thumbtack.com',
    'homeadvisor.com', 'angi.com', 'angieslist.com', 'houzz.com', 'bark.com',
    'expertise.com', 'porch.com', 'nextdoor.com', 'apple.com/maps',
    'google.com/maps', 'maps.google.com', 'dandb.com', 'bizapedia.com',
    'n49.com', 'citysearch.com', 'merchantcircle.com', 'hotfrog.com',
    'showmelocal.com', 'brownbook.net', 'cylex-usa.com', 'alignable.com',
    'bestprosintown.com', 'thumbtack.com'
]

SITE_DOMAINS = [
    'yelp.com', 'bbb.org', 'facebook.com', 'instagram.com',
    'yellowpages.com', 'tripadvisor.com', 'foursquare.com', 'thumbtack.com',
    'angi.com', 'expertise.com', 'houzz.com', 'bark.com', 'porch.com',
    'bestprosintown.com', 'duckduckgo.com'
]


def is_directory_url(url):
    url_lower = url.lower()
    for domain in DIRECTORY_DOMAINS:
        if domain in url_lower:
            return True
    return False


def is_business_site(url):
    """Check if URL looks like an actual business website (not a directory)"""
    url_lower = url.lower()
    for domain in SITE_DOMAINS:
        if domain in url_lower:
            return False
    parsed = urllib.parse.urlparse(url)
    host = (parsed.hostname or '').replace('www.', '')
    # Skip generic/tlds
    if host in ['duckduckgo.com', 'google.com', 'bing.com']:
        return False
    return True


def fetch_page(url, max_size=300000):
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        resp = urllib.request.urlopen(req, timeout=10)
        data = resp.read(max_size)
        return data.decode('utf-8', errors='ignore')
    except:
        return None


def extract_from_yelp_listing(html):
    """Extract individual businesses from a Yelp search results page"""
    businesses = []
    
    # Find business listings in Yelp HTML
    # Pattern: business name, phone, rating from Yelp listing pages
    name_patterns = re.findall(r'class="css-[a-z0-9]+"[^>]*><a[^>]*href="/biz/([^"]+)"[^>]*>(.*?)</a>', html)
    
    # Also try JSON-LD structured data
    jsonld_matches = re.findall(r'"name"\s*:\s*"([^"]+)".*?"telephone"\s*:\s*"([^"]*)"', html[:50000])
    
    # Try finding business cards
    biz_blocks = re.findall(r'<div[^>]*class="[^"]*businessName[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
    
    # Extract from aria-labels and data attributes
    aria_names = re.findall(r'aria-label="([^"]*(?:Restaurant|Salon|Gym|Plumber|Electrician|Contractor|Shop|Store|Cafe|Bar|Grill)[^"]*)"', html)
    
    # Get phones
    phones = re.findall(r'(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})', html)
    
    print(f"    Yelp analysis: {len(name_patterns)} names, {len(jsonld_matches)} jsonld, {len(aria_names)} aria, {len(phones)} phones")
    
    return businesses


def scrape_no_website_leads(category, location, client_id=6):
    """Search for businesses and find ones that ONLY appear on directories (no own website)"""
    query = f"{category} {location}"
    print(f"\nSearching: {query}")
    
    results = ddg_search(query, num_results=20)
    print(f"  Found {len(results)} results")
    
    if not results:
        return []
    
    leads = []
    business_sites = []  # Businesses that HAVE websites
    directory_listings = []  # Directory pages we can extract from
    
    for r in results:
        url = r['url']
        title = r['title']
        snippet = r['snippet']
        
        if is_business_site(url):
            # This is an actual business website
            business_sites.append({'url': url, 'title': title, 'snippet': snippet})
            print(f"  HAS SITE: {title[:50]}")
        elif is_directory_url(url):
            directory_listings.append({'url': url, 'title': title, 'snippet': snippet})
            print(f"  DIRECTORY: {title[:50]}")
    
    # Now visit directory pages to find businesses listed on them
    # that DON'T have their own websites
    for dir_page in directory_listings[:3]:  # Check top 3 directory pages
        print(f"  Checking directory: {dir_page['title'][:40]}...")
        html = fetch_page(dir_page['url'])
        if not html:
            continue
        
        # Extract individual businesses from the directory page
        # Look for business names, phones, addresses in the HTML
        # Common patterns on Yelp/Thumbtack/Angi pages
        
        # Find all business-like entries
        # Pattern 1: <a> tags with /biz/ or similar paths
        biz_links = re.findall(r'href="(?:/biz/|/profile/|/company/)([^"]+)"', html)
        
        # Pattern 2: Phone numbers near business names
        phone_blocks = re.findall(r'((?:[\w\s&]+\n?){0,3}[\w\s&]+)\s*[\n\r]+\s*(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})', html)
        
        # Pattern 3: Schema.org structured data
        schema_businesses = re.findall(r'"@type"\s*:\s*"LocalBusiness".*?"name"\s*:\s*"([^"]+)"', html[:100000])
        
        # Pattern 4: Simple business name extraction from heading tags
        heading_names = re.findall(r'<h[234][^>]*>([^<]+)</h[234]>', html)
        heading_names = [n.strip() for n in heading_names if len(n.strip()) > 3 and len(n.strip()) < 80]
        
        # Pattern 5: Look for phone numbers and their nearby text
        all_phones = re.findall(r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', html)
        
        print(f"    Found: {len(biz_links)} biz links, {len(schema_businesses)} schema, {len(heading_names)} headings, {len(all_phones)} phones")
        
        # Try to pair business names with phones
        # Look for text blocks that contain both
        text_blocks = re.findall(r'((?:[^<]{10,200}\n?){1,3}[^<]{0,200}?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}[^<]{0,100})', html)
        
        for block in text_blocks[:10]:
            # Extract business name (first line usually)
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if not lines:
                continue
            
            name = lines[0]
            # Clean up
            name = re.sub(r'<[^>]+>', '', name).strip()
            name = re.sub(r'^[\d\.\)\s]+', '', name).strip()  # Remove leading numbers
            
            phone_match = re.search(r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', block)
            phone = phone_match.group(1) if phone_match else ''
            
            # Skip if name looks like a header/navigation
            if len(name) < 3 or name.lower() in ['menu', 'home', 'about', 'contact', 'search', 'sign up', 'log in', 'reviews']:
                continue
            if any(x in name.lower() for x in ['best ', 'top ', 'how to', 'the 10', 'the best']):
                continue
            
            # Check if this business has its own website (not a directory)
            has_own_site = False
            for bs in business_sites:
                if name.lower().split()[0] in bs['title'].lower():
                    has_own_site = True
                    break
            
            if not has_own_site and phone:
                # This is a good prospect - business on directory with phone but likely no website
                print(f"    FOUND: {name} | {phone}")
                
                notes_lines = [
                    f"**Business:** {name} - {category} in {location}.",
                    "",
                    f"**No Website:** Listed on directory ({dir_page['title'][:40]}) but no dedicated business website found.",
                    "",
                    f"**Phone:** {phone}",
                    "",
                    f"**Directory Listing:** {dir_page['url']}",
                    "",
                    "**Opportunity:** No website means they rely entirely on directory listings and word-of-mouth. A professional website would let them control their online presence, showcase their work, and capture customers searching online.",
                    "",
                    "**Recommended Services:** Custom responsive website, Google Business Profile optimization, local SEO, online booking/contact forms",
                    "",
                    "**Lead Quality:** Strong prospect - has phone, location, and is actively listed on directories (showing they want customers) but lacks a website"
                ]
                
                leads.append({
                    'company_name': name,
                    'website_url': None,
                    'contact_email': None,
                    'contact_phone': phone,
                    'location': location,
                    'industry': category,
                    'source_url': dir_page['url'],
                    'notes': '\n'.join(notes_lines),
                    'score': 7,
                })
    
    # If we didn't find directory businesses, use the business sites 
    # but check if they're actually bad/outdated websites
    if not leads:
        for bs in business_sites[:2]:
            print(f"  Checking site: {bs['title'][:40]}...")
            html = fetch_page(bs['url'])
            if not html:
                continue
            
            h = html.lower()
            issues = []
            if not h.includes('viewport') if hasattr(h, 'includes') else 'viewport' not in h:
                issues.append('Not mobile-friendly')
            if 'squarespace' in h:
                issues.append('Built on Squarespace')
            if 'wix.com' in h:
                issues.append('Built on Wix')
            
            # Only include if site has significant issues
            if len(issues) >= 2:
                print(f"    BAD SITE: {bs['title']} - {', '.join(issues)}")
                notes = f"**Business:** {bs['title']}\n**Website:** {bs['url']}\n**Issues:** {', '.join(issues)}\n**Opportunity:** Site needs professional rebuild"
                leads.append({
                    'company_name': bs['title'][:60],
                    'website_url': bs['url'],
                    'contact_email': None,
                    'contact_phone': None,
                    'location': location,
                    'industry': category,
                    'source_url': bs['url'],
                    'notes': notes,
                    'score': 6,
                })
    
    return leads


def save_to_local_db(leads, client_id):
    """Save to local.db"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    saved = 0
    
    for lead in leads:
        # Dedup by name
        c.execute('SELECT id FROM leads WHERE company_name=? AND (SELECT client_id FROM client_leads WHERE lead_id=leads.id)=?', 
                  (lead['company_name'], client_id))
        if c.fetchone():
            print(f"  SKIP (dup): {lead['company_name']}")
            continue
        
        try:
            c.execute('''INSERT INTO leads (company_name, website_url, contact_email, contact_phone, location, industry, source_url, notes, score, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))''',
                      (lead['company_name'], lead.get('website_url'), lead.get('contact_email'),
                       lead.get('contact_phone'), lead.get('location'), lead.get('industry'),
                       lead.get('source_url'), lead.get('notes'), lead.get('score', 7)))
            lead_id = c.lastrowid
            c.execute('INSERT INTO client_leads (client_id, lead_id, assigned_at) VALUES (?, ?, datetime("now"))',
                      (client_id, lead_id))
            saved += 1
            print(f"  SAVED: {lead['company_name']} (id:{lead_id})")
        except Exception as e:
            print(f"  ERROR: {e}")
    
    conn.commit()
    conn.close()
    return saved


def main():
    client_id = 6  # Ethan
    
    # First, remove the 4 garbage leads we saved earlier
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM client_leads WHERE lead_id IN (SELECT id FROM leads WHERE company_name LIKE '%Best%' AND company_name LIKE '%with Free Estimates%' AND client_id=6)")
    c.execute("DELETE FROM leads WHERE company_name LIKE '%Best%' AND company_name LIKE '%with Free Estimates%' AND id IN (SELECT lead_id FROM client_leads WHERE client_id=6)")
    c.execute("DELETE FROM client_leads WHERE lead_id IN (SELECT id FROM leads WHERE company_name LIKE '%10 Best%Electricians%' AND id NOT IN (SELECT lead_id FROM client_leads WHERE client_id!=6))")
    c.execute("DELETE FROM leads WHERE company_name LIKE '%10 Best%Electricians%' AND id NOT IN (SELECT lead_id FROM client_leads WHERE client_id!=6)")
    conn.commit()
    conn.close()
    print("Cleaned garbage leads")
    
    categories = [
        'plumber', 'electrician', 'hvac', 'roofing contractor', 'landscaping',
        'painter', 'handyman', 'tree service', 'pest control',
        'auto repair', 'oil change', 'tire shop', 'car wash',
        'dry cleaner', 'laundromat', 'cleaning service',
        'bakery', 'florist', 'pet groomer', 'veterinarian',
        'accountant', 'tax preparer',
    ]
    
    locations = [
        'Asheville NC', 'Burlington VT', 'Portland ME', 'Savannah GA',
        'Richmond VA', 'Charleston SC', 'Madison WI', 'Grand Rapids MI',
        'Boise ID', 'Spokane WA', 'Knoxville TN', 'Chattanooga TN',
    ]
    
    total = 0
    for location in locations:
        for category in categories[:6]:
            leads = scrape_no_website_leads(category, location, client_id)
            if leads:
                saved = save_to_local_db(leads, client_id)
                total += saved
            time.sleep(2)
        print(f"\n--- {location}: {total} total saved ---")
    
    print(f"\n=== DONE: {total} no-website leads saved to local.db ===")
    print("Run migrate-ethan.js to push to Turso")


if __name__ == '__main__':
    main()
