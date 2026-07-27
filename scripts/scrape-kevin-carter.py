import sqlite3, os, re, time, urllib.request

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'local.db')

def search_ddgs(query, max_results=8):
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
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.read().decode('utf-8', errors='ignore')
    except:
        return ''

def extract_email(html):
    match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', html)
    if match:
        email = match.group(1).lower()
        junk = ['user@', 'you@', 'name@', 'your@', 'business@', 'email@', 'noreply', 'support@', 'image', 'example@']
        if any(j in email for j in junk): return ''
        return email
    return ''

def extract_phone(html):
    match = re.search(r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', html)
    return match.group(1) if match else ''

def extract_social(html):
    fb = ig = li = ''
    m = re.search(r'facebook\.com/([a-zA-Z0-9._-]+)', html)
    if m: fb = 'https://facebook.com/' + m.group(1)
    m = re.search(r'instagram\.com/([a-zA-Z0-9._-]+)', html)
    if m: ig = 'https://instagram.com/' + m.group(1)
    m = re.search(r'linkedin\.com/(?:company|in)/([a-zA-Z0-9._-]+)', html)
    if m: li = 'https://linkedin.com/' + m.group(1)
    return fb, ig, li

SKIP_DOMAINS = ['yelp.com','bbb.org','facebook.com','yellowpages.com','tripadvisor.com','foursquare.com','thumbtack.com','homeadvisor.com','angi.com','houzz.com','bark.com','expertise.com','porch.com','nextdoor.com','linkedin.com','twitter.com','instagram.com','wikipedia.org','reddit.com','duckduckgo.com','google.com','bing.com','mapquest.com','superpages.com','manta.com','indeed.com','glassdoor.com','reddit.com','youtube.com']

# ==================== CARTER SCRAPER ====================
def scrape_carter():
    print('='*60)
    print('SCRAPING FOR CARTER GARCIA (Web Developer)')
    print('ICP: Local businesses needing websites')
    print('='*60)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Carter's ICP queries - target local businesses that likely need websites
    queries = [
        # Restaurants without websites
        'restaurant Tyngsborough MA',
        'pizza shop Lowell MA',
        'Mexican restaurant Tewksbury MA',
        'cafe Billerica MA',
        'bakery Chelmsford MA',
        'food truck Lowell MA',
        'breakfast restaurant Dracut MA',
        # Contractors
        'plumber Tyngsborough MA',
        'electrician Tewksbury MA',
        'HVAC contractor Chelmsford MA',
        'roofing company Dracut MA',
        'landscaping Billerica MA',
        'general contractor Lowell MA',
        'painting contractor Andover MA',
        # Salons/Beauty
        'hair salon Tyngsborough MA',
        'nail salon Tewksbury MA',
        'barbershop Chelmsford MA',
        'beauty salon Lowell MA',
        'spa Billerica MA',
        # Fitness
        'gym Tyngsborough MA',
        'yoga studio Tewksbury MA',
        'personal trainer Lowell MA',
        # Retail
        'boutique Lowell MA',
        'gift shop Andover MA',
        'flower shop Chelmsford MA',
        'pet store Tewksbury MA',
        # Services
        'auto repair Tyngsborough MA',
        'dentist Tewksbury MA',
        'chiropractor Chelmsford MA',
        'veterinary Lowell MA',
        'accountant Billerica MA',
        'real estate agent Tyngsborough MA',
        # Broader Massachusetts
        'restaurant Nashua NH',
        'contractor Nashua NH',
        'salon Nashua NH',
        'gym Nashua NH',
        'auto repair Nashua NH',
    ]
    
    # Get existing URLs
    c.execute('SELECT website_url FROM leads')
    seen = set(row[0].lower() for row in c.fetchall() if row[0])
    
    total_saved = 0
    
    for i, query in enumerate(queries):
        print(f'\n[{i+1}/{len(queries)}] {query}')
        
        results = search_ddgs(query, max_results=6)
        print(f'  Found {len(results)} results')
        
        for result in results[:4]:
            url = result['url'].lower()
            if url in seen: continue
            seen.add(url)
            
            if any(d in url for d in SKIP_DOMAINS): continue
            if any(x in url for x in ['article', 'blog', 'news', '.pdf', 'how-to', 'guide']): continue
            # Skip web design agencies and SaaS
            if any(x in url for x in ['webdesign', 'web-design', 'squarespace', 'wix.com', 'shopify.com', 'wordpress.com', 'godaddy.com']): continue
            if any(x in result['title'].lower() for x in ['web design', 'website builder', 'website template', 'how to build', 'signs your website']): continue
            
            print(f'  Fetching: {result["title"][:60]}')
            
            html = fetch_page(result['url'])
            if not html: continue
            
            email = extract_email(html)
            phone = extract_phone(html)
            fb, ig, li = extract_social(html)
            
            if not email and not phone: continue
            
            # Extract business name
            name = result['title']
            og = re.search(r'property="og:site_name"[^>]*content="([^"]*)"', html, re.I)
            if og: name = og.group(1)
            name = name.split('|')[0].split('-')[0].strip()[:80]
            
            # Determine industry
            text = (name + ' ' + result.get('snippet', '')).lower()
            industry = 'Other'
            if re.search(r'restaurant|cafe|bar |grill|kitchen|dining|pub|pizza|bakery|food truck|breakfast', text): industry = 'Restaurant'
            elif re.search(r'salon|hair|barber|stylist|beauty|nail|spa', text): industry = 'Salon/Beauty'
            elif re.search(r'contractor|construction|plumb|electric|hvac|roofing|landscape|painting|general contractor', text): industry = 'Contractor'
            elif re.search(r'gym|fitness|yoga|personal trainer', text): industry = 'Fitness'
            elif re.search(r'auto|car repair|muffler|brake', text): industry = 'Auto Repair'
            elif re.search(r'dentist|chiropractor|medical|health|veterinary|vet|doctor', text): industry = 'Healthcare'
            elif re.search(r'boutique|gift shop|flower|pet store|retail|shop', text): industry = 'Retail'
            elif re.search(r'accountant|real estate|insurance|lawyer|attorney', text): industry = 'Professional Services'
            
            # Check website quality
            has_analytics = 'google-analytics' in html or 'gtag' in html
            has_booking = bool(re.search(r'booking|reservation|appointment|book now|schedule', html, re.I))
            platform = ''
            if 'squarespace' in html: platform = 'Squarespace'
            elif 'wix' in html: platform = 'Wix'
            elif 'godaddy' in html: platform = 'GoDaddy'
            elif 'wordpress' in html: platform = 'WordPress'
            
            completeness = 20
            if email: completeness += 30
            if phone: completeness += 20
            if fb or ig: completeness += 15
            if name: completeness += 15
            
            location_match = re.search(r'(Tyngsborough|Tewksbury|Lowell|Chelmsford|Dracut|Billerica|Andover|Nashua)', result.get('snippet', '') + ' ' + result.get('title', ''), re.I)
            location = location_match.group(0) + ', MA' if location_match else 'United States'
            
            notes = f'Business: {name}\nIndustry: {industry}\nWebsite: {result["url"]}\n'
            if email: notes += f'Email: {email}\n'
            if phone: notes += f'Phone: {phone}\n'
            if fb: notes += f'Facebook: {fb}\n'
            if ig: notes += f'Instagram: {ig}\n'
            if li: notes += f'LinkedIn: {li}\n'
            notes += f'Location: {location}\n'
            notes += f'Data Completeness: {min(completeness, 100)}%\n'
            notes += f'Lead Quality: {"Strong" if email and phone else "Good"}\n'
            notes += 'Website Assessment: '
            if platform: notes += f'Built on {platform}. '
            if not has_analytics: notes += 'No Google Analytics. '
            if not has_booking: notes += 'No online booking. '
            notes += 'Opportunity: Local business that needs a professional website.\n'
            notes += f'Recommended Services: Custom website, {"booking system" if not has_booking else ""}, SEO, Google Analytics'
            
            score = 85 if (email and phone) else 65
            
            try:
                c.execute('''INSERT INTO leads 
                    (company_name, website_url, industry, contact_email, contact_phone,
                     contact_facebook, contact_instagram, contact_linkedin, location, notes, 
                     score, status, source_url, created_at, updated_at) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))''',
                    (name, result['url'], industry, email, phone, fb, ig, li, location, notes, score, 'new', result['url']))
                
                lead_id = c.lastrowid
                c.execute('INSERT INTO client_leads (client_id, lead_id, assigned_at) VALUES (7, ?, datetime(\'now\'))', (lead_id,))
                conn.commit()
                total_saved += 1
                print(f'    [SAVED] {name} | {email or "no email"} | {phone or "no phone"}')
            except Exception as e:
                print(f'    [ERROR] {e}')
            
            time.sleep(1)
        
        time.sleep(2)
    
    c.execute('SELECT COUNT(*) FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 7')
    total = c.fetchone()[0]
    print(f'\nCARTER COMPLETE: Saved {total_saved} new leads, {total} total')
    conn.close()

# ==================== KEVIN SCRAPER ====================
def scrape_kevin():
    print('\n'+'='*60)
    print('SCRAPING FOR KEVIN - Legacy Memorial Restorations')
    print('ICP: B2B (cemetery associations, funeral homes) + B2C (grave owners)')
    print('='*60)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Kevin's ICP - expanded to B2B and B2C
    queries = [
        # B2B: Cemetery associations and funeral homes
        'cemetery association Washington state',
        'funeral home Yakima WA',
        'crematory Yakima WA',
        'monument dealer Yakima WA',
        'cemetery Sexton Washington',
        'funeral director Yakima WA',
        'cemetery manager Washington',
        'funeral home Ellensburg WA',
        'cemetery association Ellensburg WA',
        'funeral home Selah WA',
        'funeral home Union Gap WA',
        'crematory Yakima County',
        'monument company Washington state',
        'headstone dealer Washington',
        'cemetery board Yakima',
        'funeral service Toppenish WA',
        'funeral home Wapato WA',
        'cemetery caretaker Washington',
        'monument engraver Yakima',
        'memorial park Yakima',
        # B2C: Individual grave owners searching for services
        'headstone cleaning service near me',
        'gravestone repair near me',
        'cemetery cleaning service Washington',
        'monument restoration Pacific Northwest',
        'grave cleaning service WA',
        'tombstone cleaning Washington state',
        'headstone polishing service',
        'cemetery maintenance service',
        'grave care service Washington',
        'memorial cleaning near me',
        'headstone restoration near me',
        'gravestone cleaning Pacific Northwest',
        # Broader: Monument/cemetery industry
        'monument builders Washington',
        'cemetery developers Northwest',
        'memorial products Washington state',
        'funeral supplies Yakima',
        'cemetery equipment Washington',
        'monument materials Washington',
        'headstone wholesale Washington',
        'cemetery maintenance products',
        'gravestone sealant Washington',
        'monument cleaning supplies',
    ]
    
    # Get existing URLs
    c.execute('SELECT website_url FROM leads WHERE website_url IS NOT NULL')
    seen = set(row[0].lower() for row in c.fetchall() if row[0])
    
    total_saved = 0
    
    for i, query in enumerate(queries):
        print(f'\n[{i+1}/{len(queries)}] {query}')
        
        results = search_ddgs(query, max_results=6)
        print(f'  Found {len(results)} results')
        
        for result in results[:4]:
            url = result['url'].lower()
            if url in seen: continue
            seen.add(url)
            
            if any(d in url for d in SKIP_DOMAINS): continue
            if any(x in url for x in ['article', 'blog', 'news', '.pdf', 'wikipedia', 'findagrave', 'obituary']): continue
            
            print(f'  Fetching: {result["title"][:60]}')
            
            html = fetch_page(result['url'])
            if not html: continue
            
            email = extract_email(html)
            phone = extract_phone(html)
            fb, ig, li = extract_social(html)
            
            if not email and not phone: continue
            
            name = result['title']
            og = re.search(r'property="og:site_name"[^>]*content="([^"]*)"', html, re.I)
            if og: name = og.group(1)
            name = name.split('|')[0].split('-')[0].strip()[:80]
            
            text = (name + ' ' + result.get('snippet', '')).lower()
            industry = 'Other'
            if re.search(r'monument|gravestone|headstone|tombstone|memorial|cemetery|grave', text): industry = 'Memorial Services'
            elif re.search(r'funeral|crematory|cremation|burial', text): industry = 'Funeral Services'
            elif re.search(r'clean|wash|pressure', text): industry = 'Cleaning Services'
            elif re.search(r'landscap|lawn|garden', text): industry = 'Landscaping'
            
            # Location
            wa_cities = ['Yakima', 'Ellensburg', 'Selah', 'Union Gap', 'Toppenish', 'Wapato', 'Naches', 'Moxee', 'Grandview', 'Prosser', 'Sunnyside', 'Richland', 'Kennewick', 'Pasco', 'Benton City', 'Zillah', 'Granger']
            location_match = None
            for city in wa_cities:
                if city.lower() in text or city.lower() in url:
                    location_match = city + ', WA'
                    break
            if not location_match:
                loc_match = re.search(r'(Washington|WA)[^,]*', result.get('snippet', ''), re.I)
                location_match = loc_match.group(0) if loc_match else 'Washington State'
            
            has_analytics = 'google-analytics' in html or 'gtag' in html
            has_booking = bool(re.search(r'booking|reservation|appointment|book now|schedule|contact us', html, re.I))
            platform = ''
            if 'squarespace' in html: platform = 'Squarespace'
            elif 'wix' in html: platform = 'Wix'
            elif 'wordpress' in html: platform = 'WordPress'
            
            completeness = 20
            if email: completeness += 30
            if phone: completeness += 20
            if fb or ig: completeness += 15
            if name: completeness += 15
            
            notes = f'Business: {name}\nIndustry: {industry}\nWebsite: {result["url"]}\n'
            if email: notes += f'Email: {email}\n'
            if phone: notes += f'Phone: {phone}\n'
            if fb: notes += f'Facebook: {fb}\n'
            if ig: notes += f'Instagram: {ig}\n'
            if li: notes += f'LinkedIn: {li}\n'
            notes += f'Location: {location_match}\n'
            notes += f'Data Completeness: {min(completeness, 100)}%\n'
            notes += f'Lead Quality: {"Strong" if email and phone else "Good"}\n'
            notes += 'Website Assessment: '
            if platform: notes += f'Built on {platform}. '
            if not has_analytics: notes += 'No Google Analytics. '
            if not has_booking: notes += 'No online booking/contact system. '
            notes += 'Opportunity: Memorial service business that needs online presence.\n'
            notes += f'Recommended Services: Website rebuild, online booking, SEO, Google Analytics'
            
            score = 85 if (email and phone) else 65
            
            try:
                c.execute('''INSERT INTO leads 
                    (company_name, website_url, industry, contact_email, contact_phone,
                     contact_facebook, contact_instagram, contact_linkedin, location, notes, 
                     score, status, source_url, created_at, updated_at) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))''',
                    (name, result['url'], industry, email, phone, fb, ig, li, location_match, notes, score, 'new', result['url']))
                
                lead_id = c.lastrowid
                c.execute('INSERT INTO client_leads (client_id, lead_id, assigned_at) VALUES (2, ?, datetime(\'now\'))', (lead_id,))
                conn.commit()
                total_saved += 1
                print(f'    [SAVED] {name} | {email or "no email"} | {phone or "no phone"}')
            except Exception as e:
                print(f'    [ERROR] {e}')
            
            time.sleep(1)
        
        time.sleep(2)
    
    c.execute('SELECT COUNT(*) FROM leads l JOIN client_leads cl ON l.id = cl.lead_id WHERE cl.client_id = 2')
    total = c.fetchone()[0]
    print(f'\nKEVIN COMPLETE: Saved {total_saved} new leads, {total} total')
    conn.close()

if __name__ == '__main__':
    scrape_carter()
    scrape_kevin()
