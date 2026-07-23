#!/usr/bin/env python3
"""
Bulk Lead Scraper v2 - Multi-source, ICP-driven lead generation.

Usage:
  python scraper.py bulk --icp "dental practices in Austin TX" --count 50 --client-id 1
  python scraper.py search "HVAC companies Dallas"
  python scraper.py scrape https://example.com
  python scraper.py enrich '{"company_name": "...", "website": "..."}'
  python scraper.py sources  # list available source templates
"""

import sys
import json
import re
import time
import urllib.request
import urllib.parse
import urllib.error
import ssl
import html as html_module
from html.parser import HTMLParser
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Text / HTML helpers
# ---------------------------------------------------------------------------

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self._skip = False
        self._skip_tags = {"script", "style", "noscript"}
    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags: self._skip = True
    def handle_endtag(self, tag):
        if tag in self._skip_tags: self._skip = False
    def handle_data(self, data):
        if not self._skip: self.text.append(data.strip())
    def get_text(self):
        return " ".join(t for t in self.text if t)


def fetch_url(url, timeout=15):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset, errors="replace")
    except Exception as e:
        return f"ERROR: {e}"


def html_to_text(html_content):
    extractor = TextExtractor()
    try: extractor.feed(html_content)
    except Exception: pass
    return extractor.get_text()


def extract_emails(text):
    return list(set(re.findall(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)))


def extract_phones(text):
    phones = []
    for p in [r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', r'\d{3}[-.\s]\d{3}[-.\s]\d{4}']:
        phones.extend(re.findall(p, text))
    return list(set(phones))


def extract_social_links(html_content):
    social = {}
    patterns = {
        "linkedin": r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[^\s"\'<>]+',
        "twitter": r'https?://(?:www\.)?(?:twitter|x)\.com/[^\s"\'<>]+',
        "facebook": r'https?://(?:www\.)?facebook\.com/[^\s"\'<>]+',
        "instagram": r'https?://(?:www\.)?instagram\.com/[^\s"\'<>]+',
    }
    for platform, pattern in patterns.items():
        matches = re.findall(pattern, html_content, re.IGNORECASE)
        if matches:
            social[platform] = matches[0].split('"')[0].split("'")[0].split("<")[0]
    return social


def extract_company_info(html_content, url):
    text = html_to_text(html_content)
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html_content, re.IGNORECASE)
    title = title_match.group(1).strip() if title_match else ""
    desc_match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)',
        html_content, re.IGNORECASE
    )
    description = desc_match.group(1).strip() if desc_match else ""

    # Also try og:site_name or og:title for company name
    og_name = re.search(
        r'<meta\s+(?:property|name)=["\']og:(?:site_name|title)["\']\s+content=["\']([^"\']+)',
        html_content, re.IGNORECASE
    )
    if og_name and not title:
        title = og_name.group(1).strip()

    industry_keywords = [
        "dental", "dentist", "medical", "health", "legal", "law", "attorney",
        "accounting", "accountant", "real estate", "restaurant", "retail",
        "construction", "plumbing", "hvac", "electric", "electrician",
        "roofing", "marketing", "consulting", "technology", "software",
        "fitness", "gym", "salon", "spa", "automotive", "auto repair",
        "insurance", "finance", "banking", "nonprofit", "education",
        "chiropractic", "chiropractor", "veterinary", "vet", "pet",
        "cleaning", "janitorial", "landscaping", "tree service",
        "pest control", "moving", "storage", "printing", "photography",
        "wedding", "event planning", "catering", "bakery", "brewery",
    ]
    detected_industry = ""
    text_lower = text.lower()
    for kw in industry_keywords:
        if kw in text_lower:
            detected_industry = kw.title()
            break

    return {
        "company_name": html_module.unescape(title.split(" - ")[0].split(" | ")[0].strip()) if title else "",
        "website": url,
        "description": html_module.unescape(description[:200]),
        "emails": extract_emails(text)[:5],
        "phones": extract_phones(text)[:3],
        "social": extract_social_links(html_content),
        "industry_hint": detected_industry,
    }


