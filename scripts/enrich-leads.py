#!/usr/bin/env python3
"""
Lead Enrichment Script
Enriches leads in the database with phone numbers, social media profiles,
and Google review URLs using DuckDuckGo search.

Usage:
  python enrich-leads.py              # Enrich all leads without phone
  python enrich-leads.py --limit 10   # Enrich first 10 leads
  python enrich-leads.py --id 5       # Enrich lead #5 only
  python enrich-leads.py --dry-run    # Preview without updating DB
"""

import json
import os
import re
import subprocess
import sys
import time
import traceback
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DB_HELPER = os.path.join(SCRIPT_DIR, "db-helper.js")
NODE_CMD = "node"
SEARCH_DELAY = 2.0  # seconds between searches
PHONE_REGEX = re.compile(
    r"(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}"
)
US_PHONE_CLEAN = re.compile(r"[^\d]")

def log(msg):
    print(f"[enrich] {msg}", flush=True)

def db_call(action, payload=None):
    """Call the Node.js db-helper and return parsed JSON."""
    env = os.environ.copy()
    if payload is not None:
        env["DB_PAYLOAD"] = json.dumps(payload)
    args = [NODE_CMD, DB_HELPER, action]
    result = subprocess.run(args, capture_output=True, text=True, cwd=PROJECT_DIR, env=env)
    if result.returncode != 0:
        raise RuntimeError(f"db-helper error ({action}): {result.stderr.strip()}")
    return json.loads(result.stdout.strip()) if result.stdout.strip() else []

# ---------------------------------------------------------------------------
# DuckDuckGo search wrapper
# ---------------------------------------------------------------------------
def ddgs_search(query, max_results=5):
    """Search DuckDuckGo via the ddgs package."""
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return [
            {
                "url": r.get("href", ""),
                "title": r.get("title", ""),
                "snippet": r.get("body", ""),
            }
            for r in results
        ]
    except Exception as e:
        log(f"  Search error: {e}")
        return []

# ---------------------------------------------------------------------------
# Phone extraction
# ---------------------------------------------------------------------------
def extract_phone(text):
    """Extract a US phone number from text, return formatted or None."""
    matches = PHONE_REGEX.findall(text)
    for raw in matches:
        digits = US_PHONE_CLEAN.sub("", raw)
        if digits.startswith("1") and len(digits) == 11:
            digits = digits[1:]
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return None

def find_phone(lead):
    """Search for a phone number for the lead."""
    company = lead.get("company_name") or ""
    website = lead.get("website_url") or ""
    location = lead.get("location") or ""
    parts = [p for p in [company, location] if p]
    query_base = " ".join(parts)

    # Try: company website contact page
    if website:
        results = ddgs_search(f'"{query_base}" contact phone', max_results=5)
    else:
        results = ddgs_search(f'"{query_base}" phone number contact', max_results=5)

    for r in results:
        text = f"{r['title']} {r['snippet']} {r['url']}"
        phone = extract_phone(text)
        if phone:
            return phone

    time.sleep(SEARCH_DELAY)

    # Second attempt: broader search
    if company:
        results = ddgs_search(f'"{company}" {location} phone', max_results=3)
        for r in results:
            text = f"{r['title']} {r['snippet']}"
            phone = extract_phone(text)
            if phone:
                return phone

    return None

# ---------------------------------------------------------------------------
# Social media search
# ---------------------------------------------------------------------------
def find_facebook(lead):
    """Search for the lead's Facebook page."""
    company = lead.get("company_name") or ""
    contact = lead.get("contact_name") or ""
    location = lead.get("location") or ""

    search_terms = [t for t in [company or contact, location] if t]
    query = f'site:facebook.com "{" ".join(search_terms)}"'
    results = ddgs_search(query, max_results=5)

    for r in results:
        url = r["url"]
        if "facebook.com" in url and any(
            skip not in url.lower()
            for skip in ["/login", "/help", "/policies", "/events"]
        ):
            # Clean URL
            url = url.split("?")[0].rstrip("/")
            return url
    return None


