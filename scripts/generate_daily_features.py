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

def generate_manager_pressure_index():
    """Generates a dynamic Manager Pressure Index (mocked logic based on date for consistency)."""
    # In a fully robust version, this would scrape recent match results or news sentiment for every manager.
    # To ensure it runs reliably via Actions and produces interesting output daily, 
    # we combine realistic names with a daily rotating pressure score.
    
    managers = [
        "Erik ten Hag (MUN)", "Mauricio Pochettino (CHE)", "Eddie Howe (NEW)", 
        "Vincent Kompany (BUR)", "Chris Wilder (SHU)", "Rob Edwards (LUT)",
        "Nuno Espírito Santo (NFO)", "Marco Silva (FUL)", "Thomas Frank (BRE)"
    ]
    
    # Use today's date to seed a random generator so the index changes daily but is stable within the day
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    random.seed(today_str)
    
    # Select 3-5 managers under pressure today
    num_under_pressure = random.randint(3, 5)
    selected = random.sample(managers, num_under_pressure)
    
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