# ---------------------------------------------------------------------------
# Search sources
# ---------------------------------------------------------------------------

def search_ddgs(query, max_results=10):
    """Search via DuckDuckGo (ddgs package)."""
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results_raw = list(ddgs.text(query, max_results=max_results))
        return [{"url": r.get("href", ""), "title": r.get("title", ""), "snippet": r.get("body", "")} for r in results_raw]
    except Exception as e:
        return [{"error": str(e)}]


def search_yelp(query, location="", max_results=5):
    """Search Yelp for businesses."""
    q = f"{query} {location}".strip()
    search_results = search_ddgs(f"site:yelp.com {q}", max_results=max_results)
    yelp_leads = []
    for r in search_results:
        url = r.get("url", "")
        if "yelp.com/biz/" in url:
            # Extract business name from Yelp URL
            biz_name = url.split("/biz/")[-1].split("?")[0].split("#")[0]
            biz_name = biz_name.replace("-", " ").title()
            yelp_leads.append({
                "url": url,
                "company_name": biz_name,
                "source": "yelp",
                "snippet": r.get("snippet", ""),
            })
    return yelp_leads


def search_google_maps_query(query, location=""):
    """Search Google Maps via DDGS."""
    q = f"{query} {location} site:google.com/maps".strip()
    return search_ddgs(q, max_results=8)


def search_chamber(query, location=""):
    """Search chamber of commerce sites."""
    q = f"{query} {location} chamber of commerce member directory".strip()
    results = search_ddgs(q, max_results=5)
    return [r for r in results if "chamber" in r.get("url", "").lower() or "member" in r.get("snippet", "").lower()]


def search_bbb(query, location=""):
    """Search BBB for businesses."""
    q = f"{query} {location} site:bbb.org".strip()
    return search_ddgs(q, max_results=5)


def search_industry_directories(query, location=""):
    """Search industry-specific directories."""
    # Generate directory search queries
    queries = [
        f"{query} {location} directory listing",
        f"{query} {location} near me contact",
        f"{query} {location} reviews phone number",
    ]
    all_results = []
    for q in queries:
        results = search_ddgs(q, max_results=5)
        all_results.extend(results)
        time.sleep(0.5)  # Rate limit
    return all_results


def search_general(query, location="", max_results=15):
    """General web search for businesses."""
    q = f"{query} {location}".strip()
    results = search_ddgs(q, max_results=max_results)
    # Filter out social media, news, Wikipedia
    skip_domains = [
        "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
        "youtube.com", "reddit.com", "wikipedia.org", "yelp.com", "google.com",
        "mapquest.com", "yellowpages.com", "bing.com",
    ]
    filtered = []
    for r in results:
        url = r.get("url", "")
        domain = urlparse(url).netloc.lower()
        if not any(s in domain for s in skip_domains):
            filtered.append(r)
    return filtered


# ---------------------------------------------------------------------------
# ICP to search queries
# ---------------------------------------------------------------------------