def find_linkedin(lead):
    """Search for the lead's LinkedIn profile."""
    company = lead.get("company_name") or ""
    contact = lead.get("contact_name") or ""

    terms = [t for t in [company, contact] if t]
    if not terms:
        return None

    query = f'site:linkedin.com "{" ".join(terms)}"'
    results = ddgs_search(query, max_results=5)

    for r in results:
        url = r["url"]
        if "linkedin.com" in url and (
            "/company/" in url or "/in/" in url
        ):
            url = url.split("?")[0].rstrip("/")
            return url
    return None


def find_twitter(lead):
    """Search for the lead's Twitter/X profile."""
    company = lead.get("company_name") or ""
    contact = lead.get("contact_name") or ""

    terms = [t for t in [company, contact] if t]
    if not terms:
        return None

    query = f'(site:twitter.com OR site:x.com) "{" ".join(terms)}"'
    results = ddgs_search(query, max_results=5)

    for r in results:
        url = r["url"]
        if "twitter.com" in url or "x.com" in url:
            # Skip Twitter's own pages
            path = urlparse(url).path.strip("/")
            if path and path not in [
                "explore", "search", "notifications", "messages",
                "settings", "privacy", "tos", "signup",
            ]:
                url = url.split("?")[0].rstrip("/")
                return url
    return None


def find_instagram(lead):
    """Search for the lead's Instagram profile."""
    company = lead.get("company_name") or ""
    location = lead.get("location") or ""

    terms = [t for t in [company, location] if t]
    if not terms:
        return None

    query = f'site:instagram.com "{" ".join(terms)}"'
    results = ddgs_search(query, max_results=5)

    for r in results:
        url = r["url"]
        if "instagram.com" in url:
            path = urlparse(url).path.strip("/")
            if path and path not in [
                "explore", "reels", "stories", "accounts",
                "p", "about", "legal", "safety",
            ]:
                url = url.split("?")[0].rstrip("/")
                return url
    return None


def find_google_maps_review(lead):
    """If the source_url or website contains google.com/maps, construct review URL."""
    source = lead.get("source_url") or ""
    website = lead.get("website_url") or ""

    for url_str in [source, website]:
        if not url_str:
            continue
        if "google.com/maps" in url_str or "maps.app.goo.gl" in url_str:
            # Extract the place ID or CID if present, otherwise return the maps URL
            place_match = re.search(r"place/([^/]+)", url_str)
            cid_match = re.search(r"cid=(\d+)", url_str)
            if place_match:
                return f"https://search.google.com/local/writereview?placeid={place_match.group(1)}"
            elif cid_match:
                return url_str  # Keep as-is if we have CID
            else:
                return url_str.split("?")[0] if "?" in url_str else url_str
    return None


