import os
import sys
import json
import re
import time
import math
from urllib.parse import quote, unquote
import requests
import openpyxl

if hasattr(sys.stdout, 'reconfigure') and getattr(sys.stdout, 'encoding', '').lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore[attr-defined]
if hasattr(sys.stderr, 'reconfigure') and getattr(sys.stderr, 'encoding', '').lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')  # type: ignore[attr-defined]

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_PATH = os.path.join(PROJECT_ROOT, 'data', 'raw', 'Debi-Dorshon.xlsx')
JSON_PATH = os.path.join(PROJECT_ROOT, 'data', 'processed', 'debi_dorshon.json')
OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'data', 'processed', 'debi_dorshon.json')
REPORT_PATH = os.path.join(PROJECT_ROOT, 'scripts', 'master_resolution_report.json')

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
})

DEFAULT_KOLKATA = (22.5743545, 88.3628734)
DUMMY_DUMDUM = (22.6656256, 88.4277248)

def haversine(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def is_valid_kolkata(lat, lng):
    if lat is None or lng is None:
        return False
    if not (22.35 <= lat <= 22.80 and 88.20 <= lng <= 88.55):
        return False
    if abs(lat - DEFAULT_KOLKATA[0]) < 0.001 and abs(lng - DEFAULT_KOLKATA[1]) < 0.001:
        return False
    if abs(lat - DUMMY_DUMDUM[0]) < 0.001 and abs(lng - DUMMY_DUMDUM[1]) < 0.001:
        return False
    return True

def query_google_maps(query):
    try:
        url = f"https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=in&q={quote(query)}"
        r = session.get(url, timeout=10)
        
        matches = re.finditer(r'\[null,null,(22\.\d+),(88\.\d+)\]', r.text)
        for m in matches:
            lat, lng = float(m.group(1)), float(m.group(2))
            if is_valid_kolkata(lat, lng):
                start = max(0, m.start() - 50)
                end = min(len(r.text), m.end() + 100)
                context = r.text[start:end]
                title_match = re.search(r'"([^"]{3,60})"', context[m.end()-start:])
                title = title_match.group(1) if title_match else ""
                return lat, lng, "tbm_map_null", title
        
        matches_at = re.finditer(r'/@([0-9.]+),([0-9.]+)', r.text)
        for m in matches_at:
            lat, lng = float(m.group(1)), float(m.group(2))
            if is_valid_kolkata(lat, lng):
                return lat, lng, "tbm_map_at", ""
    except Exception as e:
        print(f"Error querying Google Maps for '{query}': {e}")
    return None, None, None, None

def resolve_link(link):
    if not link:
        return None, None, None, None
    try:
        r = session.get(link, allow_redirects=True, timeout=10)
        final_url = unquote(r.url)
        
        # Pattern 1: !8m2!3d... !4d... or !3d... !4d...
        m = re.search(r'!(?:8m2!)?3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)', final_url)
        if m:
            lat, lng = float(m.group(1)), float(m.group(2))
            if is_valid_kolkata(lat, lng):
                return lat, lng, "link_3d", final_url
                
        # Pattern 2: @<lat>,<lng>
        m = re.search(r'@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)', final_url)
        if m:
            lat, lng = float(m.group(1)), float(m.group(2))
            if is_valid_kolkata(lat, lng):
                return lat, lng, "link_at", final_url

        # Check for place name in URL
        m_place = re.search(r'/place/([^/@?]+)', final_url)
        if m_place:
            place_name = m_place.group(1).replace('+', ' ')
            return None, None, "place_name", place_name

    except Exception as e:
        print(f"Error resolving link '{link}': {e}")
    return None, None, None, None

def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        pandals = json.load(f)

    excel_rows = []
    for sheetname in wb.sheetnames:
        sheet = wb[sheetname]
        for r in range(1, sheet.max_row+1):
            for c in range(1, sheet.max_column+1):
                val = str(sheet.cell(r, c).value or '').strip()
                if val in ['Sl.no.', 'Sl. No.', 'Sl.No.']:
                    dr = r + 1
                    while dr <= sheet.max_row:
                        name = sheet.cell(dr, c+1).value
                        if not name or str(sheet.cell(dr, c).value).strip() in ['Sl.no.', 'Sl. No.']:
                            break
                        loc_cell = sheet.cell(dr, c+2)
                        link = loc_cell.hyperlink.target if loc_cell.hyperlink else None
                        excel_rows.append({
                            'sheet': sheetname,
                            'name': str(name).strip(),
                            'link': link
                        })
                        dr += 1

    print(f"Total Pandals: {len(pandals)}, Excel rows: {len(excel_rows)}")

    final_results = []
    for idx, (p, er) in enumerate(zip(pandals, excel_rows)):
        name = p['name']
        cluster = p.get('cluster', '')
        region = p.get('region', '')
        old_loc = p.get('location', {})
        old_lat = old_loc.get('latitude')
        old_lng = old_loc.get('longitude')
        link = er.get('link')

        print(f"\n[{idx+1}/{len(pandals)}] {name} ({cluster}, {region})")

        chosen_lat, chosen_lng = None, None
        chosen_source, chosen_detail = None, None

        # 1. If Excel link exists, inspect it
        link_lat, link_lng, link_type, link_info = None, None, None, None
        if link:
            l_lat, l_lng, l_src, l_detail = resolve_link(link)
            if l_lat and l_lng:
                link_lat, link_lng, link_type, link_info = l_lat, l_lng, f"link_{l_src}", l_detail
                print(f"  -> Link has direct coords: ({link_lat}, {link_lng})")
            elif l_src == "place_name" and l_detail:
                # Resolve official place name from Google Maps URL
                print(f"  -> Resolving official place from link: '{l_detail}'")
                p_lat, p_lng, p_src, p_title = query_google_maps(l_detail)
                if p_lat and p_lng:
                    link_lat, link_lng, link_type, link_info = p_lat, p_lng, "link_place_search", l_detail
                    print(f"  -> Found via link place: ({link_lat}, {link_lng}) [{p_title}]")

        # 2. Simulated Google Maps search (as requested by user: explicitly mention "Puja Pandal" or "Durga Puja Pandal")
        search_lat, search_lng, search_type, search_info = None, None, None, None
        clean_name = re.sub(r'\s*-[^,]+', '', name).strip()
        clean_name = re.sub(r'\(.*?\)', '', clean_name).strip()

        search_queries = [
            f"{name} Durga Puja Pandal Kolkata",
            f"{name} Puja Pandal Kolkata",
            f"{name} Durga Puja {cluster} Kolkata",
            f"{name} Puja Pandal {cluster} Kolkata",
            f"{name} Durga Puja Kolkata",
            f"{name} {cluster} Kolkata"
        ]
        if clean_name != name:
            search_queries.insert(1, f"{clean_name} Durga Puja Pandal Kolkata")
            search_queries.insert(2, f"{clean_name} Puja Pandal Kolkata")

        for q in search_queries:
            s_lat, s_lng, s_src, s_title = query_google_maps(q)
            if s_lat and s_lng:
                # Check distance to old coords if old coords existed
                if old_lat and old_lng:
                    dist = haversine(old_lat, old_lng, s_lat, s_lng)
                    # If dist > 4000m and we have a link or cluster, be cautious
                    if dist is not None and dist > 4000 and link_lat:
                        print(f"  (Search '{q}' shifted {dist/1000:.1f}km away from old, checking link...)")
                        continue
                search_lat, search_lng, search_type, search_info = s_lat, s_lng, f"search: {q}", s_title
                print(f"  -> Found via search '{q}': ({search_lat}, {search_lng}) [{s_title}]")
                break
            time.sleep(0.05)

        # Decision logic between Link and Search:
        # If link exists and resolved:
        # Link places like "Ultadanga Jagarani Sangha, 16/1..." or "JC69+JCF Dum Dum Park Tarun Dal..." are the exact intended pins from Debi-Dorshon dataset
        if link_lat and link_lng:
            if search_lat and search_lng:
                # Compare distance between search and link
                match_dist = haversine(link_lat, link_lng, search_lat, search_lng)
                if match_dist is not None and match_dist < 500:  # Within 500m, search is pinpoint Durga Puja Pandal!
                    chosen_lat, chosen_lng = search_lat, search_lng
                    chosen_source, chosen_detail = search_type, search_info
                    print(f"  ==> MATCH! Search & Link agree ({match_dist:.1f}m): ({chosen_lat}, {chosen_lng})")
                elif match_dist is not None:
                    # Link is specific to the place registered in Debi-Dorshon
                    print(f"  ==> Search ({search_lat}, {search_lng}) differed from Link ({link_lat}, {link_lng}) by {match_dist/1000:.1f}km. Using Link!")
                    chosen_lat, chosen_lng = link_lat, link_lng
                    chosen_source, chosen_detail = link_type, link_info
                else:
                    chosen_lat, chosen_lng = link_lat, link_lng
                    chosen_source, chosen_detail = link_type, link_info
            else:
                chosen_lat, chosen_lng = link_lat, link_lng
                chosen_source, chosen_detail = link_type, link_info
                print(f"  ==> Using Link: ({chosen_lat}, {chosen_lng})")
        elif search_lat and search_lng:
            chosen_lat, chosen_lng = search_lat, search_lng
            chosen_source, chosen_detail = search_type, search_info
            print(f"  ==> Using Search: ({chosen_lat}, {chosen_lng})")
        else:
            chosen_lat, chosen_lng = old_lat, old_lng
            chosen_source, chosen_detail = "retained_old", "no new source"
            print(f"  ==> Retaining old: ({chosen_lat}, {chosen_lng})")

        p['location'] = {
            'latitude': round(chosen_lat, 7) if chosen_lat else None,
            'longitude': round(chosen_lng, 7) if chosen_lng else None
        }

        dist_from_old = haversine(old_lat, old_lng, chosen_lat, chosen_lng)
        final_results.append({
            'index': idx,
            'name': name,
            'cluster': cluster,
            'region': region,
            'old_location': {'latitude': old_lat, 'longitude': old_lng},
            'new_location': p['location'],
            'dist_shifted_meters': round(dist_from_old, 1) if dist_from_old is not None else None,
            'source': chosen_source,
            'detail': chosen_detail
        })

    # Save to debi_dorshon.json
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(pandals, f, indent=2, ensure_ascii=False)

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_results, f, indent=2, ensure_ascii=False)

    print(f"\n==========================================")
    print(f"SUCCESS! Updated all {len(pandals)} pandals in {OUTPUT_PATH}")
    print(f"Master report saved to {REPORT_PATH}")
    print(f"==========================================")

if __name__ == '__main__':
    main()
