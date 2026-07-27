import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'local.db')

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
    
    for lead in leads:
        lead_id, name, website, email, phone, notes = lead
        name_lower = (name or '').lower()
        website_lower = (website or '').lower()
        notes_lower = (notes or '').lower()
        
        should_remove = False
        reason = ''
        
        # Remove car dealerships
        if any(x in name_lower for x in ['hyundai', 'chrysler', 'jeep', 'ram', 'subaru', 'honda', 'toyota', 'ford', 'chevrolet', 'auto', 'car dealer', 'dealership']):
            should_remove = True
            reason = 'Car dealership'
        
        # Remove government sites
        if any(x in website_lower for x in ['.gov', 'govt', 'nps.gov', 'va.gov', 'wsdot', 'state.', 'county.', 'city.']):
            should_remove = True
            reason = 'Government site'
        
        # Remove national brands
        if any(x in name_lower for x in ['dignity memorial', 'findagrave', 'legacy.com', 'washington post', 'tiktok', 'youtube', 'facebook', 'instagram', 'twitter']):
            should_remove = True
            reason = 'National brand'
        
        # Remove non-memorial businesses
        if any(x in name_lower for x in ['air duct', 'cleaning.com', 'recovery', 'aa meeting', 'panera', 'bread', 'courtlistener', 'washingtonpost']):
            should_remove = True
            reason = 'Not memorial business'
        
        # Remove toll-free numbers
        if phone:
            phone_clean = phone.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
            if phone_clean.startswith(('800', '888', '877', '866', '855', '844', '833')):
                should_remove = True
                reason = 'Toll-free number'
        
        # Remove fake emails
        if email:
            fake = ['example@', 'user@', 'you@', 'name@', 'your@', 'noreply', 'sentry', 'o466311', 'o203240', 'ingest']
            if any(f in email.lower() for f in fake):
                should_remove = True
                reason = 'Fake email'
        
        # Remove if name is just "Out of Business"
        if name_lower == 'out of business':
            should_remove = True
            reason = 'Out of business'
        
        # Remove duplicates (keep first)
        if not should_remove and website:
            c2 = conn.cursor()
            c2.execute('SELECT COUNT(*) FROM leads WHERE website_url = ? AND id != ?', (website, lead_id))
            if c2.fetchone()[0] > 0:
                should_remove = True
                reason = 'Duplicate'
        
        if should_remove:
            c.execute('DELETE FROM client_leads WHERE lead_id = ? AND client_id = 2', (lead_id,))
            c.execute('DELETE FROM leads WHERE id = ?', (lead_id,))
            removed += 1
            print(f'  [REMOVED] {name} - {reason}')
    
    conn.commit()
    
    # Show remaining
    c.execute('''SELECT l.company_name, l.contact_email, l.contact_phone, l.website_url 
                 FROM leads l 
                 JOIN client_leads cl ON l.id = cl.lead_id 
                 WHERE cl.client_id = 2''')
    
    remaining = c.fetchall()
    print(f'\n=== KEVIN CLEANUP COMPLETE ===')
    print(f'Removed: {removed}')
    print(f'Remaining: {len(remaining)}')
    
    # Categorize remaining
    memorial = []
    funeral = []
    other = []
    
    for name, email, phone, website in remaining:
        name_lower = (name or '').lower()
        if any(x in name_lower for x in ['monument', 'memorial', 'gravestone', 'headstone', 'cemetery', 'grave']):
            memorial.append((name, email, phone, website))
        elif any(x in name_lower for x in ['funeral', 'crematory', 'cremation']):
            funeral.append((name, email, phone, website))
        else:
            other.append((name, email, phone, website))
    
    print(f'\nMemorial/Monument businesses ({len(memorial)}):')
    for name, email, phone, website in memorial:
        print(f'  {name} | {email or "no email"} | {phone or "no phone"}')
    
    print(f'\nFuneral/Cremation businesses ({len(funeral)}):')
    for name, email, phone, website in funeral:
        print(f'  {name} | {email or "no email"} | {phone or "no phone"}')
    
    print(f'\nOther memorial services ({len(other)}):')
    for name, email, phone, website in other:
        print(f'  {name} | {email or "no email"} | {phone or "no phone"}')
    
    conn.close()

if __name__ == '__main__':
    main()
