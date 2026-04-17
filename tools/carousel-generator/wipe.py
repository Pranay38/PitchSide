with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's hunt down the exact blocks using string slice.
def delete_block(start_str, end_str):
    global text
    i1 = text.find(start_str)
    if i1 != -1:
        i2 = text.find(end_str, i1)
        if i2 != -1:
            text = text[:i1] + text[i2 + len(end_str):]

# Slide 3 Saka
delete_block('<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">', 'GYÖKERES THINGS.</div>\n          </div>\n        </div>') # wait, text changed to Gyokeres doing Gyokeres things.

import re
# Let's just use re.sub with VERY loose matching!
text = re.sub(r'<div[^>]*>\s*<div[^>]*>03</div>.*?April 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)
text = re.sub(r'<div[^>]*>\s*<div[^>]*>04</div>.*?March 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)

text = re.sub(r'<div[^>]*>\s*<div[^>]*>⚡</div>.*?Gyökeres doing Gyökeres things\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)

text = re.sub(r'<div[^>]*>\s*<div[^>]*>L</div>.*?City still breathing\. Every remaining game a cup final\.</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)

text = re.sub(r'<div style="background:rgba\(255,255,255,0\.03\);.*?If both teams win ALL remaining games, the title comes down to goal difference\. Arsenal currently lead that too \(\+32 vs \+28\)\.</div>', 
'''<div style="font-size:16px;color:#fff;line-height:1.6;font-family:'Outfit', sans-serif;">
The mental fragility is gone. The naïve football is gone. We have the best defense in the league and a manager who refuses to let standards drop.<br><br>
We aren't the hunters anymore. We are the standard.
</div>''', text, flags=re.DOTALL|re.IGNORECASE)

text = re.sub(r'<div[^>]*>\s*<div[^>]*>MAY 3</div>.*?\(sneaky dangerous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)
text = re.sub(r'<div[^>]*>\s*<div[^>]*>MAY 24</div>.*?\(all 10 simultaneous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)

# Fixtures from original slide 6 (which I mapped to Slide 5 new text)
# Wait, "The Run-In FIVE GAMES. ONE DREAM." was replaced with "THE GAUNTLET THE FIXTURES THAT DEFINE US"
text = text.replace('FIVE GAMES.<br/>ONE DREAM.', 'THE FIXTURES<br/>THAT DEFINE US')
text = text.replace('>The Run-In<', '>THE GAUNTLET<')
text = text.replace('>APR 15<', '>NLD<')
text = text.replace('vs Sporting CP (UCL QF 2nd leg)', 'Spurs away. The ultimate test of nerve.')
text = text.replace('>APR 19<', '>MAY 10<')
text = text.replace('@ Man City 🔑 (THE one)', '@ Old Trafford. We need a result here. Plain and simple.')
text = text.replace('>APR 26<', '>FINAL DAY<')
text = text.replace('vs Newcastle (no pushovers)', 'Everton at the Emirates. Down to the wire?')

# Slide 7
text = text.replace('GUNNERS<br/>OR<br/>BOTTLERS?', 'ARE WE<br/>GOING<br/>ALL THE WAY? 🎙️')
text = text.replace("22 years of hurt. The table says it's ours. Drop your W / D / L prediction for the City game below. 👇", "Can Arsenal finally break the drought, or will City's machine roll over us again?<br><br>Drop your predictions below 👇")


with open('arsenal_carousel 2_wiped.html', 'w', encoding='utf-8') as f:
    f.write(text)

