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
    print(f'Total Kevin leads before aggressive cleanup: {len(leads)}')
    
    removed = 0
    
    for lead in leads:
        lead_id, name, website, email, phone, notes = lead
        name_lower = (name or '').lower()
        website_lower = (website or '').lower()
        notes_lower = (notes or '').lower()
        
        should_remove = False
        reason = ''
        
        # Remove leads with "None" name (old junk data)
        if not name or name == 'None' or name_lower == 'none':
            should_remove = True
            reason = 'No business name'
        
        # Remove leads with no website (old phone-only junk)
        if not should_remove and not website:
            should_remove = True
            reason = 'No website'
        
        # Remove government/non-profit sites
        if not should_remove:
            gov_domains = ['.gov', '.org', 'govt', 'government', 'department', 'association']
            if any(g in website_lower for g in gov_domains):
                should_remove = True
                reason = 'Government/non-profit'
        
        # Remove major national brands
        if not should_remove:
            national = ['dignitymemorial', 'findagrave', 'legacy.com', 'gatesfoundation', 
                       'dol.wa.gov', 'tiktok.com', 'example@example', 'facebook.com',
                       'yelp.com', 'youtube.com', 'google.com', 'bing.com']
            if any(n in website_lower for n in national):
                should_remove = True
                reason = 'National brand/directory'
        
        # Remove non-memorial businesses
        if not should_remove:
            non_memorial = ['cleaning', 'urgent care', 'hospital', 'medical', 'health',
                          'plumbing', 'electric', 'hvac', 'roof', 'construction',
                          'auto', 'car', 'subaru', 'detailing', 'carpet', 'duct',
                          'water damage', 'fire damage', 'restoration', 'landscap',
                          'lawn', 'dumpster', 'gutter', 'geothermal', 'apartment',
                          'rent', 'foreclosure', 'real estate', 'insurance',
                          'lawyer', 'attorney', 'dental', 'veterinary', 'vet']
            if any(n in name_lower or n in website_lower for n in non_memorial):
                should_remove = True
                reason = 'Not memorial business'
        
        # Remove duplicates (keep first occurrence)
        if not should_remove:
            # Check for duplicate websites
            c2 = conn.cursor()
            c2.execute('SELECT COUNT(*) FROM leads WHERE website_url = ? AND id != ?', (website, lead_id))
            if c2.fetchone()[0] > 0:
                should_remove = True
                reason = 'Duplicate website'
        
        # Remove toll-free numbers
        if not should_remove and phone:
            phone_clean = phone.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
            if phone_clean.startswith(('800', '888', '877', '866', '855', '844', '833')):
                should_remove = True
                reason = 'Toll-free number'
        
        # Remove fake emails
        if not should_remove and email:
            fake = ['example@', 'user@', 'you@', 'name@', 'your@', 'noreply']
            if any(f in email.lower() for f in fake):
                should_remove = True
                reason = 'Fake email'
        
        if should_remove:
            c.execute('DELETE FROM client_leads WHERE lead_id = ? AND client_id = 2', (lead_id,))
            c.execute('DELETE FROM leads WHERE id = ?', (lead_id,))
            removed += 1
            print(f'  [REMOVED] {name} - {reason}')
    
    conn.commit()
    
    # Show what's left
    c.execute('''SELECT l.company_name, l.contact_email, l.contact_phone, l.website_url 
                 FROM leads l 
                 JOIN client_leads cl ON l.id = cl.lead_id 
                 WHERE cl.client_id = 2''')
    
    remaining = c.fetchall()
    print(f'\n=== KEVIN AGGRESSIVE CLEANUP COMPLETE ===')
    print(f'Removed: {removed}')
    print(f'Remaining: {len(remaining)}')
    
    print(f'\nValid Kevin leads:')
    for name, email, phone, website in remaining:
        print(f'  {name} | {email or "no email"} | {phone or "no phone"} | {website or "no website"}')
    
    conn.close()

if __name__ == '__main__':
    main()
