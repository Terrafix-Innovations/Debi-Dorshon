import os
import json
import re

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_TXT_PATH = os.path.join(PROJECT_ROOT, "data", "data.txt")
JSON_PATH = os.path.join(PROJECT_ROOT, "data", "processed", "debi_dorshon.json")

def clean(s):
    s = s.lower()
    s = re.sub(r"[–\-\(\)\'\’\t\s]+", " ", s)
    s = s.replace("s arbojonin", "sarbojonin")
    s = s.replace("sarbojonin", "sarbojanin").replace("sarbojanik", "sarbojanin")
    s = s.replace("sadharon", "sadharan")
    s = s.replace("mohammed", "mohammad")
    s = s.replace("adibashi", "adhibasi")
    s = s.replace("machhua", "machua")
    s = s.replace("jorsanko", "jorasanko")
    s = s.replace("darponarayan", "darpanarayan")
    s = s.replace("durgatsob", "durgotsav").replace("durgotsab", "durgotsav")
    s = s.replace("nabinpally", "nabin pally").replace("palli", "pally")
    s = s.replace("pallyshree", "pallysree").replace("pallysree", "pallysree")
    s = s.replace("yubak", "jubak")
    s = s.replace("sharodiya", "sharadiya")
    s = s.replace("kanaidhar", "kanai dhar")
    s = s.replace("hati bagan", "hatibagan")
    s = s.replace("chalta bagan", "chaltabagan")
    s = s.replace("belgachhia", "belgachia")
    s = s.replace("hajra", "hazra")
    s = s.replace("sanagha", "sangha")
    s = s.replace("bhattacharjee", "bhatacharjee")
    s = s.replace("tricone", "tricon")
    s = s.replace("shibtola", "shibtala")
    s = s.replace("nobo", "nabo")
    s = s.replace("talbagan", "tal bagan")
    s = s.replace("ballygaunge", "ballygunge")
    s = s.replace("bostala", "bostolla")
    return s.strip()

def main():
    with open(DATA_TXT_PATH, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    pattern = re.compile(r"^\s*(\d+)\.\s*(.*?)\s*[-–]\s*([0-9.]+),\s*([0-9.]+)\s*$")
    txt_list = []
    for l in lines:
        m = pattern.match(l)
        if m:
            txt_list.append({
                "num": int(m.group(1)),
                "name": m.group(2).strip(),
                "lat": float(m.group(3)),
                "lng": float(m.group(4))
            })

    print(f"Parsed {len(txt_list)} entries from data.txt")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        json_pandals = json.load(f)

    print(f"Existing JSON has {len(json_pandals)} entries")

    matched_json_indices = set()
    new_pandals = []

    for t in txt_list:
        t_clean = clean(t["name"])
        best_match = None
        best_idx = None

        if "75 pally" in t_clean:
            if "khidirpur" in t["name"].lower():
                for idx, j in enumerate(json_pandals):
                    if "khidirpur" in j["cluster"].lower() and "75 pally" in clean(j["name"]):
                        best_match = j
                        best_idx = idx
                        break
            else:
                for idx, j in enumerate(json_pandals):
                    if ("bhowanipur" in j["cluster"].lower() or "bhawanipur" in j["cluster"].lower()) and "75 pally" in clean(j["name"]):
                        best_match = j
                        best_idx = idx
                        break
        else:
            for idx, j in enumerate(json_pandals):
                if idx in matched_json_indices:
                    continue
                j_clean = clean(j["name"])
                if t_clean == j_clean or t_clean in j_clean or j_clean in t_clean:
                    best_match = j
                    best_idx = idx
                    break

            if not best_match:
                t_words = set(t_clean.split())
                max_common = 0
                for idx, j in enumerate(json_pandals):
                    if idx in matched_json_indices:
                        continue
                    j_clean = clean(j["name"])
                    j_words = set(j_clean.split())
                    common = len(t_words & j_words)
                    if common > max_common and common >= 2:
                        max_common = common
                        best_match = j
                        best_idx = idx

        if best_match is None:
            raise ValueError(f"Could not find match for TXT item: {t['num']}. {t['name']}")

        matched_json_indices.add(best_idx)

        # Build entry: keep all original metadata fields intact, strictly override location
        updated_item = {
            "name": best_match["name"],
            "region": best_match["region"],
            "cluster": best_match["cluster"],
            "location": {
                "latitude": t["lat"],
                "longitude": t["lng"]
            },
            "nearest_metro": best_match.get("nearest_metro"),
            "nearest_stations": best_match.get("nearest_stations", []),
            "nearest_ferry": best_match.get("nearest_ferry")
        }
        new_pandals.append(updated_item)

    print(f"Successfully constructed {len(new_pandals)} updated pandals.")

    # Overwrite debi_dorshon.json
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(new_pandals, f, indent=2, ensure_ascii=False)

    print(f"Successfully overwrote: {JSON_PATH}")

if __name__ == "__main__":
    main()
