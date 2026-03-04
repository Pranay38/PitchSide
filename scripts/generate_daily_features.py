#!/usr/bin/env python3
import json
import os
import requests
from bs4 import BeautifulSoup
import datetime
import random
import re

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "daily_features.json")

# Ensure NLTK vader lexicon is downloaded (can be pre-installed in Actions)
try:
    import nltk
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    nltk.download('vader_lexicon', quiet=True)
    sia = SentimentIntensityAnalyzer()
except ImportError:
    sia = None
    print("NLTK not installed. Sentiment will be random.")


def scrape_on_this_day():
    """Scrapes Wikipedia for a football event that happened on this day."""
    today = datetime.datetime.now()
    month_name = today.strftime("%B")
    day = today.day
    
    url = f"https://en.wikipedia.org/wiki/{month_name}_{day}"
    print(f"Scraping Wikipedia: {url}")
    
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        
        events = []
        # Find the 'Events' section
        events_heading = soup.find(id="Events")
        if events_heading:
            # Get the ul immediately following the heading's parent
            ul = events_heading.parent.find_next_sibling("ul")
            if ul:
                for li in ul.find_all("li"):
                    text = li.get_text()
                    # Look for football/soccer related keywords
                    keywords = ['football', 'soccer', 'premier league', 'fifa', 'champions league', 'world cup']
                    if any(kw in text.lower() for kw in keywords):
                        # Extract year and event description (typical wiki format: "Year – Event")
                        parts = text.split("–", 1)
                        if len(parts) == 2:
                            year = parts[0].strip()
                            # remove references like [1]
                            desc = re.sub(r'\[\d+\]', '', parts[1]).strip()
                            events.append({"year": year, "event": desc})
        
        if events:
            # Pick a random football event from today
            return random.choice(events)
            
        print("No football events found for today on Wikipedia.")
    except Exception as e:
        print(f"Error scraping Wikipedia On This Day: {e}")
        
    # Fallback to a generic history fact
    return {
        "year": "2026",
        "event": "A quiet day in football history, but the beautiful game continues on pitches worldwide."
    }

def scrape_rumors_and_sentiment():
    """Scrapes BBC Football Gossip for a top rumor and analyzes sentiment."""
    url = "https://www.bbc.com/sport/football/gossip"
    print(f"Scraping BBC Gossip: {url}")
    headers = {"User-Agent": "Mozilla/5.0"}
    
    rumor_text = "Real Madrid are reportedly preparing a massive bid for the Premier League's top scorer next summer."
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # BBC structure changes often, but paragraphs inside main content usually hold rumors
        # Looking for standard paragraph tags
        paragraphs = soup.find_all('p', class_=re.compile(r'ssrcss-1q0x1qg-Paragraph|.*?'))
        
        rumors = []
        for p in paragraphs:
            text = p.get_text().strip()
            # A typical rumor is a substantial sentence, often ending with a source in brackets (The Sun)
            if len(text) > 40 and text[0].isupper() and not text.startswith("Read"):
                rumors.append(text)
                
        if rumors:
            # Pick the top rumor or a random one from top 3
            rumor_text = random.choice(rumors[:3])
            
    except Exception as e:
        print(f"Error scraping BBC Gossip: {e}")
        
    # Perform Sentiment Analysis
    score = 50 # Default neutral
    if sia:
        sentiment = sia.polarity_scores(rumor_text)
        # compound score is between -1 (negative) and +1 (positive)
        # map it to 0-100 where 50 is neutral
        score = int((sentiment['compound'] + 1) * 50)
        
    return {
        "text": rumor_text,
        "sentimentScore": score # 0 = Hate it, 100 = Love it
    }

def get_active_pl_managers():
    """Scrapes the list of current Premier League managers from Wikipedia."""
    url = "https://en.wikipedia.org/wiki/List_of_current_Premier_League_and_English_Football_League_managers"
    headers = {"User-Agent": "Mozilla/5.0"}
    managers = []
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Find the Premier League table (usually the first sortable table)
        pl_heading = soup.find(id="Premier_League")
        if pl_heading:
            table = pl_heading.find_next("table", class_="wikitable")
            if table:
                rows = table.find_all("tr")[1:] # Skip header
                for row in rows:
                    cols = row.find_all(["td", "th"])
                    if len(cols) >= 3:
                        # Manager name is usually in the first column
                        manager_name = cols[0].get_text(strip=True)
                        # Clean up references like [1]
                        manager_name = re.sub(r'\[\d+\]', '', manager_name)
                        
                        # Club is usually the third column
                        club_name = cols[2].get_text(strip=True)
                        
                        # Create a short code for the club (e.g., Manchester United -> MUN)
                        club_words = club_name.split()
                        if len(club_words) > 1:
                            short_code = (club_words[0][:1] + club_words[1][:2]).upper()
                        else:
                            short_code = club_name[:3].upper()
                            
                        managers.append(f"{manager_name} ({short_code})")
    except Exception as e:
        print(f"Error scraping managers: {e}")
        
    # Fallback to realistic current managers if scraping fails entirely
    if not managers:
        managers = [
            "Mikel Arteta (ARS)", "Unai Emery (AST)", "Andoni Iraola (BOU)", 
            "Thomas Frank (BRE)", "Fabian Hürzeler (BHA)", "Enzo Maresca (CHE)", 
            "Oliver Glasner (CRY)", "Sean Dyche (EVE)", "Marco Silva (FUL)", 
            "Kieran McKenna (IPS)", "Steve Cooper (LEI)", "Arne Slot (LIV)", 
            "Pep Guardiola (MCI)", "Rúben Amorim (MUN)", "Eddie Howe (NEW)",
            "Nuno Espírito Santo (NFO)", "Russell Martin (SOU)", "Ange Postecoglou (TOT)", 
            "Julen Lopetegui (WHU)", "Gary O'Neil (WOL)"
        ]
        
    return managers

def generate_manager_pressure_index():
    """Generates a dynamic Manager Pressure Index using live manager lists."""
    
    managers = get_active_pl_managers()
    
    # Use today's date to seed a random generator so the index changes daily but is stable within the day
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    random.seed(today_str)
    
    # Select 3-5 managers under pressure today
    num_under_pressure = random.randint(3, 5)
    selected = random.sample(managers, min(num_under_pressure, len(managers)))
    
    results = []
    for manager in selected:
        # Assign a random pressure score between 60 and 99
        pressure = random.randint(60, 99)
        results.append({
            "name": manager,
            "pressureScore": pressure
        })
        
    # Sort by highest pressure
    results.sort(key=lambda x: x['pressureScore'], reverse=True)
    return results

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    print("Generating Daily Fix Features...")
    
    data = {
        "lastUpdated": datetime.datetime.now().isoformat(),
        "onThisDay": scrape_on_this_day(),
        "rumorMill": scrape_rumors_and_sentiment(),
        "managerPressure": generate_manager_pressure_index()
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    print(f"Successfully wrote data to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
