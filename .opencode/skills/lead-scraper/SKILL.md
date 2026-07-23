---
name: lead-scraper
description: Use when scraping leads from the web for a client. Triggers on requests like "find leads for", "scrape leads", "search for companies", "find prospects". Searches the web, scrapes company websites, extracts contact info, and saves leads to the database.
---

# Lead Scraper Skill

Scrapes potential business leads from the web and saves them to the LeadGen Pipeline database.

## How It Works

1. **Search Phase**: Uses DuckDuckGo to find businesses matching the client's ideal customer profile
2. **Scrape Phase**: Visits each found website to extract:
   - Company name, email, phone
   - Social media links (LinkedIn, Facebook, Instagram, Twitter)
   - Industry detection
3. **Save Phase**: Inserts leads into the SQLite database with status "new"

## Usage

### Via API (recommended)
```bash
# Bulk search + scrape (finds and saves ~8 leads)
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"action":"bulk_search","query":"dental practices Austin TX","clientId":1}'

# Single URL scrape
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"action":"scrape_and_save","url":"https://example.com","clientId":1}'
```

### Via Python script directly
```bash
python scripts/scraper.py search "HVAC companies Dallas"
python scripts/scraper.py scrape "https://example.com"
python scripts/scraper.py enrich '{"company_name":"...","website":"..."}'
```

### Via Dashboard
Navigate to `/scrape` in the web dashboard for a visual interface.

## Search Query Tips

Good search queries include:
- Industry + location: "dental practices Austin TX"
- Business type + area: "restaurants near downtown Chicago"
- Service + region: "commercial roofing companies Atlanta"
- Niche + city: "boutique fitness studios Denver"

## After Scraping

Once leads are saved, use the **lead-analyzer** skill to score and enrich them, then the **lead-reporter** skill to generate reports.
