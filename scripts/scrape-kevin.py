import subprocess, json, sys, time, re, sqlite3, os, datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'local.db')

# Kevin's ICP: Monument/gravestone cleaning, cemetery maintenance in Yakima WA area
QUERIES = [
    'monument cleaning service Yakima WA',
    'gravestone restoration Yakima WA',
    'cemetery maintenance Yakima WA',
    'headstone cleaning Yakima WA',
    'memorial cleaning service Yakima WA',
    'tombstone repair Yakima WA',
    'monument restoration Toppenish WA',
    'gravestone cleaning Wapato WA',
    'cemetery maintenance Ellensburg WA',
    'memorial service Selah WA',
    'headstone repair Union Gap WA',
    'monument care Naches WA',
    'cemetery restoration Moxee WA',
    'grave cleaning Terrace Heights WA',
    'memorial cleaning West Valley WA',
    'tombstone care Harrah WA',
    'monument service Buena WA',
    'gravestone care Zillah WA',
    'cemetery maintenance Granger WA',
    'memorial cleaning Sunnyside WA',
    'headstone service Grandview WA',
    'monument care Prosser WA',
    'cemetery cleaning Benton City WA',
    'grave marker service Richland WA',
    'memorial restoration Kennewick WA',
    'tombstone cleaning Pasco WA',
    'cemetery landscaping Yakima Washington',
    'monument polishing service Yakima',
    'grave marker cleaning Yakima County',
    'cemetery care Tri-Cities WA',
]

SKIP_DOMAINS = [
    'yelp.com', 'bbb.org', 'facebook.com', 'yellowpages.com', 'tripadvisor.com',
    'foursquare.com', 'thumbtack.com', 'homeadvisor.com', 'angi.com', 'houzz.com',
    'bark.com', 'expertise.com', 'porch.com', 'nextdoor.com', 'linkedin.com',
    'twitter.com', 'instagram.com', 'wikipedia.org', 'reddit.com', 'duckduckgo.com',
    'google.com', 'bing.com', 'mapquest.com', 'superpages.com', 'manta.com',
]

def search_ddgs(query, max_results=5):
    """Use ddgs Python package"""
    try:
        from ddgs import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                url = r.get('href', '')
                title = r.get('title', '')
                snippet = r.get('body', '')
                if url:
                    results.append({'url': url, 'title': title, 'snippet': snippet})
        return results
    except Exception as e:
        print(f'  ddgs error: {e}')
        return []

def fetch_page(url):
    """Fetch page HTML"""
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return ''

def extract_email(html):
    match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', html)
    if match:
        email = match.group(1).lower()
        # Filter junk emails
        junk = ['user@', 'you@', 'name@', 'your@', 'business@', 'email@', 'noreply', 'support@', 'image']
        if any(j in email for j in junk):
            return ''
        return email
    return ''