# ---------------------------------------------------------------------------
# Enrichment orchestrator
# ---------------------------------------------------------------------------
def enrich_lead(lead):
    """Enrich a single lead. Returns dict of fields to update."""
    lead_id = lead["id"]
    company = lead.get("company_name") or ""
    contact = lead.get("contact_name") or ""
    label = company or contact or f"#{lead_id}"
    log(f"Enriching {label} (id={lead_id})")

    updates = {}
    social_block = []

    # --- Phone ---
    if not lead.get("contact_phone"):
        phone = find_phone(lead)
        if phone:
            updates["contact_phone"] = phone
            social_block.append(f"Phone: {phone}")
            log(f"  Found phone: {phone}")
        time.sleep(SEARCH_DELAY)
    else:
        log(f"  Phone already set: {lead['contact_phone']}")

    # --- Facebook ---
    if not lead.get("contact_facebook"):
        fb = find_facebook(lead)
        if fb:
            updates["contact_facebook"] = fb
            social_block.append(f"Facebook: {fb}")
            log(f"  Found Facebook: {fb}")
        time.sleep(SEARCH_DELAY)
    else:
        log(f"  Facebook already set")

    # --- LinkedIn ---
    if not lead.get("contact_linkedin"):
        li = find_linkedin(lead)
        if li:
            updates["contact_linkedin"] = li
            social_block.append(f"LinkedIn: {li}")
            log(f"  Found LinkedIn: {li}")
        time.sleep(SEARCH_DELAY)
    else:
        log(f"  LinkedIn already set")

    # --- Twitter/X ---
    if not lead.get("contact_twitter"):
        tw = find_twitter(lead)
        if tw:
            updates["contact_twitter"] = tw
            social_block.append(f"Twitter: {tw}")
            log(f"  Found Twitter: {tw}")
        time.sleep(SEARCH_DELAY)
    else:
        log(f"  Twitter already set")

    # --- Instagram ---
    if not lead.get("contact_instagram"):
        ig = find_instagram(lead)
        if ig:
            updates["contact_instagram"] = ig
            social_block.append(f"Instagram: {ig}")
            log(f"  Found Instagram: {ig}")
        time.sleep(SEARCH_DELAY)
    else:
        log(f"  Instagram already set")

    # --- Google Maps review URL ---
    review_url = find_google_maps_review(lead)
    if review_url:
        social_block.append(f"Google Review: {review_url}")
        log(f"  Found Google review URL")

    # --- Notes block ---
    if social_block:
        existing_notes = lead.get("notes") or ""
        # Remove old Social Media block if present
        cleaned = re.sub(
            r"Social Media:\n(?:.*\n)*?(?=\n\S|\Z)", "", existing_notes
        ).strip()
        new_block = "Social Media:\n" + "\n".join(social_block)
        notes = f"{cleaned}\n\n{new_block}".strip() if cleaned else new_block
        updates["notes"] = notes

    log(f"  Updates: {list(updates.keys())}")
    return updates


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    import argparse

    parser = argparse.ArgumentParser(description="Enrich leads with phone and social data")
    parser.add_argument("--limit", type=int, default=0, help="Max leads to process (0=all)")
    parser.add_argument("--id", type=int, default=0, help="Enrich a single lead by ID")
    parser.add_argument("--dry-run", action="store_true", help="Preview without DB writes")
    parser.add_argument("--skip-phone", action="store_true", help="Skip phone search")
    parser.add_argument("--phone-only", action="store_true", help="Only search for phone")
    args = parser.parse_args()

    # Fetch leads that need enrichment
    if args.id:
        leads = db_call("get-leads", {"where": "id = ?", "params": [args.id]})
    else:
        # Leads missing at least phone + all social
        where_parts = [
            "(contact_phone IS NULL OR contact_phone = '')",
            "(contact_facebook IS NULL OR contact_facebook = '')",
        ]
        if not args.phone_only:
            where_parts.append("(contact_twitter IS NULL OR contact_twitter = '')")
            where_parts.append("(contact_instagram IS NULL OR contact_instagram = '')")

        leads = db_call("get-leads", {"where": " AND ".join(where_parts)})

    if args.limit > 0:
        leads = leads[:args.limit]

    log(f"Found {len(leads)} leads to enrich")

    enriched = 0
    errors = 0
    updated = 0

    for i, lead in enumerate(leads):
        log(f"\n--- Lead {i+1}/{len(leads)} ---")
        try:
            updates = enrich_lead(lead)
            enriched += 1

            if updates and not args.dry_run:
                db_call("update-lead", {"id": lead["id"], "fields": updates})
                updated += 1
                log(f"  Saved {len(updates)} fields")
            elif updates:
                log(f"  [DRY RUN] Would save {len(updates)} fields")
            else:
                log(f"  No new data found")
        except Exception as e:
            errors += 1
            log(f"  ERROR: {e}")
            traceback.print_exc()

    log(f"\n=== Done ===")
    log(f"Processed: {len(leads)}")
    log(f"Enriched:  {enriched}")
    log(f"Updated:   {updated}")
    log(f"Errors:    {errors}")


if __name__ == "__main__":
    main()
