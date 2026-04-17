import re
import os

with open('arsenal_carousel 2_temp.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure we don't accidentally wipe out the </div> tags that close the slide content.
# We just need to wipe the item blocks.
# Let's cleanly replace the text that contains 03 and 04 blocks with empty strings.

s_03 = '''<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);">
          <div style="font-family: 'Newsreader', serif; font-style: italic;font-size:20px;color:#DC2626;min-width:32px;line-height:1.1;">03</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--charcoal);font-family:'Outfit', sans-serif;">Etihad: no win since 2015</div>
            <div style="font-size:11px;color:#6A7A6F;margin-top:2px;">11 years of Etihad pain. And that's next up.</div>
          </div>
        </div>'''

s_04 = '''<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;">
          <div style="font-family: 'Newsreader', serif; font-style: italic;font-size:20px;color:#DC2626;min-width:32px;line-height:1.1;">04</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--charcoal);font-family:'Outfit', sans-serif;">Lost the Carabao Cup final to City</div>
            <div style="font-size:11px;color:#6A7A6F;margin-top:2px;">March 22nd. The scar is fresh.</div>
          </div>
        </div>'''

# wait, we must handle whitespace differences. Regex is better.
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba\(0,0,0,0\.08\);">\s*<div.*?03</div>.*?Etihad pain.*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;">\s*<div.*?04</div>.*?scar is fresh.*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)

# Slide 3: Saka and Gyokeres 
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\s*<div.*?⚡</div>.*?Defenders are scared.*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\s*<div.*?🎯</div>.*?Gyökeres things.*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)

# Slide 4: L block & Stat text
text = re.sub(r'<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">\s*<div.*?L</div>.*?City still breathing.*?</div>\s*</div>', '', text, flags=re.DOTALL)

# Slide 5 table
table_pattern = r'<div style="background:rgba\(255,255,255,0\.03\);border:1px solid rgba\(255,255,255,0\.1\);border-radius:12px;padding:16px;margin-bottom:16px;">.*?If both teams win ALL remaining games, the title comes down to goal difference.*?</div>'
new_content_s5 = r'''<div style="font-size:16px;color:#fff;line-height:1.6;font-family:'Outfit', sans-serif;">
        The mental fragility is gone. The naïve football is gone. We have the best defense in the league and a manager who refuses to let standards drop.<br><br>
        We aren't the hunters anymore. We are the standard.
      </div>'''
text = re.sub(table_pattern, new_content_s5, text, flags=re.DOTALL)

# Slide 6 fixture deletions. 
# Keep NLD, Man Utd, Final Day. Delete Newcastle, Fulham, etc.
# Wait, MAY 3 is Fulham. 
text = re.sub(r'<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba\(255,255,255,0\.08\);">\s*<div.*?MAY 3</div>.*?\(sneaky dangerous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)
# And the old Final Day MAY 24 (all 10 simultaneous) was there originally
text = re.sub(r'<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba.*?MAY 24</div>.*?\(all 10 simultaneous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL)


with open('arsenal_carousel 2_final.html', 'w', encoding='utf-8') as f:
    f.write(text)
