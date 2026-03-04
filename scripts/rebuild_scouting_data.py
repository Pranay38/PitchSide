#!/usr/bin/env python3
"""Rebuild static scouting datasets for Replacement Planner and Team Tactical DNA."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"


def run_step(script_name: str) -> None:
    script_path = SCRIPTS / script_name
    command = [sys.executable, str(script_path)]
    print(f"\n▶ Running: {script_name}")
    subprocess.run(command, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild scouting datasets.")
    parser.add_argument(
        "--skip-scrape",
        action="store_true",
        help="Skip FBref scraping and reuse existing similarity/player stat files.",
    )
    args = parser.parse_args()

    print("⚽ Scouting Data Rebuild")
    print("=" * 44)

    if not args.skip_scrape:
        run_step("scrape_fbref.py")
    else:
        print("⏭ Skipping scrape step.")

    run_step("build_similarity_matrix.py")
    run_step("build_team_tactical_dna.py")

    print("\n✅ Done.")
    print("Generated files:")
    print("- public/data/similarity_matrix.json")
    print("- public/data/team_tactical_dna.json")


if __name__ == "__main__":
    main()
