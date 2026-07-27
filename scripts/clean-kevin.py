import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'local.db')

# Domains that are NOT memorial/monument businesses
JUNK_DOMAINS = [
    'youtube.com', 'google.com', 'bing.com', 'duckduckgo.com',
    'facebook.com', 'yelp.com', 'yellowpages.com', 'linkedin.com',
    'twitter.com', 'instagram.com', 'reddit.com', 'wikipedia.org',
    'apple.com', 'microsoft.com', 'amazon.com', 'accuweather.com',
    'gethuman.com', 'livability.com', 'trulia.com', 'zillow.com',
    'rent.com', 'rentcafe.com', 'foreclosurelistings.com',
    'maps', 'mapsof.net', 'mapquest.com', 'superpages.com',
    'tending.app',  # app, not a local business
]

# Company names that are clearly NOT memorial businesses
JUNK_NAMES = [
    'youtube', 'apple', 'microsoft', 'gethuman', 'livability',
    'rent', 'foreclosure', 'trulia', 'maps', 'mapsof',
    'accuweather', 'superpages', 'mapquest', 'manta',
    'care.com', 'trust for public land', 'comcast',
    'city of', 'department of licensing', 'yakima herald',
    'subaru', 'sentry', 'hotfrog', 'yelp',
    'out of business', 'example', 'gethuman',
    'water damage', 'fire damage', 'duct', 'air duct',
    'geothermal', 'at&t', 'clogged drain',
    'human composting', 'dumpster', 'gutter cleaning',
    'house cleaning', 'carpet', 'rug', 'apartment',
]

# Keywords that SHOULD be in memorial business names/notes
MEMORIAL_KEYWORDS = [
    'monument', 'memorial', 'gravestone', 'headstone', 'tombstone',
    'cemetery', 'crematory', 'cremation', 'funeral', 'grave',
    'marker', 'burial', 'interment', 'mausoleum', 'columbarium',
    'evergreen', 'calvary', 'terrace heights', 'sunset gardens',
    'legacy', 'roth cemetery', 'grave angels', 'never forgotten',
    'headstoners', 'todd monuments', 'remembrance',
]

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Get all Kevin leads
    c.execute('''SELECT l.id, l.company_name, l.website_url, l.contact_email, l.contact_phone, l.notes 
                 FROM leads l 
                 JOIN client_leads cl ON l.id = cl.lead_id 
                 WHERE cl.client_id = 2''')
    
    leads = c.fetchall()
    print(f'Total Kevin leads before cleanup: {len(leads)}')
    
    removed = 0
    kept = 0
    
    for lead in leads:
        lead_id, name, website, email, phone, notes = lead
        name_lower = (name or '').lower()
        website_lower = (website or '').lower()
        notes_lower = (notes or '').lower()
        
        should_remove = False
        reason = ''
        
        # Check junk domains
        if website_lower:
            for d in JUNK_DOMAINS:
                if d in website_lower:
                    should_remove = True
                    reason = f'Junk domain: {d}'
                    break
        
        # Check junk names
        if not should_remove:
            for j in JUNK_NAMES:
                if j in name_lower:
                    should_remove = True
                    reason = f'Junk name: {j}'
                    break
        
        # Check if it's actually a memorial business
        if not should_remove:
            is_memorial = any(k in name_lower or k in notes_lower for k in MEMORIAL_KEYWORDS)
            if not is_memorial:
                # Check if it's at least a local business in the area
                is_local = any(x in notes_lower for x in ['yakima', 'wa', 'washington', 'toppenish', 'wapato', 'ellensburg', 'selah', 'union gap', 'naches', 'moxee'])
                if not is_local:
                    should_remove = True
                    reason = 'Not memorial business, not local'
        
        # Check for toll-free numbers
        if not should_remove:
            phone_clean = (phone or '').replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
            if phone_clean.startswith(('800', '888', '877', '866', '855', '844', '833')):
                should_remove = True
                reason = 'Toll-free number'
        
        if should_remove:
            c.execute('DELETE FROM client_leads WHERE lead_id = ? AND client_id = 2', (lead_id,))
            c.execute('DELETE FROM leads WHERE id = ?', (lead_id,))
            removed += 1
            print(f'  [REMOVED] {name} - {reason}')
        else:
            kept += 1
    
    conn.commit()
    
    print(f'\n=== KEVIN CLEANUP COMPLETE ===')
    print(f'Removed: {removed}')
    print(f'Kept: {kept}')
    
    # Show what's left
    c.execute('''SELECT l.company_name, l.contact_email, l.contact_phone, l.website_url 
                 FROM leads l 
                 JOIN client_leads cl ON l.id = cl.lead_id 
                 WHERE cl.client_id = 2''')
    
    remaining = c.fetchall()
    print(f'\nRemaining Kevin leads ({len(remaining)}):')
    for name, email, phone, website in remaining:
        print(f'  {name} | {email or "no email"} | {phone or "no phone"} | {website or "no website"}')
    
    conn.close()

if __name__ == '__main__':
    main()
