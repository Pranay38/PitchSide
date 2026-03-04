#!/usr/bin/env python3
"""Build team tactical DNA profiles from player-level FBref-derived data."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
MATRIX_PATH = DATA_DIR / "similarity_matrix.json"
OUTPUT_PATH = DATA_DIR / "team_tactical_dna.json"

DIMENSIONS = [
    "Goal Threat",
    "Chance Creation",
    "Progression",
    "Control",
    "Defensive Intensity",
    "Verticality",
]


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def average_stat(stats_sum: dict[str, float], total_minutes: float, label: str) -> float:
    if total_minutes <= 0:
        return 0.0
    return stats_sum.get(label, 0.0) / total_minutes


def normalize_dimension(values_by_team: dict[str, float]) -> dict[str, float]:
    if not values_by_team:
        return {}

    values = list(values_by_team.values())
    minimum = min(values)
    maximum = max(values)
    if minimum == maximum:
        return {team: 50.0 for team in values_by_team}

    normalized: dict[str, float] = {}
    for team, value in values_by_team.items():
        scaled = ((value - minimum) / (maximum - minimum)) * 100.0
        normalized[team] = round(clamp(scaled, 0.0, 100.0), 2)
    return normalized


def build_style_tags(scores: dict[str, float]) -> list[str]:
    tags: list[str] = []
    if scores.get("Goal Threat", 0) >= 70:
        tags.append("High Shot Threat")
    if scores.get("Chance Creation", 0) >= 70:
        tags.append("Creative Final Third")
    if scores.get("Progression", 0) >= 70:
        tags.append("Progressive Build-Up")
    if scores.get("Control", 0) >= 70:
        tags.append("Possession Control")
    if scores.get("Defensive Intensity", 0) >= 70:
        tags.append("Aggressive Ball Winning")
    if scores.get("Verticality", 0) >= 70:
        tags.append("Direct Vertical Play")

    if len(tags) >= 2:
        return tags[:3]

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    fallback_tags = [name for name, _ in ranked[:2]]
    return tags + fallback_tags


def main() -> None:
    matrix: dict[str, Any] = json.loads(MATRIX_PATH.read_text(encoding="utf-8"))
    players = matrix.get("players", {})

    buckets: dict[str, dict[str, Any]] = {}
    league_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for player in players.values():
        team = str(player.get("club", "")).strip()
        if not team:
            continue

        minutes = float(player.get("minutes", 0))
        if minutes <= 0:
            continue

        record = buckets.setdefault(
            team,
            {
                "totalMinutes": 0.0,
                "playersCount": 0,
                "weightedStats": defaultdict(float),
            },
        )

        record["totalMinutes"] += minutes
        record["playersCount"] += 1

        league = str(player.get("league", "")).strip()
        if league:
            league_counts[team][league] += 1

        stats: dict[str, float] = player.get("stats", {})
        for label, value in stats.items():
            if isinstance(value, (int, float)):
                record["weightedStats"][label] += float(value) * minutes

    teams_raw: dict[str, dict[str, Any]] = {}
    for team, payload in buckets.items():
        total_minutes = float(payload["totalMinutes"])
        if total_minutes < 5000:
            continue

        weighted_stats = payload["weightedStats"]
        goals = average_stat(weighted_stats, total_minutes, "Goals")
        assists = average_stat(weighted_stats, total_minutes, "Assists")
        xg = average_stat(weighted_stats, total_minutes, "xG")
        xag = average_stat(weighted_stats, total_minutes, "xAG")
        key_passes = average_stat(weighted_stats, total_minutes, "Key Passes")
        prog_carries = average_stat(weighted_stats, total_minutes, "Prog Carries")
        prog_passes = average_stat(weighted_stats, total_minutes, "Prog Passes")
        pass_cmp = average_stat(weighted_stats, total_minutes, "Pass Cmp%")
        tackles = average_stat(weighted_stats, total_minutes, "Tackles")
        interceptions = average_stat(weighted_stats, total_minutes, "Interceptions")
        blocks = average_stat(weighted_stats, total_minutes, "Blocks")
        shots_on_target = average_stat(weighted_stats, total_minutes, "Shots on Target")

        verticality_raw = (prog_passes + prog_carries + (shots_on_target * 0.6)) / (pass_cmp + 0.25)

        dimensions_raw = {
            "Goal Threat": (xg * 0.45) + (goals * 0.35) + (shots_on_target * 0.20),
            "Chance Creation": (xag * 0.45) + (key_passes * 0.35) + (assists * 0.20),
            "Progression": (prog_passes * 0.40) + (prog_carries * 0.40) + (pass_cmp * 0.20),
            "Control": (pass_cmp * 0.70) + (key_passes * 0.30),
            "Defensive Intensity": (tackles * 0.40) + (interceptions * 0.35) + (blocks * 0.25),
            "Verticality": verticality_raw,
        }

        primary_league = ""
        if league_counts[team]:
            primary_league = max(league_counts[team].items(), key=lambda item: item[1])[0]

        teams_raw[team] = {
            "club": team,
            "league": primary_league,
            "playersCount": int(payload["playersCount"]),
            "totalMinutes": int(round(total_minutes)),
            "rawDimensions": dimensions_raw,
            "featureAverages": {
                "Goals": round(goals, 4),
                "Assists": round(assists, 4),
                "xG": round(xg, 4),
                "xAG": round(xag, 4),
                "Key Passes": round(key_passes, 4),
                "Prog Carries": round(prog_carries, 4),
                "Prog Passes": round(prog_passes, 4),
                "Pass Cmp%": round(pass_cmp, 4),
                "Tackles": round(tackles, 4),
                "Interceptions": round(interceptions, 4),
                "Blocks": round(blocks, 4),
                "Shots on Target": round(shots_on_target, 4),
            },
        }

    normalized_dimensions: dict[str, dict[str, float]] = {}
    for dimension in DIMENSIONS:
        values = {
            team: payload["rawDimensions"][dimension]
            for team, payload in teams_raw.items()
        }
        normalized_dimensions[dimension] = normalize_dimension(values)

    teams_output: dict[str, dict[str, Any]] = {}
    for team, payload in teams_raw.items():
        scores = {
            dimension: normalized_dimensions.get(dimension, {}).get(team, 0.0)
            for dimension in DIMENSIONS
        }

        teams_output[team] = {
            "club": payload["club"],
            "league": payload["league"],
            "playersCount": payload["playersCount"],
            "totalMinutes": payload["totalMinutes"],
            "dimensionScores": scores,
            "rawDimensions": {k: round(v, 5) for k, v in payload["rawDimensions"].items()},
            "featureAverages": payload["featureAverages"],
            "styleTags": build_style_tags(scores),
        }

    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFile": str(MATRIX_PATH.relative_to(ROOT)),
        "dimensions": DIMENSIONS,
        "teams": teams_output,
    }

    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} with {len(teams_output)} teams.")


if __name__ == "__main__":
    main()
