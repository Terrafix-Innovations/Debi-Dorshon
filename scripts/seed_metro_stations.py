"""
scripts/seed_metro_stations.py
------------------------------
Generates data/processed/metro_stations.json using OpenStreetMap surveyed coordinates
and seeds the dedicated `metro_stations` collection in MongoDB.
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

# Safe encoding for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
env_path = BACKEND_DIR / ".env"
if not env_path.exists():
    env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

OVERPASS_QUERY = """[out:json][timeout:35];
(
  node["railway"="station"]["station"="subway"](22.35,88.15,22.75,88.55);
  node["railway"="station"]["subway"="yes"](22.35,88.15,22.75,88.55);
  node["station"="subway"](22.35,88.15,22.75,88.55);
  way["railway"="station"]["station"="subway"](22.35,88.15,22.75,88.55);
);
out center body;
"""

# Canonical line classification mapping
LINE_MAPPINGS = {
    # Blue Line (North-South: Dakshineswar to Kavi Subhash)
    "dakshineswar": "Blue Line",
    "dakshineshwar": "Blue Line",
    "baranagar": "Blue Line",
    "noapara": "Blue Line",
    "dum dum": "Blue Line",
    "belgachia": "Blue Line",
    "belgachhia": "Blue Line",
    "shyambazar": "Blue Line",
    "shovabazar": "Blue Line",
    "shovabazar sutanuti": "Blue Line",
    "sovabazar": "Blue Line",
    "sovabazar-sutanuti": "Blue Line",
    "girish park": "Blue Line",
    "mahatma gandhi road": "Blue Line",
    "mg road": "Blue Line",
    "central": "Blue Line",
    "chandni chowk": "Blue Line",
    "esplanade": "Blue Line",
    "park street": "Blue Line",
    "maidan": "Blue Line",
    "rabindra sadan": "Blue Line",
    "netaji bhavan": "Blue Line",
    "jatin das park": "Blue Line",
    "kalighat": "Blue Line",
    "rabindra sarobar": "Blue Line",
    "mahanayak uttam kumar": "Blue Line",
    "tollygunge": "Blue Line",
    "netaji": "Blue Line",
    "kudghat": "Blue Line",
    "masterda surya sen": "Blue Line",
    "bansdroni": "Blue Line",
    "gitanjali": "Blue Line",
    "naktala": "Blue Line",
    "kavi nazrul": "Blue Line",
    "garia bazar": "Blue Line",
    "shahid khudiram": "Blue Line",
    "kavi subhash": "Blue Line",
    "new garia": "Blue Line",

    # Green Line (East-West: Howrah Maidan to Sector V)
    "howrah maidan": "Green Line",
    "howrah": "Green Line",
    "mahakaran": "Green Line",
    "sealdah": "Green Line",
    "phoolbagan": "Green Line",
    "salt lake stadium": "Green Line",
    "bengal chemical": "Green Line",
    "city centre": "Green Line",
    "central park": "Green Line",
    "karunamoyee": "Green Line",
    "salt lake sector v": "Green Line",
    "sector v": "Green Line",

    # Purple Line (Joka to Majerhat)
    "joka": "Purple Line",
    "thakurpukur": "Purple Line",
    "sakherbazar": "Purple Line",
    "sakher bazar": "Purple Line",
    "behala chowrasta": "Purple Line",
    "behala bazar": "Purple Line",
    "taratala": "Purple Line",
    "majerhat": "Purple Line",

    # Orange Line (New Garia to Airport via Ruby)
    "satyajit ray": "Orange Line",
    "jyotirindra nandi": "Orange Line",
    "kavi sukanta": "Orange Line",
    "hemanta mukhopadhyay": "Orange Line",
    "ruby": "Orange Line",
    "vip bazar": "Orange Line",
    "ritwik ghatak": "Orange Line",
    "barun sengupta": "Orange Line",
    "beleghata": "Orange Line",
    "gour kishore ghosh": "Orange Line",
    "chinar park": "Orange Line",
    "city centre 2": "Orange Line",
    "mangaldweep": "Orange Line",
    "eco park": "Orange Line",
    "mother's wax museum": "Orange Line",
    "shiksha tirtha": "Orange Line",
    "biswa bangla convention centre": "Orange Line",
    "swapno bhor": "Orange Line",
    "nazrul tirtha": "Orange Line",
    "kalakhetra": "Orange Line",

    # Yellow Line (Noapara to Barasat via Airport)
    "dum dum cantonment": "Yellow Line",
    "jessore road": "Yellow Line",
    "jai hind": "Yellow Line",
    "biman bandar": "Yellow Line",
    "birati": "Yellow Line",
    "michael nagar": "Yellow Line",
    "new barragepore": "Yellow Line",
    "madhyamgram": "Yellow Line",
    "hridaypur": "Yellow Line",
    "barasat": "Yellow Line",
}

# Known alias variations for high-accuracy search & pandal mapping
ALIASES_MAP = {
    "Dakshineswar": ["dakshineswar", "dakshineshwar", "dakhineswar"],
    "Baranagar": ["baranagar", "bornagar", "baranagar metro"],
    "Noapara": ["noapara", "nowapara", "noapara metro"],
    "Dum Dum": ["dum dum", "dumdum", "dum dum metro", "dum dum junction"],
    "Belgachia": ["belgachia", "belgachhia", "belgachia metro", "belgachhia metro"],
    "Shyambazar": ["shyambazar", "shambazar", "shyambazar 5 point", "shyambazar metro"],
    "Shobhabazar Sutanuti": [
        "shobhabazar sutanuti",
        "shovabazar sutanuti",
        "sovabazar-sutanuti",
        "sovabazar sutanuti",
        "sovabazar",
        "shovabazar",
        "shobhabazar",
        "sutanuti",
    ],
    "Girish Park": ["girish park", "girish park more", "giris park"],
    "Mahatma Gandhi Road": ["mg road", "m g road", "mahatma gandhi road", "burrabazar metro", "college street metro"],
    "Central": ["central", "central metro", "bowbazar metro", "medical college metro"],
    "Chandni Chowk": ["chandni chowk", "chandni", "chandney chawk", "e-mall metro"],
    "Esplanade": ["esplanade", "dharmatala metro", "dharmatala", "curzon park"],
    "Park Street": ["park street", "park street metro", "mother teresa sarani"],
    "Maidan": ["maidan", "maidan metro", "brigade parade ground"],
    "Rabindra Sadan": ["rabindra sadan", "exide metro", "exide crossing", "nandan metro"],
    "Netaji Bhavan": ["netaji bhavan", "netaji subhash metro", "bhawanipur metro"],
    "Jatin Das Park": ["jatin das park", "hazra metro", "hazra crossing", "hazra park"],
    "Kalighat": ["kalighat", "kalighat metro", "rashbehari crossing", "deshapriya park metro"],
    "Rabindra Sarobar": ["rabindra sarobar", "lake metro", "charu market metro"],
    "Mahanayak Uttam Kumar": ["tollygunge", "tollygunge metro", "mahanayak uttam kumar", "uttam kumar metro"],
    "Netaji": ["netaji", "kudghat", "kudghat metro", "netaji metro"],
    "Masterda Surya Sen": ["masterda surya sen", "bansdroni", "bansdroni metro"],
    "Gitanjali": ["gitanjali", "naktala", "naktala metro"],
    "Kavi Nazrul": ["kavi nazrul", "garia bazar", "garia metro"],
    "Shahid Khudiram": ["shahid khudiram", "briji", "dhalai bridge metro"],
    "Kavi Subhash": ["kavi subhash", "new garia", "new garia metro", "peerless hospital metro"],

    "Howrah Maidan": ["howrah maidan", "howrah maidan metro"],
    "Howrah": ["howrah", "howrah station metro", "howrah railway station"],
    "Mahakaran": ["mahakaran", "writers building metro", "bbd bagh metro"],
    "Sealdah": ["sealdah", "sealdah station metro", "sealdah railway metro"],
    "Phoolbagan": ["phoolbagan", "phoolbagan crossing", "kankurgachi metro"],
    "Salt Lake Stadium": ["salt lake stadium", "yuva bharati krirangan metro"],
    "Bengal Chemical": ["bengal chemical", "maniktala main road metro"],
    "City Centre": ["city centre", "city centre 1", "cc1 metro"],
    "Central Park": ["central park", "karunamoyee central park"],
    "Karunamoyee": ["karunamoyee", "salt lake bus stand metro"],
    "Salt Lake Sector V": ["salt lake sector v", "sector 5", "sector v", "wipro metro"],

    "Joka": ["joka", "iim calcutta metro"],
    "Thakurpukur": ["thakurpukur", "thakurpukur 3a bus stand"],
    "Sakher Bazar": ["sakherbazar", "sakher bazar", "sakher bazar metro"],
    "Behala Chowrasta": ["behala chowrasta", "chowrasta metro", "diamond harbour road"],
    "Behala Bazar": ["behala bazar", "behala tram depot metro"],
    "Taratala": ["taratala", "taratala crossing", "taratala bridge"],
    "Majerhat": ["majerhat", "majerhat railway station metro"],

    "Hemanta Mukhopadhyay": ["hemanta mukhopadhyay", "ruby", "ruby hospital", "ruby metro", "ruby crossing"],
    "Kavi Sukanta": ["kavi sukanta", "kalikapur", "kalikapur metro"],
    "Jyotirindra Nandi": ["jyotirindra nandi", "mukundapur", "rn tagore metro"],
    "Satyajit Ray": ["satyajit ray", "hiland park metro", "ajaynagar"],
    "Jessore Road": ["jessore road", "dum dum airport jessore road"]
}


def clean_name(raw_name: str) -> str:
    name = raw_name.strip()
    name = re.sub(r"\s+metro\s+station\b", "", name, flags=re.I)
    name = re.sub(r"\s+subway\s+station\b", "", name, flags=re.I)
    name = re.sub(r"\s+metro\b", "", name, flags=re.I)
    name = re.sub(r"\s*\(Line\s+\d+\)", "", name, flags=re.I)
    return name.strip()


async def generate_and_seed_metro_stations():
    print("[1] Fetching live surveyed coordinates from OpenStreetMap Overpass API...")
    headers = {
        "User-Agent": "DebiDorshonTransitBot/1.0 (contact: dev@debi-dorshon.local)",
        "Accept": "application/json",
    }
    elements = []
    for endpoint in OVERPASS_URLS:
        try:
            resp = httpx.post(endpoint, data={"data": OVERPASS_QUERY}, headers=headers, timeout=35.0)
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                print(f"[+] Fetched {len(elements)} raw elements from {endpoint}")
                break
        except Exception as e:
            print(f"[-] Failed with {endpoint}: {e}")

    if not elements:
        print("[x] Error: Overpass query failed.")
        return

    # Load pandal counts from debi_dorshon.json
    pandal_file = PROJECT_ROOT / "data" / "processed" / "debi_dorshon.json"
    pandal_counts: Dict[str, int] = {}
    if pandal_file.exists():
        with open(pandal_file, "r", encoding="utf-8") as f:
            pandals = json.load(f)
            for p in pandals:
                m = p.get("nearest_metro")
                if m and m.get("name"):
                    st_name = m["name"].strip()
                    pandal_counts[st_name.lower()] = pandal_counts.get(st_name.lower(), 0) + 1

    processed_stations: Dict[str, Dict[str, Any]] = {}

    for el in elements:
        tags = el.get("tags", {})
        raw_name = tags.get("name:en") or tags.get("name")
        if not raw_name:
            continue

        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if not lat or not lon:
            continue

        name = clean_name(raw_name)
        # Normalize name casing / variants
        norm_key = name.lower()

        # Find line
        line = "Blue Line"
        for k, l in LINE_MAPPINGS.items():
            if k in norm_key or norm_key in k:
                line = l
                break

        # Match alias key
        canonical_name = name
        for alias_key in ALIASES_MAP.keys():
            if alias_key.lower() == norm_key or norm_key in [a.lower() for a in ALIASES_MAP[alias_key]]:
                canonical_name = alias_key
                break

        # Calculate pandal count
        p_count = pandal_counts.get(canonical_name.lower(), 0)
        if p_count == 0 and canonical_name in ALIASES_MAP:
            for alt in ALIASES_MAP[canonical_name]:
                if alt.lower() in pandal_counts:
                    p_count = pandal_counts[alt.lower()]
                    break

        aliases = list(set([
            canonical_name.lower(),
            f"{canonical_name.lower()} metro",
            f"{canonical_name.lower()} station",
        ] + [a.lower() for a in ALIASES_MAP.get(canonical_name, [])]))

        if canonical_name not in processed_stations:
            processed_stations[canonical_name] = {
                "name": canonical_name,
                "short_name": canonical_name,
                "full_name": f"{canonical_name} Metro Station",
                "line": line,
                "location": {
                    "latitude": round(lat, 6),
                    "longitude": round(lon, 6),
                },
                "pandal_count": p_count,
                "aliases": aliases,
                "source": "OpenStreetMap",
                "osm_id": el.get("id"),
            }

    # Ensure every single station present in debi_dorshon.json has an entry
    if pandal_file.exists():
        with open(pandal_file, "r", encoding="utf-8") as f:
            pandals = json.load(f)
            for p in pandals:
                m = p.get("nearest_metro")
                if m and m.get("name"):
                    nm = m["name"].strip()
                    # Check if nm is already in processed_stations or aliases
                    found = False
                    for st in processed_stations.values():
                        if st["name"].lower() == nm.lower() or nm.lower() in st["aliases"]:
                            found = True
                            if nm.lower() not in st["aliases"]:
                                st["aliases"].append(nm.lower())
                            break
                    if not found:
                        print(f"[!] Warning: station '{nm}' from pandals not directly found in OSM stations.")

    stations_list = sorted(list(processed_stations.values()), key=lambda s: s["name"])
    print(f"[+] Total distinct curated OSM metro stations: {len(stations_list)}")

    # Save to data/processed/metro_stations.json
    output_path = PROJECT_ROOT / "data" / "processed" / "metro_stations.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stations_list, f, indent=2, ensure_ascii=False)
    print(f"[+] Saved exact OSM coordinates dataset to: {output_path}")

    # Seed MongoDB
    print(f"[2] Connecting to MongoDB: {settings.MONGODB_URL}")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    collection_name = getattr(settings, "METRO_COLLECTION_NAME", "metro_stations")
    collection = db[collection_name]

    await collection.delete_many({})
    print(f"[+] Cleared existing '{collection_name}' collection.")

    # Insert items
    # Deep copy to avoid MongoDB mutating documents with _id in-place if re-used
    docs_to_insert = [dict(s) for s in stations_list]
    result = await collection.insert_many(docs_to_insert)
    print(f"[+] Successfully inserted {len(result.inserted_ids)} metro stations into MongoDB!")

    # Create indexes for ultrafast query & autocomplete
    await collection.create_index("name", unique=True)
    await collection.create_index("aliases")
    await collection.create_index("line")
    await collection.create_index([("location", "2dsphere")])
    print("[+] Created indexes: name (unique), aliases, line, location (2dsphere)")

    client.close()
    print("[+] Database seeding for metro_stations complete!")


if __name__ == "__main__":
    asyncio.run(generate_and_seed_metro_stations())