def extract_phone(html):
    match = re.search(r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', html)
    return match.group(1) if match else ''

def extract_social(html):
    fb = ''
    ig = ''
    match_fb = re.search(r'facebook\.com/([a-zA-Z0-9._-]+)', html)
    if match_fb: fb = 'https://facebook.com/' + match_fb.group(1)
    match_ig = re.search(r'instagram\.com/([a-zA-Z0-9._-]+)', html)
    if match_ig: ig = 'https://instagram.com/' + match_ig.group(1)
    return fb, ig

def extract_name(html, title):
    # Try og:site_name
    match = re.search(r'property="og:site_name"[^>]*content="([^"]*)"', html, re.I)
    if match: return match.group(1).strip()
    # Try title
    if title:
        name = title.split('|')[0].split('-')[0].strip()
        name = re.sub(r'\b(Yakima|WA|Washington|Toppenish|Wapato|Ellensburg|Selah|Union Gap|Naches|Moxee)\b', '', name, flags=re.I).strip()
        return name
    return ''

def get_db():
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def main():
    conn = get_db()
    c = conn.cursor()
    
    # Get existing URLs
    c.execute('SELECT website_url FROM leads')
    seen = set()
    for row in c.fetchall():
        if row[0]:
            seen.add(row[0].lower())
    
    # Also get existing Kevin lead websites
    c.execute('''SELECT l.website_url FROM leads l 
                 JOIN client_leads cl ON l.id = cl.lead_id 
                 WHERE cl.client_id = 2''')
    for row in c.fetchall():
        if row[0]:
            seen.add(row[0].lower())
    
    total_saved = 0
    
    for i, query in enumerate(QUERIES):
        print(f'\n[{i+1}/{len(QUERIES)}] Searching: {query}')
        
        results = search_ddgs(query, max_results=5)
        print(f'  Found {len(results)} results')
        
        for result in results:
            url = result['url'].lower()
            if url in seen:
                continue
            seen.add(url)
            
            # Skip directories
            if any(d in url for d in SKIP_DOMAINS):
                print(f'  [SKIP-Dir] {result["title"]}')
                continue
            
            # Skip articles
            if any(x in url for x in ['article', 'blog', 'news', '.pdf']):
                print(f'  [SKIP-Art] {result["title"]}')
                continue
            
            print(f'  Fetching: {result["title"]}')
            
            html = fetch_page(result['url'])
            if not html:
                print(f'  [SKIP-Content]')
                continue
            
            email = extract_email(html)
            phone = extract_phone(html)
            fb, ig = extract_social(html)
            name = extract_name(html, result['title']) or result['title']
            
            if not email and not phone:
                print(f'  [SKIP-Contact] {name}')
                continue
            
            # Determine industry
            text = (name + ' ' + result.get('title', '') + ' ' + result.get('snippet', '')).lower()
            industry = 'Other'
            if re.search(r'monument|gravestone|headstone|tombstone|memorial|cemetery|grave', text):
                industry = 'Memorial Services'
            elif re.search(r'clean|wash|pressure', text):
                industry = 'Cleaning Services'
            elif re.search(r'landscap|lawn|garden', text):
                industry = 'Landscaping'
            elif re.search(r'plumb|electric|hvac|roof|contractor', text):
                industry = 'Contractor'
            
            # Build notes
            has_analytics = 'google-analytics' in html or 'gtag' in html
            has_schema = 'itemtype' in html or 'application/ld+json' in html
            has_meta = 'meta name="description"' in html or 'meta name="Description"' in html
            platform = ''
            if 'squarespace' in html: platform = 'Squarespace'
            elif 'wix' in html: platform = 'Wix'
            elif 'godaddy' in html: platform = 'GoDaddy'
            elif 'wordpress' in html: platform = 'WordPress'
            
            completeness = 20  # base for name + website
            if email: completeness += 30
            if phone: completeness += 20
            if fb or ig: completeness += 15
            if name: completeness += 15
            
            notes = f'Business: {name}\n'
            notes += f'Industry: {industry}\n'
            notes += f'Website: {result["url"]}\n'
            if email: notes += f'Email: {email}\n'
            if phone: notes += f'Phone: {phone}\n'
            if fb: notes += f'Facebook: {fb}\n'
            if ig: notes += f'Instagram: {ig}\n'
            notes += f'Location: Yakima, WA area\n'
            notes += f'Data Completeness: {min(completeness, 100)}%\n'
            notes += f'Lead Quality: {"Strong" if email and phone else "Good"}\n'
            notes += 'Website Assessment: '
            if platform: notes += f'Built on {platform}. '
            if not has_analytics: notes += 'No Google Analytics. '
            if not has_schema: notes += 'No schema markup. '
            if not has_meta: notes += 'No meta description. '
            notes += 'Opportunity: Local memorial service business that needs online presence and booking system.\n'
            notes += f'Recommended Services: Website {"rebuild" if platform in ["Squarespace","Wix","GoDaddy"] else "development"}, online booking, SEO, Google Analytics setup'
            
            score = 85 if (email and phone) else 65
            
            # Insert lead
            c.execute('''INSERT INTO leads 
                (company_name, website_url, industry, contact_email, contact_phone, 
                 contact_facebook, contact_instagram, location, notes, score, status, 
                 source_url, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))''',
                (name, result['url'], industry, email, phone, fb, ig,
                 'Yakima, WA area', notes, score, 'new', result['url']))
            
            lead_id = c.lastrowid
            
            # Link to Kevin
            c.execute('''INSERT INTO client_leads (client_id, lead_id, assigned_at) 
                        VALUES (2, ?, datetime('now'))''', (lead_id,))
            
            conn.commit()
            total_saved += 1
            print(f'  [SAVED] {name} | {email or "no email"} | {phone or "no phone"}')
            
            time.sleep(1)
        
        time.sleep(2)
    
    # Count total Kevin leads
    c.execute('''SELECT COUNT(*) FROM leads l 
                 JOIN client_leads cl ON l.id = cl.lead_id 
                 WHERE cl.client_id = 2''')
    total = c.fetchone()[0]
    
    print(f'\n=== KEVIN SCRAPER COMPLETE ===')
    print(f'Total saved this run: {total_saved}')
    print(f'Total Kevin leads now: {total}')
    
    conn.close()

if __name__ == '__main__':
    main()
