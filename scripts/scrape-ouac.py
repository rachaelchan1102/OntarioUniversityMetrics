#!/usr/bin/env python3
"""
Scrapes all Ontario university programs from ouinfo.ca and outputs
lib/etl/ouacPrograms.json for use by the ETL pipeline.

Usage: python3 scripts/scrape-ouac.py
"""
import re
import json
import urllib.request
import time
import os

GROUPS = ['a', 'b', 'c', 'd-e', 'f-g', 'h', 'i', 'j-l', 'm', 'n-p', 'q-s', 't-z']
BASE_URL = 'https://www.ouinfo.ca/programs/search/?search=&group={}'

# Map ouinfo university slugs -> canonical names
SLUG_TO_UNIVERSITY = {
    'algoma': 'Algoma University',
    'brock': 'Brock University',
    'carleton': 'Carleton University',
    'guelph': 'University of Guelph',
    'guelph-humber': 'University of Guelph-Humber',
    'lakehead': 'Lakehead University',
    'laurentian': 'Laurentian University',
    'laurier-brantford': 'Wilfrid Laurier University',
    'laurier-milton': 'Wilfrid Laurier University',
    'laurier-waterloo': 'Wilfrid Laurier University',
    'mcmaster': 'McMaster University',
    'ocad-u': 'OCAD University',
    'ontario-tech': 'Ontario Tech University',
    'ottawa': 'University of Ottawa',
    'ottawa-saint-paul': 'University of Ottawa',
    'queens': "Queen's University",
    'rmc': 'Royal Military College of Canada',
    'toronto-mississauga': 'University of Toronto',
    'toronto-scarborough': 'University of Toronto',
    'toronto-st-george': 'University of Toronto',
    'toronto-metropolitan': 'Toronto Metropolitan University',
    'trent': 'Trent University',
    'trent-durham-gta': 'Trent University',
    'waterloo': 'University of Waterloo',
    'waterloo-st-jeromes': 'University of Waterloo',
    'western': 'Western University',
    'western-huron': 'Western University',
    'western-kings': 'Western University',
    'windsor': 'University of Windsor',
    'york': 'York University',
    'york-glendon': 'York University',
    'york-markham': 'York University',
}

def fetch_group(group):
    url = BASE_URL.format(group)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8')

def parse_programs(html):
    """
    Each program block looks like:
      <h2 class="..."><a href="https://www.ouinfo.ca/programs/{uni}/{code}">Program Name</a></h2>
      ...
      <p>English | CODE | ...</p>
    
    The OUAC code appears both in the URL (lowercase) and in the body text (uppercase).
    We extract from the URL to get uni slug + code.
    """
    programs = []
    
    # Pattern: extract program URL and name from h2 links
    # URL format (relative): /programs/{university-slug}/{code}
    # e.g. <h2 class="result-heading"><a href="/programs/waterloo/wxy">Program Name</a></h2>
    program_pattern = re.compile(
        r'<h2[^>]*class="result-heading"[^>]*><a[^>]+href="/programs/([^/]+)/([^"]+)"[^>]*>([^<]+)</a></h2>',
        re.IGNORECASE
    )
    
    seen = set()
    for m in program_pattern.finditer(html):
        uni_slug = m.group(1)
        code_lower = m.group(2)
        program_name = m.group(3).strip()
        
        # Skip navigation links and non-program slugs
        if uni_slug in ('all', 'universities', 'compare', 'search') or not code_lower:
            continue
        
        # Skip university page links (they don't have a code after the slug)
        # Program codes are alphanumeric, university names have hyphens
        # e.g. /programs/waterloo vs /programs/waterloo/wcs
        # We need both uni_slug AND code_lower to be present
        
        code = code_lower.upper()
        key = (uni_slug, code)
        if key in seen:
            continue
        seen.add(key)
        
        university = SLUG_TO_UNIVERSITY.get(uni_slug, uni_slug.replace('-', ' ').title())
        
        programs.append({
            'code': code,
            'programName': program_name,
            'universitySlug': uni_slug,
            'university': university,
        })
    
    return programs

def main():
    all_programs = []
    seen_codes_per_uni = {}
    
    for group in GROUPS:
        print(f'Fetching group: {group}')
        try:
            html = fetch_group(group)
            programs = parse_programs(html)
            print(f'  Found {len(programs)} programs')
            all_programs.extend(programs)
        except Exception as e:
            print(f'  ERROR: {e}')
        time.sleep(0.5)  # Be polite
    
    # Deduplicate by (code, universitySlug) — keep first occurrence
    seen = set()
    deduped = []
    for p in all_programs:
        key = (p['code'], p['universitySlug'])
        if key not in seen:
            seen.add(key)
            deduped.append(p)
    
    print(f'\nTotal programs scraped: {len(deduped)}')
    
    # Output path
    out_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'etl', 'ouacPrograms.json')
    out_path = os.path.normpath(out_path)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)
    
    print(f'Written to {out_path}')
    
    # Print Waterloo programs for verification
    waterloo = [p for p in deduped if p['universitySlug'] == 'waterloo']
    print(f'\nWaterloo programs ({len(waterloo)}):')
    for p in sorted(waterloo, key=lambda x: x['code']):
        print(f"  {p['code']:6s}  {p['programName']}")

if __name__ == '__main__':
    main()
