import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'local.db')

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check Carter's ICP
c.execute('SELECT id, name, ideal_customer_profile, description FROM clients WHERE id = 7')
row = c.fetchone()
if row:
    print(f"Client: {row[1]} (ID: {row[0]})")
    print(f"ICP: {row[2]}")
    print(f"Description: {row[3]}")

# Check existing leads
c.execute('''SELECT l.company_name, l.website_url, l.contact_email, l.contact_phone, l.location 
             FROM leads l 
             JOIN client_leads cl ON l.id = cl.lead_id 
             WHERE cl.client_id = 7''')
leads = c.fetchall()
print(f"\nExisting leads ({len(leads)}):")
for lead in leads:
    print(f"  {lead[0]} | {lead[2] or 'no email'} | {lead[3] or 'no phone'} | {lead[4] or 'no location'}")

conn.close()
