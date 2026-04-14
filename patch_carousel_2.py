import re

with open('arsenal_carousel 2_temp.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's clean up Slide 2 (Delete 03 and 04)
# We can find the index and splice
idx1 = text.find('<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.08);">')
if idx1 != -1:
    idx2 = text.find('03</div>', idx1)
    if idx2 != -1:
        # Find the start of this block
        start_03 = text.rfind('<div style="display:flex;align-items:flex-start;', 0, idx2)
        end_04 = text.find('April 22nd. The scar is fresh.</div>', start_03) + len('April 22nd. The scar is fresh.</div>')
        end_04 = text.find('</div>', end_04) + 6
        end_04 = text.find('</div>', end_04) + 6
        end_04 = text.find('</div>', end_04) + 6
        # wait, let me just use regex carefully
        pass
