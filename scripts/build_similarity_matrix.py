#!/usr/bin/env python3
"""Build a single static similarity matrix JSON for the frontend tool."""

from __future__ import annotations

import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
SIMILARITY_PATH = DATA_DIR / "similarity.json"
PLAYER_STATS_PATH = DATA_DIR / "player_stats.json"
OUTPUT_PATH = DATA_DIR / "similarity_matrix.json"

TOP_CLUBS = {
    "arsenal",
    "aston villa",
    "atletico madrid",
    "barcelona",
    "bayern munich",
    "borussia dortmund",
    "chelsea",
    "inter",
    "juventus",
    "liverpool",
    "manchester city",
    "manchester utd",
    "milan",
    "napoli",
    "newcastle united",
    "paris saint-germain",
    "real madrid",
    "tottenham hotspur",
}

LEAGUE_MULTIPLIERS = {
    "premier league": 1.22,
    "la liga": 1.14,
    "serie a": 1.1,
    "bundesliga": 1.1,
    "ligue 1": 1.03,
}

SPOTLIGHT_PLAYERS = [
    "Rodri",
    "Declan Rice",
    "Martin Ødegaard",
    "Jamal Musiala",
    "Pedri",
    "Bukayo Saka",
    "Florian Wirtz",
    "Erling Haaland",
    "Alexander Isak",
    "Vinicius Júnior",
]


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def parse_position_group(position: str) -> str:
    raw = (position or "").upper()
    if "GK" in raw:
        return "Goalkeeper"
    if "DF" in raw:
        return "Defender"
    if "MF" in raw:
        return "Midfielder"
    if "FW" in raw:
        return "Forward"
    return "Utility"


def get_league_multiplier(league: str) -> float:
    text = (league or "").lower()
    for key, multiplier in LEAGUE_MULTIPLIERS.items():
        if key in text:
            return multiplier
    return 0.98


def get_club_multiplier(club: str) -> float:
    normalized = (club or "").strip().lower()
    return 1.28 if normalized in TOP_CLUBS else 1.0


def compact_eur(value: float) -> str:
    if value >= 1_000_000_000:
        return f"€{value / 1_000_000_000:.1f}bn"
    if value >= 1_000_000:
        rounded = value / 1_000_000
        return f"€{rounded:.1f}m" if rounded < 10 else f"€{rounded:.0f}m"
    return f"€{value:,.0f}"


def build_metric_bounds(player_stats: dict[str, Any]) -> dict[str, tuple[float, float]]:
    all_labels: set[str] = set()
    for payload in player_stats.values():
        all_labels.update(payload.get("stats", {}).keys())

    bounds: dict[str, tuple[float, float]] = {}
    for label in all_labels:
        values: list[float] = []
        for payload in player_stats.values():
            value = payload.get("stats", {}).get(label)
            if isinstance(value, (int, float)):
                values.append(float(value))
        if not values:
            bounds[label] = (0.0, 1.0)
            continue
        lower = min(values)
        upper = max(values)
        if math.isclose(lower, upper):
            upper = lower + 1.0
        bounds[label] = (lower, upper)

    return bounds


def calculate_quality_score(
    stats: dict[str, float],
    metric_bounds: dict[str, tuple[float, float]],
    minutes: int,
) -> float:
    normalized_values: list[float] = []
    for label, value in stats.items():
        lower, upper = metric_bounds.get(label, (0.0, 1.0))
        scaled = (float(value) - lower) / (upper - lower)
        normalized_values.append(clamp(scaled, 0.0, 1.0))

    stat_component = mean(normalized_values) * 100 if normalized_values else 0
    minutes_component = clamp(minutes / 2600.0, 0.3, 1.2) * 18
    return round(clamp(stat_component * 0.78 + minutes_component, 1.0, 99.0), 2)


def estimate_market_value(player: dict[str, Any]) -> int:
    quality = float(player["qualityScore"])
    minutes_factor = clamp(int(player["minutes"]) / 2400.0, 0.35, 1.2)
    league_multiplier = get_league_multiplier(str(player.get("league", "")))
    club_multiplier = get_club_multiplier(str(player.get("club", "")))
    base_value = 1_600_000
    quality_component = (quality**1.32) * 82_000
    value = (base_value + quality_component) * minutes_factor * league_multiplier * club_multiplier
    value = clamp(value, 1_000_000.0, 180_000_000.0)
    rounded = int(round(value / 100_000.0) * 100_000)
    return rounded


def pick_player_key_from_maps(
    raw_key: str | None,
    raw_name: str | None,
    raw_club: str | None,
    raw_league: str | None,
    players: dict[str, dict[str, Any]],
    keys_by_name: dict[str, list[str]],
) -> str | None:
    if raw_key and raw_key in players:
        return raw_key

    if not raw_name:
        return None

    candidates = list(keys_by_name.get(raw_name, []))
    if not candidates:
        return None

    if raw_club:
        club_filtered = [key for key in candidates if str(players[key].get("club", "")) == raw_club]
        if club_filtered:
            candidates = club_filtered

    if raw_league and len(candidates) > 1:
        league_filtered = [key for key in candidates if str(players[key].get("league", "")) == raw_league]
        if league_filtered:
            candidates = league_filtered

    return candidates[0] if candidates else None


