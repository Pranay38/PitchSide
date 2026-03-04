#!/usr/bin/env python3
"""
Player Similarity Engine — FBref Data Pipeline
Uses SeleniumBase UC mode to bypass Cloudflare, scrapes Big 5 European League
player stats, computes cosine similarity, and exports JSON.
"""

import json
import os
import time
import warnings

import numpy as np
import pandas as pd
from io import StringIO
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ─── Configuration ───────────────────────────────────────────────────────────

BASE_URL = "https://fbref.com/en/comps/Big5"
URLS = {
    "standard": f"{BASE_URL}/stats/players/Big-5-European-Leagues-Stats",
    "shooting": f"{BASE_URL}/shooting/players/Big-5-European-Leagues-Stats",
    "passing":  f"{BASE_URL}/passing/players/Big-5-European-Leagues-Stats",
    "defense":  f"{BASE_URL}/defense/players/Big-5-European-Leagues-Stats",
}

TABLE_IDS = {
    "standard": "stats_standard",
    "shooting": "stats_shooting",
    "passing":  "stats_passing",
    "defense":  "stats_defense",
}

MIN_MINUTES = 0
INCLUDE_GOALKEEPERS = True

FEATURES = [
    "Gls_per90", "Ast_per90", "xG_per90", "xAG_per90",
    "PrgC_per90", "PrgP_per90",
    "KP_per90",
    "Tkl_per90", "Int_per90", "Blocks_per90",
    "SoT_per90",
    "CmpPct",
]

