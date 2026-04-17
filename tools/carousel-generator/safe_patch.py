with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Clean out the 03, 04, Saka, Gyokeres, L-block, MAY 3, MAY 24 blocks.
# I will use exact string segments taken directly from the slides.
import re

# We can safely use regex if we don't use greedy *. We can use non-greedy and make sure we stop at the FIRST </div></div></div> etc.
# Slide 2: 03 and 04
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba\(0,0,0,0\.08\);">\s*<div[^>]*>03</div>.*?April 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;">\s*<div[^>]*>04</div>.*?March 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)

# Slide 3: Saka and Gyokeres 
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\s*<div[^>]*>⚡</div>.*?Gyökeres doing Gyökeres things\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\s*<div[^>]*>🎯</div>.*?Gyökeres doing Gyökeres things\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL) # wait, slide 3 had 4 items, let me check. Yes, Saka and Viktor. Wait, I fixed Viktor earlier.

# Slide 4: L block
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">\s*<div[^>]*>L</div>.*?City still breathing\. Every remaining game a cup final\.</div>\s*</div>', '', text, flags=re.DOTALL)

# Slide 5: Table
table_pattern = r'<div style="background:rgba\(255,255,255,0\.03\);border:1px solid rgba\(255,255,255,0\.1\);border-radius:12px;padding:16px;margin-bottom:16px;">.*?If both teams win ALL remaining games, the title comes down to goal difference\. Arsenal currently lead that too \(\+32 vs \+28\)\.</div>'
new_content_s5 = r'''<div style="font-size:16px;color:#fff;line-height:1.6;font-family:'Outfit', sans-serif;">
The mental fragility is gone. The naïve football is gone. We have the best defense in the league and a manager who refuses to let standards drop.<br><br>
We aren't the hunters anymore. We are the standard.
</div>'''
text = re.sub(table_pattern, new_content_s5, text, flags=re.DOTALL)

# Slide 6: MAY 3 and MAY 24. These have EXACTLY 1 closing div for the end, not 3.
# Let's just use exact text from my dump
s6_may3 = '''<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:13px;color:var(--green);min-width:70px;letter-spacing:0.5px;">MAY 3</div>
          <div style="font-size:13px;font-weight:600;color:#fff;font-family:'Outfit',sans-serif;flex:1;">@ Fulham <span style="font-size:10px;color:#555;font-weight:400;">(sneaky dangerous)</span></div>
          <div style="font-size:10px;color:#555;background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:4px;">A</div>
        </div>'''
s6_may24 = '''<div style="display:flex;align-items:center;gap:0;padding:10px 0;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:13px;color:var(--green);min-width:70px;letter-spacing:0.5px;">MAY 24</div>
          <div style="font-size:13px;font-weight:600;color:#fff;font-family:'Outfit',sans-serif;flex:1;">Final Day 🤞 <span style="font-size:10px;color:#555;font-weight:400;">(all 10 simultaneous)</span></div>
          <div style="font-size:10px;color:#555;background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:4px;">?</div>
        </div>'''
text = text.replace(s6_may3, '')
text = text.replace(s6_may24, '')


# 2. APPLY THE FONT UPDATES
text = text.replace(
    'family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap',
    'family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap'
)
text = re.sub(
    r"font-family:\s*'Bebas Neue',\s*(?:sans-serif|cursive)",
    r"font-family: 'Newsreader', serif; font-style: italic",
    text
)
text = re.sub(
    r"font-family:\s*'Barlow Condensed',\s*sans-serif",
    r"font-family: 'Outfit', sans-serif",
    text
)

# 3. APPLY THE TEXT CONTENT UPDATES
text = text.replace(
    'ARE<br/>\n        <span style="color:var(--green);">ARSENAL</span><br/>\n        ACTUALLY<br/>\n        DOING IT?',
    "IT'S APRIL.<br/>\n        <span style=\"color:var(--green);\">ARE WE</span><br/>\n        BOTTLING<br/>\n        IT? 🍼"
)
text = text.replace(
    'Six points clear. Five games left. One city to visit. The Gunners have been here before — but this time feels different. Doesn\'t it?',
    'The PTSD is kicking in, but is this year actually different?'
)
text = text.replace('>2025/26<', '>THE RUN-IN<')

