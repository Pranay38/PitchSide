import re

with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# FONT EDITS
text = text.replace(
    'family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap',
    'family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap'
)

text = re.sub(
    r"font-family:\s*'Bebas Neue',\s*(?:sans-serif|cursive)",
    r"font-family: 'Newsreader', serif; font-style: italic; text-transform: none",
    text
)

# Replace 'Barlow Condensed' with 'Outfit' if it was there
text = re.sub(
    r"font-family:\s*'Barlow Condensed',\s*sans-serif",
    r"font-family: 'Outfit', sans-serif",
    text
)


# ==========================================
# SLIDE 1
# ==========================================
text = re.sub(
    r'ARE<br/>\s*<span style="color:var\(--green\);">ARSENAL</span><br/>\s*ACTUALLY<br/>\s*DOING IT\?',
    r"IT'S APRIL.<br/>\n        <span style=\"color:var(--green);\">ARE WE</span><br/>\n        BOTTLING<br/>\n        IT? 🍼",
    text
)

text = text.replace(
    'Six points clear. Five games left. One city to visit. The Gunners have been here before — but this time feels different. Doesn\'t it?',
    'The PTSD is kicking in, but is this year actually different?'
)

text = text.replace('>2025/26<', '>THE RUN-IN<')
# Wait, let's keep The Touchline Dribble intact.


# ==========================================
# SLIDE 2
# ==========================================
text = text.replace('>The fear is real<', '>COMFORTABLE LEADS<')
text = re.sub(
    r'THREE<br/>TIMES THE<br/><span style="color:var\(--green\);">RUNNER-UP 💔</span>',
    r'THE<br/>FAMILIAR SCENT<br/><span style=\"color:var(--green);\">OF COLLAPSE 📉</span>',
    text
)
# List Item 1
text = text.replace('22/23, 23/24, 24/25 — all 2nd', "We've been here before.")
text = text.replace('Always the bridesmaid. Never the bride.', "We dominate for 8 months, the weather gets warmer, and dropping points to mid-table teams becomes tradition.")

# List Item 2
text = text.replace('Lost 2-1 at home to Bournemouth', "The \"bottling\" allegations")
text = text.replace('April 12th. Classic Arsenal brain glitch.', "Are already queued up in everyone's drafts.")

# Delete Item 3 and 4 safely
# First, find where 03 starts
text = re.sub(
    r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba\(0,0,0,0\.08\);">\s*<div style="font-family: \'Newsreader\'[^>]+>03</div>.*?April 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>\s*</div>',
    '', text, flags=re.DOTALL
)
# Wait, changing font-family before regex might break this if I'm not careful. I'll just use a non-greedy wildcard from item 03 till the end of the div.

with open('arsenal_carousel 2_temp.html', 'w', encoding='utf-8') as f:
    f.write(text)
