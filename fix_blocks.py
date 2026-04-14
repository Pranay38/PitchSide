with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

def delete_between(pattern_start, pattern_end):
    global text
    idx = 0
    while True:
        i1 = text.find(pattern_start, idx)
        if i1 == -1: break
        i2 = text.find(pattern_end, i1)
        if i2 != -1:
            i2 += len(pattern_end)
            text = text[:i1] + text[i2:]
        else:
            idx = i1 + len(pattern_start)

# Slide 2: 01 and 02 are missing their content! Wait, the output had `01 We've been here before.` but not the div!
# Look at Slide 2 in output: "01 We've been here before. We dominate for 8 months... 02 The "bottling" allegations Are already queued up..."
# Oh, it's there. Just 03 and 04 were NOT deleted.
# Let's delete them by finding the actual exact text.
import re
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba\(0,0,0,0\.08\);">\s*<div[^>]+>03</div>.*?April 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;">\s*<div[^>]+>04</div>.*?March 22nd\. The scar is fresh\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)

# Slide 3: Delete Saka and Gyokeres blocks
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\s*<div[^>]+>⚡</div>.*?Gyökeres doing Gyökeres things\.</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)


# Slide 4: Delete L block
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">\s*<div[^>]+>L</div>.*?City still breathing\. Every remaining game a cup final\.</div>\s*</div>', '', text, flags=re.DOTALL)


# Slide 5: Delete Table
table_pattern = r'<div style="background:rgba\(255,255,255,0\.03\);border:1px solid rgba\(255,255,255,0\.1\);border-radius:12px;padding:16px;margin-bottom:16px;">.*?If both teams win ALL remaining games, the title comes down to goal difference\. Arsenal currently lead that too \(\+32 vs \+28\)\.</div>'
new_content_s5 = r'''<div style="font-size:16px;color:#fff;line-height:1.6;font-family:'Outfit', sans-serif;">
The mental fragility is gone. The naïve football is gone. We have the best defense in the league and a manager who refuses to let standards drop.<br><br>
We aren't the hunters anymore. We are the standard.
</div>'''
text = re.sub(table_pattern, new_content_s5, text, flags=re.DOTALL)

# Slide 6
# Wait, the MAY 3 and MAY 24 fixtures are still there.
text = re.sub(r'<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba\(255,255,255,0\.08\);">\s*<div[^>]+>MAY 3</div>.*?\(sneaky dangerous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)

text = re.sub(r'<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba[^>]+>\s*<div[^>]+>MAY 24</div>.*?\(all 10 simultaneous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)


# Slide 7
text = text.replace('GUNNERS<br/>OR<br/>BOTTLERS?', 'ARE WE<br/>GOING<br/>ALL THE WAY? 🎙️')
text = text.replace("22 years of hurt. The table says it's ours. Drop your W / D / L prediction for the City game below. 👇", "Can Arsenal finally break the drought, or will City's machine roll over us again?<br><br>Drop your predictions below 👇")


with open('arsenal_carousel 2.html', 'w', encoding='utf-8') as f:
    f.write(text)
