#!/usr/bin/env python3
"""
Cemetery Lead Finder - Finds people connected to Yakima-area cemeteries.
Sources: FindAGrave, Google Maps reviews, Facebook groups, obituaries, genealogy forums.
"""

import json
import re
import time
import sys
import urllib.request
import urllib.parse
import ssl
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self._skip = False
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"): self._skip = True
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"): self._skip = False
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

def search_ddgs(query, max_results=10):
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results_raw = list(ddgs.text(query, max_results=max_results))
        return [{"url": r.get("href", ""), "title": r.get("title", ""), "snippet": r.get("body", "")} for r in results_raw]
    except Exception as e:
        return [{"error": str(e)}]

# --- Source-specific searches ---

def search_findagrave(cemetery_name, location, max_results=15):
    """Search FindAGrave for people who added photos/comments to a cemetery."""
    queries = [
        f"site:findagrave.com {cemetery_name} {location}",
        f"site:findagrave.com {location} cemetery recent additions",
        f"findagrave {cemetery_name} flowers photos {location}",
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            url = r.get("url", "")
            if "findagrave.com" in url:
                # Extract person names from FindAGrave URLs and snippets
                snippet = r.get("snippet", "")
                title = r.get("title", "")
                # FindAGrave URLs often have the person's name
                name_match = re.search(r'findagrave\.com/memorial/(\d+)/([^/]+)', url)
                if name_match:
                    full_name = name_match.group(2).replace("-", " ").title()
                    leads.append({
                        "name": full_name,
                        "source": "FindAGrave",
                        "source_url": url,
                        "hook": f"Active on FindAGrave - {snippet[:150]}",
                        "cemetery": cemetery_name,
                    })
                # Also extract from snippets about people visiting/adding
                visitor_match = re.findall(r'(?:added by|photo by|maintained by|visited by)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)', snippet, re.IGNORECASE)
                for vm in visitor_match:
                    leads.append({
                        "name": vm,
                        "source": "FindAGrave",
                        "source_url": url,
                        "hook": f"Maintains/visits graves at {cemetery_name} - {snippet[:100]}",
                        "cemetery": cemetery_name,
                    })
        time.sleep(0.5)
    return leads

def search_google_maps_cemetery_reviews(cemetery_name, location, max_results=10):
    """Search for people who reviewed cemeteries on Google Maps."""
    queries = [
        f'"{cemetery_name}" {location} review "my family" OR "my mother" OR "my father" OR "my grandmother" OR "my grandfather"',
        f'"{cemetery_name}" {location} google review headstone grave',
        f'{cemetery_name} {location} yelp review cemetery',
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            snippet = r.get("snippet", "")
            url = r.get("url", "")
            # Extract reviewer names from snippets
            name_patterns = [
                r'(?:review(?:ed)?|by)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
                r'"([A-Z][a-z]+\s+[A-Z][a-z]+)"',
            ]
            for pattern in name_patterns:
                matches = re.findall(pattern, snippet)
                for m in matches:
                    if len(m) > 4 and not any(skip in m.lower() for skip in ["google", "facebook", "yelp", "findagrave"]):
                        leads.append({
                            "name": m,
                            "source": "Google Maps Review",
                            "source_url": url,
                            "hook": f"Reviewed {cemetery_name} - mentioned family graves. {snippet[:100]}",
                            "cemetery": cemetery_name,
                        })
        time.sleep(0.5)
    return leads

def search_facebook_groups(location, max_results=15):
    """Search Facebook groups for people posting about cemeteries/headstones."""
    queries = [
        f"site:facebook.com {location} cemetery group headstone",
        f"site:facebook.com {location} genealogy group family history",
        f"site:facebook.com {location} memorial group graves",
        f"facebook.com {location} cemetery cleaning restoration",
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            title = r.get("title", "")
            if "facebook.com" in url:
                # Extract names from Facebook post snippets
                name_patterns = [
                    r'(?:posted by|shared by|commented|replied)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
                    r'"([A-Z][a-z]+\s+[A-Z][a-z]+)"\s+(?:said|wrote|posted|commented)',
                ]
                for pattern in name_patterns:
                    matches = re.findall(pattern, snippet)
                    for m in matches:
                        if not any(skip in m.lower() for skip in ["facebook", "meta", "mark"]):
                            leads.append({
                                "name": m,
                                "source": "Facebook Group",
                                "source_url": url,
                                "hook": f"Active in {location} cemetery/memorial Facebook group - {snippet[:100]}",
                                "cemetery": "Various",
                            })
        time.sleep(0.5)
    return leads

def search_obituaries(location, max_results=15):
    """Search obituaries for family contacts."""
    queries = [
        f"obituary {location} 2025 2026 family headstone",
        f"site:legacy.com obituary {location}",
        f"site:yakima-herald.com obituary {location}",
        f"{location} obituary survived by family member",
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            title = r.get("title", "")
            # Extract family member names from obituary snippets
            family_patterns = [
                r'(?:survived by|beloved|loving)\s+(?:wife|husband|son|daughter|mother|father|sister|brother)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
                r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:of\s+)?(?:Yakima|Selah|Union Gap|West Valley|Moxee|Terrace Heights)',
            ]
            for pattern in family_patterns:
                matches = re.findall(pattern, snippet)
                for m in matches:
                    if not any(skip in m.lower() for skip in ["legacy", "yakima", "herald", "tribute"]):
                        leads.append({
                            "name": m,
                            "source": "Obituary",
                            "source_url": url,
                            "hook": f"Family member mentioned in obituary - potential headstone care need. {snippet[:100]}",
                            "cemetery": "Likely Yakima-area",
                        })
        time.sleep(0.5)
    return leads

def search_genealogy_forums(location, max_results=10):
    """Search genealogy forums for people researching Yakima-area families."""
    queries = [
        f"genealogy forum {location} cemetery records family plots",
        f"site:rootsweb.com {location} cemetery",
        f"site:ancestry.com {location} cemetery headstone",
        f"genealogy {location} Yakima Valley family history headstone",
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            # Extract usernames/poster names
            name_patterns = [
                r'(?:posted by|author:|user:)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
                r'"([A-Z][a-z]+\s+[A-Z][a-z]+)"\s+(?:wrote|said|posted)',
            ]
            for pattern in name_patterns:
                matches = re.findall(pattern, snippet)
                for m in matches:
                    leads.append({
                        "name": m,
                        "source": "Genealogy Forum",
                        "source_url": url,
                        "hook": f"Genealogy researcher tracking {location} family plots - {snippet[:100]}",
                        "cemetery": "Various Yakima-area",
                    })
        time.sleep(0.5)
    return leads

def search_funeral_homes(location, max_results=10):
    """Search funeral home websites for recent obituaries/contacts."""
    queries = [
        f"funeral home {location} recent obituaries 2025 2026",
        f"site:brooksidefuneral.com OR site:shawandsons.com {location}",
        f"{location} funeral home obituary family contact",
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            # Extract family names from funeral home obituaries
            family_patterns = [
                r'(?:survived by|beloved)\s+(?:wife|husband|son|daughter|mother|father|sister|brother)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
                r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:of\s+)?(?:Yakima|Selah|Union Gap)',
            ]
            for pattern in family_patterns:
                matches = re.findall(pattern, snippet)
                for m in matches:
                    leads.append({
                        "name": m,
                        "source": "Funeral Home",
                        "source_url": url,
                        "hook": f"Family contact from funeral home listing - potential headstone care. {snippet[:100]}",
                        "cemetery": "Yakima-area",
                    })
        time.sleep(0.5)
    return leads

def search_senior_centers(location, max_results=10):
    """Search senior centers for community contacts."""
    queries = [
        f"senior center {location} community events memorial",
        f"{location} senior center activities cemetery memorial day",
        f"harman center {location} OR senior center {location} events",
    ]
    leads = []
    for q in queries:
        results = search_ddgs(q, max_results=max_results)
        for r in results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            name_patterns = [
                r'(?:organized by|coordinated by|led by|contact:?)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
                r'"([A-Z][a-z]+\s+[A-Z][a-z]+)"',
            ]
            for pattern in name_patterns:
                matches = re.findall(pattern, snippet)
                for m in matches:
                    if not any(skip in m.lower() for skip in ["senior", "center", "yakima", "harman"]):
                        leads.append({
                            "name": m,
                            "source": "Senior Center",
                            "source_url": url,
                            "hook": f"Senior center community contact - {snippet[:100]}",
                            "cemetery": "Yakima-area",
                        })
        time.sleep(0.5)
    return leads

def deduplicate_leads(leads):
    """Remove duplicate leads by name."""
    seen = set()
    unique = []
    for lead in leads:
        name_key = lead["name"].lower().strip()
        if name_key not in seen and len(name_key) > 3:
            seen.add(name_key)
            unique.append(lead)
    return unique

def run_full_search(target_count=90):
    """Run all searches and return deduplicated leads."""
    location = "Yakima WA"
    cemeteries = [
        "Tahoma Cemetery", "Terrace Heights Memorial Park",
        "West Hills Memorial Park", "Calvary Cemetery",
        "Ahtanum Cemetery", "Holy Rosary Cemetery",
    ]
    
    all_leads = []
    
    print("=== Searching FindAGrave ===", file=sys.stderr)
    for cemetery in cemeteries:
        leads = search_findagrave(cemetery, location, max_results=5)
        all_leads.extend(leads)
        print(f"  {cemetery}: {len(leads)} leads", file=sys.stderr)
    
    print("=== Searching Google Maps Reviews ===", file=sys.stderr)
    for cemetery in cemeteries[:4]:
        leads = search_google_maps_cemetery_reviews(cemetery, location, max_results=5)
        all_leads.extend(leads)
        print(f"  {cemetery}: {len(leads)} leads", file=sys.stderr)
    
    print("=== Searching Facebook Groups ===", file=sys.stderr)
    leads = search_facebook_groups(location, max_results=15)
    all_leads.extend(leads)
    print(f"  Facebook: {len(leads)} leads", file=sys.stderr)
    
    print("=== Searching Obituaries ===", file=sys.stderr)
    leads = search_obituaries(location, max_results=15)
    all_leads.extend(leads)
    print(f"  Obituaries: {len(leads)} leads", file=sys.stderr)
    
    print("=== Searching Genealogy Forums ===", file=sys.stderr)
    leads = search_genealogy_forums(location, max_results=10)
    all_leads.extend(leads)
    print(f"  Genealogy: {len(leads)} leads", file=sys.stderr)
    
    print("=== Searching Funeral Homes ===", file=sys.stderr)
    leads = search_funeral_homes(location, max_results=10)
    all_leads.extend(leads)
    print(f"  Funeral homes: {len(leads)} leads", file=sys.stderr)
    
    print("=== Searching Senior Centers ===", file=sys.stderr)
    leads = search_senior_centers(location, max_results=10)
    all_leads.extend(leads)
    print(f"  Senior centers: {len(leads)} leads", file=sys.stderr)
    
    # Deduplicate
    unique_leads = deduplicate_leads(all_leads)
    print(f"\n=== Total unique leads: {len(unique_leads)} ===", file=sys.stderr)
    
    return unique_leads[:target_count]

if __name__ == "__main__":
    leads = run_full_search(target_count=90)
    print(json.dumps(leads, indent=2))