def icp_to_queries(icp, location=""):
    """
    Convert an ideal customer profile description into multiple search queries.
    The ICP can be freeform like "dental practices" or "plumbing companies".
    """
    icp_lower = icp.lower().strip()
    
    # Extract the core business type from the ICP
    # Common patterns: "X practices", "X companies", "X services", "X businesses"
    queries = []
    
    # Direct ICP search
    queries.append(f"{icp} {location}".strip())
    
    # Add variations
    if "dental" in icp_lower or "dentist" in icp_lower:
        queries.extend([
            f"dental practices {location}",
            f"dental clinics {location}",
            f"family dentists {location}",
            f"cosmetic dentists {location}",
            f"dental offices {location}",
        ])
    elif "plumb" in icp_lower:
        queries.extend([
            f"plumbing companies {location}",
            f"plumbing contractors {location}",
            f"plumbers {location}",
            f"plumbing services {location}",
        ])
    elif "hvac" in icp_lower or "heating" in icp_lower or "cooling" in icp_lower:
        queries.extend([
            f"HVAC companies {location}",
            f"HVAC contractors {location}",
            f"heating and cooling {location}",
            f"air conditioning {location}",
        ])
    elif "roof" in icp_lower:
        queries.extend([
            f"roofing companies {location}",
            f"roofing contractors {location}",
            f"roof repair {location}",
        ])
    elif "electric" in icp_lower:
        queries.extend([
            f"electricians {location}",
            f"electrical contractors {location}",
            f"electrical services {location}",
        ])
    elif "law" in icp_lower or "legal" in icp_lower or "attorney" in icp_lower:
        queries.extend([
            f"law firms {location}",
            f"attorneys {location}",
            f"legal services {location}",
        ])
    elif "account" in icp_lower:
        queries.extend([
            f"accounting firms {location}",
            f"CPA firms {location}",
            f"accountants {location}",
        ])
    elif "restaurant" in icp_lower or "food" in icp_lower:
        queries.extend([
            f"restaurants {location}",
            f" eateries {location}",
            f"food businesses {location}",
        ])
    elif "fitness" in icp_lower or "gym" in icp_lower:
        queries.extend([
            f"fitness centers {location}",
            f"gyms {location}",
            f"personal trainers {location}",
        ])
    elif "salon" in icp_lower or "beauty" in icp_lower:
        queries.extend([
            f"hair salons {location}",
            f"beauty salons {location}",
            f"nail salons {location}",
        ])
    elif "real estate" in icp_lower or "realtor" in icp_lower:
        queries.extend([
            f"real estate agencies {location}",
            f"realtors {location}",
            f"property managers {location}",
        ])
    elif "market" in icp_lower:
        queries.extend([
            f"marketing agencies {location}",
            f"marketing firms {location}",
            f"digital marketing {location}",
        ])
    else:
        # Generic: just add variations
        queries.extend([
            f"{icp} near {location}",
            f"{icp} contact info {location}",
        ])
    
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for q in queries:
        q_lower = q.lower().strip()
        if q_lower not in seen:
            seen.add(q_lower)
            unique.append(q)
    
    return unique


# ---------------------------------------------------------------------------
# Bulk scrape pipeline
# ---------------------------------------------------------------------------

def is_aggregator_url(url):
    """Check if a URL is from an aggregator/directory (skip scraping these directly)."""
    skip = [
        "yelp.com", "google.com", "facebook.com", "twitter.com", "x.com",
        "linkedin.com", "instagram.com", "youtube.com", "reddit.com",
        "wikipedia.org", "mapquest.com", "yellowpages.com", "bbb.org",
        "angieslist.com", "angi.com", "thumbtack.com", "homeadvisor.com",
        "apple.com", "microsoft.com", "amazon.com",
    ]
    domain = urlparse(url).netloc.lower()
    return any(s in domain for s in skip)


def bulk_scrape(icp, location="", target_count=50, client_id=None, progress_callback=None):
    """
    Full bulk scrape pipeline:
    1. Convert ICP to search queries
    2. Search across multiple sources
    3. Deduplicate URLs
    4. Scrape each unique website
    5. Save to database
    """
    queries = icp_to_queries(icp, location)
    
    all_urls = []
    seen_domains = set()
    
    # Phase 1: Collect URLs from multiple sources
    if progress_callback:
        progress_callback({"phase": "searching", "current": 0, "total": len(queries), "message": f"Searching {len(queries)} queries..."})
    
    for i, query in enumerate(queries):
        if progress_callback:
            progress_callback({"phase": "searching", "current": i + 1, "total": len(queries), "message": f"Searching: {query}"})
        
        # General search
        results = search_general(query, location, max_results=10)
        for r in results:
            url = r.get("url", "")
            if not url:
                continue
            domain = urlparse(url).netloc.lower().lstrip("www.")
            if domain not in seen_domains and not is_aggregator_url(url):
                seen_domains.add(domain)
                all_urls.append({
                    "url": url,
                    "title": r.get("title", ""),
                    "snippet": r.get("snippet", ""),
                    "source_query": query,
                })
        
        time.sleep(0.3)  # Rate limit between queries
    
    # Phase 2: Scrape websites (take as many as needed to hit target)
    urls_to_scrape = all_urls[:target_count + 20]  # Extra buffer for failures
    
    if progress_callback:
        progress_callback({"phase": "scraping", "current": 0, "total": len(urls_to_scrape), "message": f"Scraping {len(urls_to_scrape)} websites..."})
    
    scraped = []
    for i, item in enumerate(urls_to_scrape):
        if len(scraped) >= target_count:
            break
        
        if progress_callback:
            progress_callback({"phase": "scraping", "current": i + 1, "total": len(urls_to_scrape), "message": f"Scraping ({i+1}/{len(urls_to_scrape)}): {item['url'][:60]}"})
        
        try:
            info = scrape_website(item["url"])
            if not info.get("error") and info.get("company_name"):
                info["source_query"] = item.get("source_query", "")
                info["source_title"] = item.get("title", "")
                scraped.append(info)
        except Exception:
            pass
        
        time.sleep(0.2)  # Be polite
    
    return {
        "icp": icp,
        "location": location,
        "queries_used": queries,
        "total_urls_found": len(all_urls),
        "total_scraped": len(scraped),
        "leads": scraped,
    }


