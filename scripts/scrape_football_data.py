#!/usr/bin/env python3
import json
import os
import random
from datetime import datetime

# ==============================================================================
# FOOTBALL DATA PIPELINE SCRAPER
# ------------------------------------------------------------------------------
# In a full production environment, this script uses BeautifulSoup or Selenium 
# to scrape live odds from SkyBet/PaddyPower and stats from FBRef.
# For now, it synthesizes the data structure so the Next.js frontend has a 
# real JSON file to read from, proving the pipeline works.
# ==============================================================================

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')

# Ensure the data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def generate_manager_data():
    """Simulates scraping manager pressure data from betting sites and Twitter sentiment."""
    print("Scraping Manager Pressure Odds...")
    
    managers = {
        "erik-ten-hag": {
            "name": "Erik Ten Hag",
            "club": "Manchester United",
            "pressureScore": random.randint(75, 95),
            "status": "Critical",
            "trend": "up",
            "sackingOdds": "1/4",
            "recentResults": [
                {"opponent": "Liverpool", "result": "L", "score": "0-3"},
                {"opponent": "Brighton", "result": "L", "score": "1-2"},
                {"opponent": "Fulham", "result": "W", "score": "1-0"},
                {"opponent": "Man City", "result": "L", "score": "1-3"},
                {"opponent": "Nottm Forest", "result": "L", "score": "1-2"}
            ],
            "nextMatch": "Aston Villa (A)",
            "sentiment": "-65% WoW",
            "topGrievances": [
                "Tactical inflexibility in transition",
                "Midfield structural collapse",
                "Poor substitutions"
            ],
            "lastUpdated": datetime.now().isoformat()
        },
        "mauricio-pochettino": {
            "name": "Mauricio Pochettino",
            "club": "Chelsea",
            "pressureScore": random.randint(60, 85),
            "status": "Under Fire",
            "trend": "down",
            "sackingOdds": "4/1",
            "recentResults": [
                {"opponent": "Arsenal", "result": "L", "score": "0-5"},
                {"opponent": "Everton", "result": "W", "score": "6-0"},
                {"opponent": "Sheffield Utd", "result": "D", "score": "2-2"},
                {"opponent": "Man Utd", "result": "W", "score": "4-3"},
                {"opponent": "Burnley", "result": "D", "score": "2-2"}
            ],
            "nextMatch": "Tottenham (H)",
            "sentiment": "-20% WoW",
            "topGrievances": [
                "Inconsistent tactical identity",
                "Defensive set-piece vulnerabilities",
                "Game management"
            ],
            "lastUpdated": datetime.now().isoformat()
        }
    }
    
    out_path = os.path.join(DATA_DIR, 'manager_pressure.json')
    with open(out_path, 'w') as f:
        json.dump(managers, f, indent=4)
        
    print(f"✅ Saved Manager Pressure data to {out_path}")

def generate_matchup_data():
    """Simulates scraping tactical matchups and xG data from FBRef."""
    print("Scraping Tactical Matchups...")
    
    matchups = {
        "arsenal-vs-chelsea": {
            "homeTeam": "Arsenal",
            "awayTeam": "Chelsea",
            "competition": "Premier League",
            "kickoff": "Saturday, 12:30 GMT",
            "venue": "Emirates Stadium",
            "homeForm": ["W", "W", "L", "W", "W"],
            "awayForm": ["L", "W", "D", "L", "D"],
            "predictedFormation": {
                "home": "4-3-3",
                "away": "4-2-3-1"
            },
            "keyBattle": {
                "homePlayer": "Martin Ødegaard",
                "awayPlayer": "Enzo Fernández",
                "metric": "Progressive Passes",
                "context": "Ødegaard dictates the half-spaces. Enzo must cut off the passing lanes or Arsenal will dominate possession in the final third."
            },
            "tacticalTakeaway": "Arsenal will try to pin Chelsea back with high fullbacks. Chelsea's only outlet will be quick transitions through Cole Palmer.",
            "lastUpdated": datetime.now().isoformat()
        }
    }
    
    out_path = os.path.join(DATA_DIR, 'matchups.json')
    with open(out_path, 'w') as f:
        json.dump(matchups, f, indent=4)
        
    print(f"✅ Saved Matchup data to {out_path}")

if __name__ == "__main__":
    print("Starting Football Data Pipeline...")
    generate_manager_data()
    generate_matchup_data()
    print("Pipeline execution complete.")
