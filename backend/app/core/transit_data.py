"""
app/core/transit_data.py
-------------------------
Curated dataset of Kolkata Metro stations (Blue, Green, Orange, Purple lines)
and major transit terminals (Railway, Ferry) with exact GPS coordinates and aliases.
"""

from typing import List, Dict, Any

KOLKATA_TRANSIT_HUBS: List[Dict[str, Any]] = [
    # --- BLUE LINE (NORTH-SOUTH METRO) ---
    {
        "name": "Dakshineswar Metro Station",
        "short_name": "Dakshineswar",
        "aliases": ["dakshineswar", "dakshineswar metro", "dakhineswar"],
        "line": "Blue Line (North-South)",
        "latitude": 22.6534,
        "longitude": 88.3585,
        "type": "metro",
    },
    {
        "name": "Baranagar Metro Station",
        "short_name": "Baranagar",
        "aliases": ["baranagar", "baranagar metro", "bornagar"],
        "line": "Blue Line (North-South)",
        "latitude": 22.6417,
        "longitude": 88.3697,
        "type": "metro",
    },
    {
        "name": "Noapara Metro Station",
        "short_name": "Noapara",
        "aliases": ["noapara", "noapara metro", "nowapara"],
        "line": "Blue Line (North-South)",
        "latitude": 22.6367,
        "longitude": 88.3908,
        "type": "metro",
    },
    {
        "name": "Dum Dum Metro Station",
        "short_name": "Dum Dum",
        "aliases": ["dum dum", "dumdum", "dum dum metro", "dum dum junction"],
        "line": "Blue Line (North-South)",
        "latitude": 22.6201,
        "longitude": 88.3918,
        "type": "metro",
    },
    {
        "name": "Belgachhia Metro Station",
        "short_name": "Belgachhia",
        "aliases": ["belgachhia", "belgachia", "belgachia metro", "belgachhia metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.6072,
        "longitude": 88.3842,
        "type": "metro",
    },
    {
        "name": "Shyambazar Metro Station",
        "short_name": "Shyambazar",
        "aliases": ["shyambazar", "shyambazar metro", "shambazar", "shyambazar 5 point"],
        "line": "Blue Line (North-South)",
        "latitude": 22.6019,
        "longitude": 88.3712,
        "type": "metro",
    },
    {
        "name": "Shovabazar Sutanuti Metro Station",
        "short_name": "Shovabazar Sutanuti",
        "aliases": ["shovabazar", "sovabazar", "shobhabazar", "sutanuti", "sovabazar metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5975,
        "longitude": 88.3653,
        "type": "metro",
    },
    {
        "name": "Girish Park Metro Station",
        "short_name": "Girish Park",
        "aliases": ["girish park", "girish park metro", "girish park more"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5861,
        "longitude": 88.3619,
        "type": "metro",
    },
    {
        "name": "Mahatma Gandhi Road Metro Station",
        "short_name": "MG Road",
        "aliases": ["mg road", "m g road", "mahatma gandhi road", "burrabazar metro", "college street metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5806,
        "longitude": 88.3611,
        "type": "metro",
    },
    {
        "name": "Central Metro Station",
        "short_name": "Central",
        "aliases": ["central", "central metro", "bowbazar metro", "medical college metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5692,
        "longitude": 88.3589,
        "type": "metro",
    },
    {
        "name": "Chandni Chowk Metro Station",
        "short_name": "Chandni Chowk",
        "aliases": ["chandni chowk", "chandni", "chandni chowk metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5647,
        "longitude": 88.3556,
        "type": "metro",
    },
    {
        "name": "Esplanade Metro Station",
        "short_name": "Esplanade",
        "aliases": ["esplanade", "esplanade metro", "dharmatala", "dharmatala metro"],
        "line": "Blue & Green Line Interchange",
        "latitude": 22.5636,
        "longitude": 88.3517,
        "type": "metro",
    },
    {
        "name": "Park Street Metro Station",
        "short_name": "Park Street",
        "aliases": ["park street", "park street metro", "park st metro", "parkst"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5532,
        "longitude": 88.3512,
        "type": "metro",
    },
    {
        "name": "Maidan Metro Station",
        "short_name": "Maidan",
        "aliases": ["maidan", "maidan metro", "brigade parade ground"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5475,
        "longitude": 88.3497,
        "type": "metro",
    },
    {
        "name": "Rabindra Sadan Metro Station",
        "short_name": "Rabindra Sadan",
        "aliases": ["rabindra sadan", "rabindra sadan metro", "exide", "exide more", "nandan"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5404,
        "longitude": 88.3462,
        "type": "metro",
    },
    {
        "name": "Netaji Bhavan Metro Station",
        "short_name": "Netaji Bhavan",
        "aliases": ["netaji bhavan", "netaji bhaban", "netaji bhavan metro", "bhawanipur metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5336,
        "longitude": 88.3444,
        "type": "metro",
    },
    {
        "name": "Jatin Das Park Metro Station",
        "short_name": "Jatin Das Park",
        "aliases": ["jatin das park", "hazra metro", "hazra more", "jatin das park metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5272,
        "longitude": 88.3439,
        "type": "metro",
    },
    {
        "name": "Kalighat Metro Station",
        "short_name": "Kalighat",
        "aliases": ["kalighat", "kalighat metro", "rasbehari more", "rashbehari metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5197,
        "longitude": 88.3426,
        "type": "metro",
    },
    {
        "name": "Rabindra Sarobar Metro Station",
        "short_name": "Rabindra Sarobar",
        "aliases": ["rabindra sarobar", "rabindra sarobar metro", "dhakuria lake metro", "charu market"],
        "line": "Blue Line (North-South)",
        "latitude": 22.5083,
        "longitude": 88.3444,
        "type": "metro",
    },
    {
        "name": "Mahanayak Uttam Kumar Metro Station",
        "short_name": "Tollygunge (Mahanayak Uttam Kumar)",
        "aliases": ["tollygunge", "tollygunge metro", "mahanayak uttam kumar", "tollygunj"],
        "line": "Blue Line (North-South)",
        "latitude": 22.4975,
        "longitude": 88.3456,
        "type": "metro",
    },
    {
        "name": "Netaji Metro Station (Kudghat)",
        "short_name": "Kudghat (Netaji)",
        "aliases": ["kudghat", "netaji metro", "kudghat metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.4878,
        "longitude": 88.3458,
        "type": "metro",
    },
    {
        "name": "Masterda Surya Sen Metro Station",
        "short_name": "Bansdroni (Masterda Surya Sen)",
        "aliases": ["bansdroni", "bansdroni metro", "masterda surya sen", "surya sen metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.4772,
        "longitude": 88.3461,
        "type": "metro",
    },
    {
        "name": "Gitanjali Metro Station (Naktala)",
        "short_name": "Naktala (Gitanjali)",
        "aliases": ["naktala", "naktala metro", "gitanjali", "gitanjali metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.4678,
        "longitude": 88.3508,
        "type": "metro",
    },
    {
        "name": "Kavi Nazrul Metro Station (Garia)",
        "short_name": "Garia (Kavi Nazrul)",
        "aliases": ["garia bazar", "kavi nazrul", "kavi nazrul metro", "garia metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.4572,
        "longitude": 88.3686,
        "type": "metro",
    },
    {
        "name": "Shahid Khudiram Metro Station",
        "short_name": "Briji (Shahid Khudiram)",
        "aliases": ["shahid khudiram", "briji metro", "dhalai bridge metro"],
        "line": "Blue Line (North-South)",
        "latitude": 22.4556,
        "longitude": 88.3831,
        "type": "metro",
    },
    {
        "name": "Kavi Subhash Metro Station (New Garia)",
        "short_name": "New Garia (Kavi Subhash)",
        "aliases": ["new garia", "kavi subhash", "new garia metro", "kavi subhash metro"],
        "line": "Blue & Orange Line Interchange",
        "latitude": 22.4533,
        "longitude": 88.3975,
        "type": "metro",
    },

    # --- GREEN LINE (EAST-WEST METRO) ---
    {
        "name": "Howrah Maidan Metro Station",
        "short_name": "Howrah Maidan",
        "aliases": ["howrah maidan", "howrah maidan metro"],
        "line": "Green Line (East-West)",
        "latitude": 22.5847,
        "longitude": 88.3242,
        "type": "metro",
    },
    {
        "name": "Howrah Railway Station Metro",
        "short_name": "Howrah Metro",
        "aliases": ["howrah", "howrah station", "howrah metro", "howrah railway station"],
        "line": "Green Line (East-West)",
        "latitude": 22.5855,
        "longitude": 88.3426,
        "type": "metro",
    },
    {
        "name": "Mahakaran Metro Station",
        "short_name": "Mahakaran (BBD Bagh)",
        "aliases": ["mahakaran", "bbd bagh", "writers building", "b b d bagh metro"],
        "line": "Green Line (East-West)",
        "latitude": 22.5714,
        "longitude": 88.3481,
        "type": "metro",
    },
    {
        "name": "Sealdah Metro Station",
        "short_name": "Sealdah Metro",
        "aliases": ["sealdah", "sealdah station", "sealdah metro", "sealdah railway station"],
        "line": "Green Line (East-West)",
        "latitude": 22.5675,
        "longitude": 88.3711,
        "type": "metro",
    },
    {
        "name": "Phoolbagan Metro Station",
        "short_name": "Phoolbagan",
        "aliases": ["phoolbagan", "phoolbagan metro", "fulbagan"],
        "line": "Green Line (East-West)",
        "latitude": 22.5711,
        "longitude": 88.3900,
        "type": "metro",
    },
    {
        "name": "Salt Lake Stadium Metro Station",
        "short_name": "Salt Lake Stadium",
        "aliases": ["salt lake stadium", "yuva bharati", "salt lake stadium metro"],
        "line": "Green Line (East-West)",
        "latitude": 22.5714,
        "longitude": 88.4042,
        "type": "metro",
    },
    {
        "name": "Bengal Chemical Metro Station",
        "short_name": "Bengal Chemical",
        "aliases": ["bengal chemical", "bengal chemical metro"],
        "line": "Green Line (East-West)",
        "latitude": 22.5744,
        "longitude": 88.4089,
        "type": "metro",
    },
    {
        "name": "City Centre Metro Station",
        "short_name": "City Centre 1 (Salt Lake)",
        "aliases": ["city centre", "city centre salt lake", "cc1", "city centre metro"],
        "line": "Green Line (East-West)",
        "latitude": 22.5858,
        "longitude": 88.4081,
        "type": "metro",
    },
    {
        "name": "Central Park Metro Station",
        "short_name": "Central Park",
        "aliases": ["central park", "central park metro", "banabitan"],
        "line": "Green Line (East-West)",
        "latitude": 22.5892,
        "longitude": 88.4147,
        "type": "metro",
    },
    {
        "name": "Karunamoyee Metro Station",
        "short_name": "Karunamoyee",
        "aliases": ["karunamoyee", "karunamoyee metro", "karunamoyee bus stand"],
        "line": "Green Line (East-West)",
        "latitude": 22.5847,
        "longitude": 88.4194,
        "type": "metro",
    },
    {
        "name": "Salt Lake Sector V Metro Station",
        "short_name": "Sector V (Salt Lake)",
        "aliases": ["sector 5", "sector v", "salt lake sector 5", "salt lake sector v metro", "wipro more"],
        "line": "Green Line (East-West)",
        "latitude": 22.5819,
        "longitude": 88.4319,
        "type": "metro",
    },

    # --- ORANGE LINE & PURPLE LINE ---
    {
        "name": "Hemanta Mukhopadhyay Metro Station",
        "short_name": "Ruby More (Hemanta Mukhopadhyay)",
        "aliases": ["ruby", "ruby more", "ruby hospital", "hemanta mukhopadhyay"],
        "line": "Orange Line (EM Bypass)",
        "latitude": 22.5136,
        "longitude": 88.4028,
        "type": "metro",
    },
    {
        "name": "Taratala Metro Station",
        "short_name": "Taratala",
        "aliases": ["taratala", "taratala metro", "taratala more"],
        "line": "Purple Line (Joka-Majerhat)",
        "latitude": 22.5089,
        "longitude": 88.3267,
        "type": "metro",
    },
    {
        "name": "Behala Chowrasta Metro Station",
        "short_name": "Behala Chowrasta",
        "aliases": ["behala chowrasta", "chowrasta", "behala metro", "behala chowrasta metro"],
        "line": "Purple Line (Joka-Majerhat)",
        "latitude": 22.4839,
        "longitude": 88.3181,
        "type": "metro",
    },
    {
        "name": "Majerhat Metro Station",
        "short_name": "Majerhat",
        "aliases": ["majerhat", "majerhat metro", "majerhat bridge"],
        "line": "Purple Line (Joka-Majerhat)",
        "latitude": 22.5186,
        "longitude": 88.3275,
        "type": "metro",
    },

    # --- MAJOR GHATS & HUBS ---
    {
        "name": "Ahiritola Ghat",
        "short_name": "Ahiritola Ghat",
        "aliases": ["ahiritola", "ahiritola ghat", "ahiritola ferry"],
        "line": "Hooghly River Ferry Terminal",
        "latitude": 22.5965,
        "longitude": 88.3533,
        "type": "hub",
    },
    {
        "name": "Bagbazar Ghat",
        "short_name": "Bagbazar Ghat",
        "aliases": ["bagbazar", "bagbazar ghat", "bagbazar ferry"],
        "line": "Hooghly River Ferry Terminal",
        "latitude": 22.6035,
        "longitude": 88.3635,
        "type": "hub",
    },
    {
        "name": "Babughat Ferry Terminal",
        "short_name": "Babughat",
        "aliases": ["babughat", "babu ghat", "eden gardens ghat"],
        "line": "Hooghly River Ferry & Bus Terminal",
        "latitude": 22.5672,
        "longitude": 88.3411,
        "type": "hub",
    },
    {
        "name": "Maniktala More",
        "short_name": "Maniktala More",
        "aliases": ["maniktala", "maniktala more", "manicktala"],
        "line": "North Kolkata Landmark Crossing",
        "latitude": 22.6187,
        "longitude": 88.3732,
        "type": "hub",
    },
    {
        "name": "College Street (Boi Para)",
        "short_name": "College Street",
        "aliases": ["college street", "presidency college", "calcutta university", "boi para"],
        "line": "Central Kolkata Cultural Hub",
        "latitude": 22.5731,
        "longitude": 88.3643,
        "type": "hub",
    },
    {
        "name": "Gariahat More",
        "short_name": "Gariahat",
        "aliases": ["gariahat", "gariahat more", "gariahat market", "gariahat crossing"],
        "line": "South Kolkata Landmark Crossing",
        "latitude": 22.5186,
        "longitude": 88.3653,
        "type": "hub",
    },
]


def search_kolkata_transit_hubs(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search curated Kolkata transit hubs by query string."""
    q = query.strip().lower()
    if not q:
        return []

    exact_matches = []
    prefix_matches = []
    contains_matches = []

    for hub in KOLKATA_TRANSIT_HUBS:
        name_lower = hub["name"].lower()
        short_lower = hub["short_name"].lower()
        aliases = [a.lower() for a in hub.get("aliases", [])]

        if q == name_lower or q == short_lower or q in aliases:
            exact_matches.append(hub)
        elif name_lower.startswith(q) or short_lower.startswith(q) or any(a.startswith(q) for a in aliases):
            prefix_matches.append(hub)
        elif q in name_lower or q in short_lower or any(q in a for a in aliases):
            contains_matches.append(hub)

    combined = exact_matches + prefix_matches + contains_matches
    # Deduplicate preserving order
    seen = set()
    results = []
    for item in combined:
        if item["name"] not in seen:
            seen.add(item["name"])
            results.append({
                "id": f"transit_{item['short_name'].lower().replace(' ', '_')}",
                "title": item["name"],
                "subtitle": f"{item['line']} • Kolkata",
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "category": item["type"],
                "badge": "🚇 Metro" if item["type"] == "metro" else "📍 Hub",
            })
            if len(results) >= limit:
                break

    return results