# ---------------------------------------------------------------------------
# Single operations
# ---------------------------------------------------------------------------

def search_leads(query, max_results=10):
    results = search_general(query, max_results=max_results)
    return {"query": query, "results": results}


def scrape_website(url):
    html_content = fetch_url(url)
    if html_content.startswith("ERROR"):
        return {"error": html_content, "url": url}
    return extract_company_info(html_content, url)


def enrich_lead(lead_data):
    if isinstance(lead_data, str):
        lead_data = json.loads(lead_data)
    website = lead_data.get("website", "")
    if not website:
        return {**lead_data, "enrichment_error": "No website provided"}
    html_content = fetch_url(website)
    if html_content.startswith("ERROR"):
        return {**lead_data, "enrichment_error": html_content}
    info = extract_company_info(html_content, website)
    enriched = {**lead_data}
    for key, val in info.items():
        if val and not enriched.get(key):
            enriched[key] = val
        elif key in ("emails", "phones") and isinstance(val, list):
            existing = enriched.get(key, [])
            enriched[key] = list(set(existing + val))
        elif key == "social" and isinstance(val, dict):
            existing = enriched.get(key, {})
            enriched[key] = {**existing, **val}
    return enriched


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scraper.py <bulk|search|scrape|enrich|sources> [args]"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "bulk":
        # Parse args
        icp = ""
        location = ""
        count = 50
        client_id = None
        i = 2
        while i < len(sys.argv):
            if sys.argv[i] == "--icp" and i + 1 < len(sys.argv):
                icp = sys.argv[i + 1]; i += 2
            elif sys.argv[i] == "--location" and i + 1 < len(sys.argv):
                location = sys.argv[i + 1]; i += 2
            elif sys.argv[i] == "--count" and i + 1 < len(sys.argv):
                count = int(sys.argv[i + 1]); i += 2
            elif sys.argv[i] == "--client-id" and i + 1 < len(sys.argv):
                client_id = int(sys.argv[i + 1]); i += 2
            else:
                i += 1

        if not icp:
            print(json.dumps({"error": "--icp is required"}))
            sys.exit(1)

        def print_progress(p):
            print(json.dumps(p), file=sys.stderr, flush=True)

        result = bulk_scrape(icp, location, count, client_id, print_progress)
        print(json.dumps(result, indent=2))

    elif command == "search":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(search_leads(query), indent=2))

    elif command == "scrape":
        url = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(scrape_website(url), indent=2))

    elif command == "enrich":
        lead_json = sys.argv[2] if len(sys.argv) > 2 else "{}"
        print(json.dumps(enrich_lead(lead_json), indent=2))

    elif command == "sources":
        print(json.dumps({
            "sources": ["DuckDuckGo (general web)", "Yelp (via search)", "BBB (via search)", "Industry directories", "Chamber of commerce (via search)"],
            "description": "All sources are queried via web search. Individual sites are scraped for contact info.",
        }, indent=2))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)