def main() -> None:
    similarity_data = json.loads(SIMILARITY_PATH.read_text(encoding="utf-8"))
    player_stats = json.loads(PLAYER_STATS_PATH.read_text(encoding="utf-8"))
    metric_bounds = build_metric_bounds(player_stats)

    players: dict[str, dict[str, Any]] = {}
    for player_key, payload in player_stats.items():
        display_name = str(payload.get("name") or player_key).strip()
        stats = payload.get("stats", {})
        minutes = int(payload.get("minutes", 0))
        player_record = {
            "key": player_key,
            "name": display_name,
            "entityKey": payload.get("entityKey", ""),
            "club": payload.get("club", ""),
            "league": payload.get("league", ""),
            "position": payload.get("position", ""),
            "positionGroup": parse_position_group(str(payload.get("position", ""))),
            "minutes": minutes,
            "stats": stats,
            "qualityScore": calculate_quality_score(stats, metric_bounds, minutes),
        }
        player_record["estimatedValueEur"] = estimate_market_value(player_record)
        player_record["estimatedValueText"] = compact_eur(float(player_record["estimatedValueEur"]))
        players[player_key] = player_record

    keys_by_name: dict[str, list[str]] = defaultdict(list)
    for key, payload in players.items():
        keys_by_name[str(payload.get("name", ""))].append(key)

    matches: dict[str, list[dict[str, Any]]] = {}
    for source_key, nearest in similarity_data.items():
        base_key = pick_player_key_from_maps(
            raw_key=source_key,
            raw_name=source_key,
            raw_club=None,
            raw_league=None,
            players=players,
            keys_by_name=keys_by_name,
        )
        if not base_key:
            continue

        base_player = players.get(base_key)
        if not base_player:
            continue

        base_value = max(int(base_player["estimatedValueEur"]), 1)
        candidates: list[dict[str, Any]] = []
        for item in nearest:
            target_key = pick_player_key_from_maps(
                raw_key=item.get("key") if isinstance(item, dict) else None,
                raw_name=item.get("name") if isinstance(item, dict) else None,
                raw_club=item.get("club") if isinstance(item, dict) else None,
                raw_league=item.get("league") if isinstance(item, dict) else None,
                players=players,
                keys_by_name=keys_by_name,
            )
            if not target_key:
                continue

            target_player = players.get(target_key)
            if not target_player:
                continue

            candidate_value = max(int(target_player["estimatedValueEur"]), 1)
            ratio = candidate_value / base_value
            savings_pct = clamp((1.0 - ratio) * 100.0, -500.0, 99.9)
            affordability = clamp((1.0 - ratio) * 100.0, 0.0, 100.0)
            similarity_pct = clamp(float(item.get("similarity", 0.0)) * 100.0, 0.0, 100.0)
            availability_boost = clamp(int(target_player["minutes"]) / 1800.0, 0.0, 1.0) * 8.0
            hidden_gem_score = clamp(
                similarity_pct * 0.64 + affordability * 0.28 + availability_boost,
                0.0,
                100.0,
            )

            candidates.append(
                {
                    "key": target_key,
                    "name": target_player.get("name", target_key),
                    "similarity": round(float(item.get("similarity", 0.0)), 4),
                    "hiddenGemScore": round(hidden_gem_score, 2),
                    "club": target_player.get("club", ""),
                    "league": target_player.get("league", ""),
                    "position": target_player.get("position", ""),
                    "positionGroup": target_player.get("positionGroup", "Utility"),
                    "minutes": int(target_player.get("minutes", 0)),
                    "estimatedValueEur": candidate_value,
                    "estimatedValueText": target_player.get("estimatedValueText", compact_eur(candidate_value)),
                    "valueRatio": round(ratio, 4),
                    "savingsPct": round(savings_pct, 2),
                }
            )

        candidates.sort(
            key=lambda candidate: (
                candidate["hiddenGemScore"],
                candidate["similarity"],
            ),
            reverse=True,
        )
        matches[base_key] = candidates

    spotlight_players: list[str] = []
    for name in SPOTLIGHT_PLAYERS:
        if name in players:
            spotlight_players.append(name)
            continue
        fallback = keys_by_name.get(name, [])
        if fallback:
            spotlight_players.append(fallback[0])
    if not spotlight_players:
        spotlight_players = sorted(players.keys())[:12]

    output_payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFiles": {
            "similarity": str(SIMILARITY_PATH.relative_to(ROOT)),
            "playerStats": str(PLAYER_STATS_PATH.relative_to(ROOT)),
        },
        "methodology": {
            "similarityModel": "Cosine similarity precomputed from FBref per-90 features.",
            "valueModel": (
                "Estimated transfer value proxy from quality score, minutes, league weight, and club premium. "
                "Use for showcase comparisons, not financial decisions."
            ),
        },
        "featureLabels": sorted(next(iter(players.values())).get("stats", {}).keys()) if players else [],
        "players": players,
        "matches": matches,
        "spotlightPlayers": spotlight_players,
    }

    OUTPUT_PATH.write_text(
        json.dumps(output_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH} with {len(players)} players and {len(matches)} match rows.")


if __name__ == "__main__":
    main()