text = text.replace('>The fear is real<', '>COMFORTABLE LEADS<')
text = text.replace(
    'THREE<br/>TIMES THE<br/><span style="color:var(--green);">RUNNER-UP 💔</span>',
    'THE FAMILIAR<br/>SCENT OF<br/><span style="color:var(--green);">COLLAPSE 📉</span>'
)
text = text.replace('22/23, 23/24, 24/25 — all 2nd', "We've been here before.")
text = text.replace('Always the bridesmaid. Never the bride.', "We dominate for 8 months, the weather gets warmer, and dropping points to mid-table teams becomes a weekly tradition.")
text = text.replace('Lost 2-1 at home to Bournemouth', "The \"bottling\" allegations")
text = text.replace('April 12th. Classic Arsenal brain glitch.', "Are already queued up in everyone's drafts. Can Arteta's men silence the noise?")

text = text.replace(">But here's the thing<", ">MEANWHILE...<")
text = text.replace(
    'THIS SQUAD<br/>IS BUILT<br/>DIFFERENT 🧱',
    "PEP'S CYBORGS<br/>HAVE ACTIVATED<br/>THEIR PROTOCOL 🤖"
)
text = text.replace('>Raya<', '>The Streak<')
text = text.replace('Golden Glove leader. Wall mode.', 'The inevitable 15-game winning streak is fully underway.')
text = text.replace('>Rice<', '>Reality Check<')
text = text.replace('Engine room. Relentless every game.', '"City’s upcoming fixtures look like a cakewalk compared to ours. We literally have to be perfect to hold them off."')

text = text.replace('>APRIL 19 — THE ETIHAD<', '>THE ANTIDOTE<')
text = text.replace('>SEASON DECIDER<', '>WHY WE WON\'T<')
text = text.replace('MAN CITY<br/>VS ARSENAL', 'CRUMBLE<br/>THIS TIME 😤')
text = text.replace('What each result means for the title race:', 'Two core reasons why we are different this year:')
text = text.replace('>W<', '>🧱<')
text = text.replace('Arsenal win → 9 points clear 🎉', 'Elite Rest-Defense')
text = text.replace("City's game in hand gone. Book the parade route.", 'No more chaotic transitions. Saliba and Gabriel are locking off counter-attacks entirely.')
text = text.replace('>D<', '>🧠<')
text = text.replace('Draw → 7 points clear 😤', 'The "Dark Arts"')
text = text.replace("GIH gone. Still very much in control.", 'We finally know how to kill a game. Time wasting, drawing fouls, getting ugly when needed.')
text = text.replace("⚠️ Arsenal haven't won at the Etihad since 2015. That's the stat we're all trying to forget.", "It's the champion's gene we lacked.")

text = text.replace('>State of Play<', '>THE VERDICT<')
# Already handled table above.

text = text.replace('>The Run-In<', '>THE GAUNTLET<')
text = text.replace('FIVE GAMES.<br/>ONE DREAM. 🏆', 'THE FIXTURES<br/>THAT DEFINE US ⚔️')
text = text.replace('>APR 15<', '>NLD<')
text = text.replace('vs Sporting CP (UCL QF 2nd leg)', 'Spurs away. The ultimate test of nerve.')
text = text.replace('>APR 19<', '>MAY 10<')
text = text.replace('@ Man City 🔑 (THE one)', '@ Old Trafford. We need a result here. Plain and simple.')
text = text.replace('>APR 26<', '>FINAL DAY<')
text = text.replace('vs Newcastle (no pushovers)', 'Everton at the Emirates. Down to the wire?')

text = text.replace('GUNNERS<br/>OR<br/>BOTTLERS?', 'ARE WE<br/>GOING<br/>ALL THE WAY? 🎙️')
text = text.replace("22 years of hurt. The table says it's ours. Drop your W / D / L prediction for the City game below. 👇", "Can Arsenal finally break the drought, or will City's machine roll over us again?<br><br>Drop your predictions below 👇")

with open('arsenal_carousel 2_final_safe.html', 'w', encoding='utf-8') as f:
    f.write(text)

