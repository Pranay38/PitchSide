import re
from bs4 import BeautifulSoup
import copy

with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Update fonts in the link
text = text.replace(
    'family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Outfit:',
    'family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Outfit:'
)

# Replace Bebas Neue globally with Newsreader
text = text.replace("'Bebas Neue',sans-serif", "'Newsreader', serif")
text = text.replace("'Bebas Neue', cursive", "'Newsreader', serif")
text = text.replace("font-family: 'Bebas Neue'", "font-family: 'Newsreader', serif")

# Also, Newsreader is a serif font, so let's make it italic when it replaces Bebas Neue to match the website style.
# The website actually uses Newsreader for headings, and the user likes it.

# Now we need to replace the text inside the slides with the user's text.
# Let's see what the old texts are.
# Slide 1:
# The Run-In
# IT'S APRIL. ARE WE BOTTLING IT? 🍼
# The PTSD is kicking in, but is this year actually different?
# THE TOUCHLINE DRIBBLE
# 1/7

slides_data = [
    {
        "tag": "THE TOUCHLINE DRIBBLE",
        "title": "IT'S APRIL. ARE WE<br>BOTTLING IT? 🍼",
        "body": "The PTSD is kicking in, but is this year actually different?"
    },
    {
      "tag": "COMFORTABLE LEADS",
      "title": "THE FAMILIAR SCENT<br>OF COLLAPSE",
      "body": "We've been here before. We dominate for 8 months, the weather gets warmer, and suddenly dropping points to mid-table teams becomes a weekly tradition.<br><br>The \"bottling\" allegations are already queued up in everyone's drafts. Can Arteta's men silence the noise?"
    },
    {
      "tag": "MEANWHILE, IN MANCHESTER... 🤖",
      "title": "PEP'S CYBORGS HAVE<br>ACTIVATED THEIR<br>END-OF-SEASON PROTOCOL",
      "body": "The inevitable 15-game winning streak is fully underway.<br><br><b>The Reality Check</b><br>\"City’s upcoming fixtures look like a cakewalk compared to ours. We literally have to be perfect to hold them off.\""
    },
    {
      "tag": "THE ANTIDOTE",
      "title": "WHY WE WON'T<br>CRUMBLE THIS TIME",
      "body": "🧱 <b>Elite Rest-Defense</b><br>No more chaotic transitions. Saliba and Gabriel are locking off counter-attacks entirely.<br><br>🧠 <b>The \"Dark Arts\"</b><br>We finally know how to kill a game. Time wasting, drawing fouls, getting ugly when needed. It's the champion's gene we lacked."
    },
    {
      "tag": "THE GAUNTLET",
      "title": "THE FIXTURES THAT<br>DEFINE US",
      "body": "<b>The North London Derby:</b> Spurs away. The ultimate test of nerve.<br><br><b>Old Trafford:</b> We need a result here. Plain and simple.<br><br><b>The Final Day:</b> Everton at the Emirates. Could it go down to the wire?"
    },
    {
      "tag": "THE VERDICT",
      "title": "THIS SQUAD IS<br>BUILT DIFFERENT",
      "body": "The mental fragility is gone. The naïve football is gone. We have the best defense in the league and a manager who refuses to let standards drop.<br><br>We aren't the hunters anymore. We are the standard."
    },
    {
      "tag": "YOUR TAKE 🎙️",
      "title": "ARE WE GOING<br>ALL THE WAY?",
      "body": "Can Arsenal finally break the drought, or will City's machine roll over us again?<br><br>Drop your predictions below 👇"
    }
]

# We need to manually replace the texts in the HTML file based on the slides it has currently.
# To do that, let's write out the current html to inspect and replace.
with open('temp_carousel_modify.html', 'w', encoding='utf-8') as f:
    f.write(text)