RADAR_LABELS = [
    "Goals", "Assists", "xG", "xAG",
    "Prog Carries", "Prog Passes",
    "Key Passes",
    "Tackles", "Interceptions", "Blocks",
    "Shots on Target",
    "Pass Cmp%",
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")

# ─── SeleniumBase UC Mode Fetcher ────────────────────────────────────────────

def create_driver():
    from seleniumbase import Driver
    return Driver(uc=True, headless=False)


def fetch_table_uc(driver, url: str, table_id: str) -> pd.DataFrame:
    """
    Navigate to FBref using UC mode, scroll to trigger JS rendering,
    then extract the specific table by ID from the live DOM.
    """
    print(f"  ↳ Navigating: {url.split('/')[-1]}...")
    driver.uc_open_with_reconnect(url, reconnect_time=6)
    time.sleep(5)

    # Try to pass Cloudflare
    try:
        driver.uc_gui_click_captcha()
        time.sleep(3)
    except Exception:
        pass

    # Scroll down to trigger lazy-loading of tables
    for _ in range(8):
        driver.execute_script("window.scrollBy(0, 1500)")
        time.sleep(1)

    # Wait for the target table to appear
    for attempt in range(15):
        check = driver.execute_script(
            f'var t = document.getElementById("{table_id}"); '
            f'return t ? t.rows.length : 0;'
        )
        if check and check > 50:
            print(f"  ✓ Table '{table_id}' found: {check} rows")
            break
        time.sleep(2)
    else:
        # Last resort: grab the page source after full loading
        print(f"  ⚠ Table '{table_id}' not found via DOM, trying page_source...")

    # Get the FULL rendered page source (includes JS-rendered tables)
    html = driver.page_source
    print(f"  ✓ Page loaded ({len(html):,} chars)")

    # Parse with pandas — use attrs to target our specific table
    try:
        tables = pd.read_html(StringIO(html), attrs={"id": table_id})
        if tables:
            df = tables[0]
        else:
            raise ValueError(f"No table with id='{table_id}'")
    except Exception:
        # Fallback: grab all tables, find the one with the most rows
        tables = pd.read_html(StringIO(html))
        df = max(tables, key=lambda t: len(t))
        print(f"  ⚠ Using fallback: largest table ({len(df)} rows)")

    # Clean up column names if multi-level
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [
            "_".join(str(c) for c in col).strip()
            if str(col[1]) != str(col[0]) else str(col[0])
            for col in df.columns
        ]

    # Remove repeated header rows
    first_col = df.columns[0]
    df = df[df[first_col].astype(str) != str(first_col)]
    df = df[df[first_col].astype(str) != "Rk"]
    df = df.reset_index(drop=True)

    return df


def safe_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def find_col(df, patterns):
    for col in df.columns:
        col_lower = str(col).lower()
        for p in patterns:
            if p.lower() == col_lower or p.lower() in col_lower:
                return col
    return None


def normalize_identity_columns(df: pd.DataFrame) -> pd.DataFrame:
    normalized = df.copy()
    rename_map = {}

    player_col = find_col(normalized, ["Player"])
    squad_col = find_col(normalized, ["Squad"])
    comp_col = find_col(normalized, ["Comp"])

    if player_col and player_col != "Player":
        rename_map[player_col] = "Player"
    if squad_col and squad_col != "Squad":
        rename_map[squad_col] = "Squad"
    if comp_col and comp_col != "Comp":
        rename_map[comp_col] = "Comp"

    if rename_map:
        normalized = normalized.rename(columns=rename_map)

    if "Player" not in normalized.columns:
        normalized["Player"] = ""
    if "Squad" not in normalized.columns:
        normalized["Squad"] = ""
    if "Comp" not in normalized.columns:
        normalized["Comp"] = ""

    for col in ["Player", "Squad", "Comp"]:
        normalized[col] = normalized[col].fillna("").astype(str).str.strip()

    normalized["EntityKey"] = (
        normalized["Player"] + "||" + normalized["Squad"] + "||" + normalized["Comp"]
    )
    return normalized


def extract_stat(df, patterns):
    normalized = normalize_identity_columns(df)
    col = find_col(normalized, patterns)
    if col is None:
        return None

    result = normalized[["EntityKey", "Player", "Squad", "Comp", col]].copy()
    result.columns = ["EntityKey", "Player", "Squad", "Comp", "stat"]
    result["stat"] = safe_numeric(result["stat"])
    result = result.dropna(subset=["stat"])
    result = result.drop_duplicates(subset="EntityKey", keep="first")
    return result


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("\n⚽ Player Similarity Engine — FBref Pipeline (SeleniumBase UC)")
    print("=" * 65)

    print("\n📥 Phase 1: Fetching FBref tables...")
    driver = create_driver()

    try:
        # Fetch shooting FIRST to bypass Cloudflare, then standard stats
        shoot_df = fetch_table_uc(driver, URLS["shooting"], TABLE_IDS["shooting"])
        time.sleep(4)
        std_df = fetch_table_uc(driver, URLS["standard"], TABLE_IDS["standard"])
        time.sleep(4)
        pass_df = fetch_table_uc(driver, URLS["passing"], TABLE_IDS["passing"])
        time.sleep(4)
        def_df = fetch_table_uc(driver, URLS["defense"], TABLE_IDS["defense"])
    finally:
        driver.quit()

    print(f"\n  Standard: {len(std_df)} rows, {len(std_df.columns)} cols")
    print(f"  Shooting: {len(shoot_df)} rows, {len(shoot_df.columns)} cols")
    print(f"  Passing:  {len(pass_df)} rows, {len(pass_df.columns)} cols")
    print(f"  Defense:  {len(def_df)} rows, {len(def_df.columns)} cols")

    # ── Step 2: Clean & merge ─────────────────────────────────────────────
    print("\n🧹 Phase 2: Cleaning & merging...")

    master = normalize_identity_columns(std_df)
    pos_col = find_col(master, ["Pos"])
    if pos_col and pos_col != "Pos":
        master = master.rename(columns={pos_col: "Pos"})
    if "Pos" not in master.columns:
        master["Pos"] = ""

    # Find and clean minutes
    min_col = find_col(master, ["Min"])
    if min_col and min_col != "Min":
        master = master.rename(columns={min_col: "Min"})

    if "Min" in master.columns:
        master["Min"] = master["Min"].astype(str).str.replace(",", "").str.replace(" ", "")
        master["Min"] = safe_numeric(master["Min"])
    else:
        nineties_col = find_col(master, ["90s"])
        if nineties_col:
            master["Min"] = safe_numeric(master[nineties_col]) * 90
        else:
            print("  ⚠ Available columns:", list(master.columns[:20]))
            raise ValueError("Cannot find minutes column")

    master = master[master["Min"] >= MIN_MINUTES].copy()
    master["_90s"] = master["Min"] / 90.0
    master["_90s"] = master["_90s"].replace(0, np.nan)

    # Optionally remove goalkeepers
    if not INCLUDE_GOALKEEPERS and "Pos" in master.columns:
        before = len(master)
        master = master[~master["Pos"].astype(str).str.contains("GK", case=False, na=False)]
        print(f"  ✓ Removed {before - len(master)} goalkeepers")

    print(f"  ✓ Players with ≥{MIN_MINUTES} min: {len(master)}")

    # ── Step 3: Per-90 metrics ────────────────────────────────────────────
    print("\n📊 Phase 3: Computing per-90 metrics...")

    # Goals & Assists
    for pattern, per90_name in [("Gls", "Gls_per90"), ("Ast", "Ast_per90")]:
        col = find_col(master, [pattern])
        master[per90_name] = safe_numeric(master[col]) / master["_90s"] if col else 0

    # xG and xAG
    for pattern, per90_name in [("xG", "xG_per90"), ("xAG", "xAG_per90")]:
        col = find_col(master, [pattern])
        if col:
            val = safe_numeric(master[col])
            master[per90_name] = val / master["_90s"] if val.mean() > 2 else val
        else:
            master[per90_name] = 0

    # Progressive carries & passes
    for pattern, per90_name, src in [
        ("PrgC", "PrgC_per90", std_df),
        ("PrgP", "PrgP_per90", pass_df),
    ]:
        stat = extract_stat(src, [pattern])
        if stat is not None:
            master = master.merge(
                stat[["EntityKey", "stat"]].rename(columns={"stat": f"_{pattern}"}),
                on="EntityKey",
                how="left",
            )
            master[per90_name] = safe_numeric(master[f"_{pattern}"]) / master["_90s"]
        else:
            master[per90_name] = 0

    # Key passes
    stat = extract_stat(pass_df, ["KP"])
    if stat is not None:
        master = master.merge(
            stat[["EntityKey", "stat"]].rename(columns={"stat": "_KP"}),
            on="EntityKey",
            how="left",
        )
        master["KP_per90"] = safe_numeric(master["_KP"]) / master["_90s"]
    else:
        master["KP_per90"] = 0

    # Pass completion %
    stat = extract_stat(pass_df, ["Cmp%"])
    if stat is not None:
        master = master.merge(
            stat[["EntityKey", "stat"]].rename(columns={"stat": "CmpPct"}),
            on="EntityKey",
            how="left",
        )
        master["CmpPct"] = safe_numeric(master["CmpPct"])
    else:
        master["CmpPct"] = 0

    # Defensive stats
    for pattern, per90_name in [("Tkl", "Tkl_per90"), ("Int", "Int_per90"), ("Blocks", "Blocks_per90")]:
        stat = extract_stat(def_df, [pattern])
        if stat is not None:
            master = master.merge(
                stat[["EntityKey", "stat"]].rename(columns={"stat": f"_{pattern}"}),
                on="EntityKey",
                how="left",
            )
            master[per90_name] = safe_numeric(master[f"_{pattern}"]) / master["_90s"]
        else:
            master[per90_name] = 0

    # Shots on target
    stat = extract_stat(shoot_df, ["SoT"])
    if stat is not None:
        master = master.merge(
            stat[["EntityKey", "stat"]].rename(columns={"stat": "_SoT"}),
            on="EntityKey",
            how="left",
        )
        master["SoT_per90"] = safe_numeric(master["_SoT"]) / master["_90s"]
    else:
        master["SoT_per90"] = 0

    # Deduplicate & fill NaN
    master = master.drop_duplicates(subset="EntityKey", keep="first")
    for feat in FEATURES:
        if feat not in master.columns:
            master[feat] = 0
        master[feat] = master[feat].fillna(0)

    # Replace inf values
    master = master.replace([np.inf, -np.inf], 0)

    print(f"  ✓ Final: {len(master)} players × {len(FEATURES)} features")

    # ── Step 4: Cosine similarity ─────────────────────────────────────────
    print("\n🧠 Phase 4: Computing cosine similarity...")

    feature_matrix = master[FEATURES].values.astype(float)
    scaler = StandardScaler()
    scaled = scaler.fit_transform(feature_matrix)
    sim_matrix = cosine_similarity(scaled)

    print(f"  ✓ Matrix: {sim_matrix.shape[0]}×{sim_matrix.shape[1]}")

    # ── Step 5: Export ────────────────────────────────────────────────────
    print("\n💾 Phase 5: Exporting...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    players = master["Player"].tolist()
    squads = master["Squad"].tolist() if "Squad" in master.columns else [""] * len(players)
    comps = master["Comp"].tolist() if "Comp" in master.columns else [""] * len(players)
    entity_keys = master["EntityKey"].tolist() if "EntityKey" in master.columns else players

    labels = []
    used_labels = set()
    for i, player_name in enumerate(players):
        primary = player_name
        with_squad = f"{player_name} ({squads[i]})" if squads[i] else player_name
        with_comp = f"{with_squad} - {comps[i]}" if comps[i] else with_squad

        chosen = None
        for candidate in [primary, with_squad, with_comp]:
            if candidate not in used_labels:
                chosen = candidate
                break
        if chosen is None:
            suffix = 2
            while f"{with_comp} #{suffix}" in used_labels:
                suffix += 1
            chosen = f"{with_comp} #{suffix}"
        used_labels.add(chosen)
        labels.append(chosen)

    label_by_idx = {i: labels[i] for i in range(len(labels))}

    # similarity.json
    similarity_data = {}
    for i, player in enumerate(players):
        scores = sim_matrix[i]
        top_indices = np.argsort(scores)[::-1]
        similar = []
        for j in top_indices:
            if j == i:
                continue
            similar.append({
                "key": label_by_idx[j],
                "name": players[j],
                "similarity": round(float(scores[j]), 4),
                "club": squads[j],
                "league": comps[j],
            })
            if len(similar) >= 5:
                break
        similarity_data[label_by_idx[i]] = similar

    with open(os.path.join(OUTPUT_DIR, "similarity.json"), "w", encoding="utf-8") as f:
        json.dump(similarity_data, f, ensure_ascii=False, indent=2)

    # player_stats.json
    stats_data = {}
    for i, player in enumerate(players):
        stats_data[label_by_idx[i]] = {
            "name": player,
            "entityKey": entity_keys[i],
            "club": squads[i],
            "league": comps[i],
            "position": str(master.iloc[i].get("Pos", "")),
            "minutes": int(master.iloc[i]["Min"]),
            "stats": {
                label: round(float(master.iloc[i][feat]), 3)
                for label, feat in zip(RADAR_LABELS, FEATURES)
            }
        }

    with open(os.path.join(OUTPUT_DIR, "player_stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats_data, f, ensure_ascii=False, indent=2)

    print(f"\n  ✅ similarity.json  → {len(similarity_data)} players")
    print(f"  ✅ player_stats.json → {len(stats_data)} players")
    print(f"  📂 Output: {OUTPUT_DIR}")
    print("\n🎉 Done!\n")


if __name__ == "__main__":
    main()
