#!/usr/bin/env python3
"""
Lead Scraper - scrapes company/contact info from web sources.
Outputs JSON to stdout for the Next.js API to consume.

Usage:
  python scraper.py search "dentist Austin TX"
  python scraper.py scrape https://example.com
  python scraper.py enrich '{"company_name": "...", "website": "..."}'
"""

import sys
import json
import re
import urllib.request
import urllib.parse
import urllib.error
import ssl
from html.parser import HTMLParser


class TextExtractor(HTMLParser):
    """Strip HTML to text."""
    def __init__(self):
        super().__init__()
        self.text = []
        self._skip = False
        self._skip_tags = {"script", "style", "noscript"}

    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags:
            self._skip = True

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            self.text.append(data.strip())

    def get_text(self):
        return " ".join(t for t in self.text if t)


def fetch_url(url, timeout=15):
    """Fetch a URL and return the HTML content."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset, errors="replace")
    except Exception as e:
        return f"ERROR: {e}"


def html_to_text(html):
    """Convert HTML to plain text."""
    extractor = TextExtractor()
    try:
        extractor.feed(html)
    except Exception:
        pass
    return extractor.get_text()


def extract_emails(text):
    """Extract email addresses from text."""
    pattern = r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
    return list(set(re.findall(pattern, text)))


def extract_phones(text):
    """Extract phone numbers from text."""
    patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',
    ]
    phones = []
    for p in patterns:
        phones.extend(re.findall(p, text))
    return list(set(phones))


def extract_social_links(html):
    """Extract social media links from HTML."""
    social = {}
    patterns = {
        "linkedin": r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[^\s"\'<>]+',
        "twitter": r'https?://(?:www\.)?(?:twitter|x)\.com/[^\s"\'<>]+',
        "facebook": r'https?://(?:www\.)?facebook\.com/[^\s"\'<>]+',
        "instagram": r'https?://(?:www\.)?instagram\.com/[^\s"\'<>]+',
    }
    for platform, pattern in patterns.items():
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            social[platform] = matches[0].split('"')[0].split("'")[0].split("<")[0]
    return social


def extract_company_info(html, url):
    """Extract structured company info from a webpage."""
    text = html_to_text(html)
    emails = extract_emails(text)
    phones = extract_phones(text)
    social = extract_social_links(html)

    # Try to find company name from title tag
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    title = title_match.group(1).strip() if title_match else ""

    # Try meta description
    desc_match = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)',
        html, re.IGNORECASE
    )
    description = desc_match.group(1).strip() if desc_match else ""

    # Look for industry keywords
    industry_keywords = [
        "dental", "dentist", "medical", "health", "legal", "law", "accounting",
        "real estate", "restaurant", "retail", "construction", "plumbing",
        "hvac", "electric", "roofing", "marketing", "consulting", "technology",
        "software", "fitness", "gym", "salon", "spa", "automotive", "auto",
        "insurance", "finance", "banking", "nonprofit", "education",
    ]
    detected_industry = ""
    text_lower = text.lower()
    for kw in industry_keywords:
        if kw in text_lower:
            detected_industry = kw.title()
            break

    return {
        "company_name": title.split(" - ")[0].split(" | ")[0].strip() if title else "",
        "website": url,
        "description": description[:200],
        "emails": emails[:5],
        "phones": phones[:3],
        "social": social,
        "industry_hint": detected_industry,
    }


def search_leads(query, max_results=10):
    """
    Search for leads using DuckDuckGo HTML (no API key needed).
    Returns a list of URLs with snippets.
    """
    encoded = urllib.parse.quote_plus(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded}"
    html = fetch_url(url)

    if html.startswith("ERROR"):
        return {"error": html, "results": []}

    # Extract result links and snippets
    results = []
    # DuckDuckGo HTML results pattern
    link_pattern = r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</a>'
    snippet_pattern = r'<a[^>]+class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</a>'

    links = re.findall(link_pattern, html)
    snippets = re.findall(snippet_pattern, html)

    # Clean HTML tags from snippets
    def clean(s):
        return re.sub(r'<[^>]+>', '', s).strip()

    for i, (link, title) in enumerate(links[:max_results]):
        # Decode DuckDuckGo redirect URL
        if "uddg=" in link:
            link = urllib.parse.unquote(link.split("uddg=")[1].split("&")[0])
        snippet = clean(snippets[i]) if i < len(snippets) else ""
        results.append({
            "url": link,
            "title": clean(title),
            "snippet": snippet,
        })

    return {"query": query, "results": results}


def scrape_website(url):
    """Scrape a single website for company/contact info."""
    html = fetch_url(url)
    if html.startswith("ERROR"):
        return {"error": html, "url": url}
    return extract_company_info(html, url)


def enrich_lead(lead_data):
    """Enrich a lead with data from its website."""
    if isinstance(lead_data, str):
        lead_data = json.loads(lead_data)

    website = lead_data.get("website", "")
    if not website:
        return {**lead_data, "enrichment_error": "No website provided"}

    html = fetch_url(website)
    if html.startswith("ERROR"):
        return {**lead_data, "enrichment_error": html}

    info = extract_company_info(html, website)
    # Merge, preferring existing data
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


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scraper.py <search|scrape|enrich> <argument>"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "search":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        result = search_leads(query)
        print(json.dumps(result, indent=2))

    elif command == "scrape":
        url = sys.argv[2] if len(sys.argv) > 2 else ""
        result = scrape_website(url)
        print(json.dumps(result, indent=2))

    elif command == "enrich":
        lead_json = sys.argv[2] if len(sys.argv) > 2 else "{}"
        result = enrich_lead(lead_json)
        print(json.dumps(result, indent=2))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)
