with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Exact string matches
# Slide 3: Saka and Gyokeres 
s_saka = '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\n          <div style="font-size:22px;line-height:1;">⚡</div>\n          <div>\n            <div style="font-size:13px;font-weight:700;color:var(--charcoal);margin-bottom:2px;font-family:\'Outfit\', sans-serif;">Saka</div>\n            <div style="font-size:11px;color:#555;">Back in form. Defenders are scared.</div>\n          </div>\n        </div>'
s_gyokeres = '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">\n          <div style="font-size:22px;line-height:1;">🎯</div>\n          <div>\n            <div style="font-size:13px;font-weight:700;color:var(--charcoal);margin-bottom:2px;font-family:\'Outfit\', sans-serif;">Viktor</div>\n            <div style="font-size:11px;color:#555;">Gyökeres doing Gyökeres things.</div>\n          </div>\n        </div>'
text = text.replace(s_saka, '')
text = text.replace(s_gyokeres, '')

# Slide 4: L block and stat
s_l_block = '''<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">\n        <div style="font-family: 'Newsreader', serif; font-style: italic;font-size:20px;color:#DC2626;min-width:32px;line-height:1.1;">L</div>\n        <div>\n          <div style="font-size:13px;font-weight:700;color:var(--charcoal);font-family:'Outfit', sans-serif;">Arsenal lose → 3 points clear 😬</div>\n          <div style="font-size:11px;color:#6A7A6F;margin-top:2px;">City still breathing. Every remaining game a cup final.</div>\n        </div>\n      </div>'''
text = text.replace(s_l_block, '')

# Slide 5 table
# Wait, I already replaced the table in slide_replacer! 
# Let's check slide 5 output: THE NUMBERS DON'T LIE
text = text.replace("THE NUMBERS<br/>DON'T LIE 📊", "THIS SQUAD IS<br/>BUILT DIFFERENT 🏆")
# Just find the string '<div style="background:rgba(255,255,255,0.03);' and delete till '</div>\n    </div>\n\n    <div class="prog">'
start_idx = text.find('<div style="background:rgba(255,255,255,0.03);', text.find('THIS SQUAD IS'))
if start_idx != -1:
    end_idx = text.find('If both teams win ALL remaining games', start_idx)
    end_idx = text.find('</div>', end_idx) + 6
    new_content_s5 = '''<div style="font-size:16px;color:#fff;line-height:1.6;font-family:'Outfit', sans-serif;">
The mental fragility is gone. The naïve football is gone. We have the best defense in the league and a manager who refuses to let standards drop.<br><br>
We aren't the hunters anymore. We are the standard.
</div>'''
    text = text[:start_idx] + new_content_s5 + text[end_idx:]

# Slide 6
text = text.replace('vs Sporting CP (UCL QF 2nd leg)', 'Spurs away. The ultimate test of nerve.')
text = text.replace('@ Man City 🔑 (THE one)', '@ Old Trafford. We need a result here. Plain and simple.')
text = text.replace('vs Newcastle (no pushovers)', 'Everton at the Emirates. Down to the wire?')

# Slide 7
text = text.replace('GUNNERS<br/>OR<br/>BOTTLERS?', 'ARE WE<br/>GOING<br/>ALL THE WAY? 🎙️')
text = text.replace("22 years of hurt. The table says it's ours. Drop your W / D / L prediction for the City game below. 👇", "Can Arsenal finally break the drought, or will City's machine roll over us again?<br><br>Drop your predictions below 👇")

# List Item 01 / 02 issues 
# Wait, list item 1 and 2 text replacement failed in previous step.
text = text.replace('22/23, 23/24, 24/25 — all 2nd', "We've been here before.")
text = text.replace('Always the bridesmaid. Never the bride.', "We dominate for 8 months, the weather gets warmer, and dropping points to mid-table teams becomes a weekly tradition.")
text = text.replace('Lost 2-1 at home to Bournemouth', "The \"bottling\" allegations")
text = text.replace('April 12th. Classic Arsenal brain glitch.', "Are already queued up in everyone's drafts. Can Arteta's men silence the noise?")

# 03 04 blocks
i_03 = text.find('<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);">\n          <div style="font-family: \'Newsreader\', serif; font-style: italic;font-size:20px;color:#DC2626;min-width:32px;line-height:1.1;">03</div>')
if i_03 != -1:
    i_end = text.find('March 22nd. The scar is fresh.</div>\n          </div>\n        </div>', i_03) + 70
    text = text[:i_03] + text[i_end:]

with open('arsenal_carousel 2.html', 'w', encoding='utf-8') as f:
    f.write(text)
