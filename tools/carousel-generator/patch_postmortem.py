import re
import os

with open('barca_postmortem_carousel.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Adjust paddings so we don't compress the content too much but still have safe margins
html = re.sub(r'padding:\s*[0-9]+px\s+[0-9]+px\s+60px\s+[0-9]+px', 'padding:40px 24px 30px 24px', html)
html = re.sub(r'padding:\s*[0-9]+px\s+[0-9]+px\s+60px;', 'padding:40px 24px 30px 24px;', html)
html = re.sub(r'flex:1;display:flex;flex-direction:column;padding:\s*[0-9]+px\s+[0-9]+px\s+60px(\s+[0-9]+px)?;', 'flex:1;display:flex;flex-direction:column;padding:50px 24px 40px 24px;', html)

# Some specific replacements
html = html.replace('margin-bottom:30px', 'margin-bottom:20px')
html = html.replace('margin-bottom:40px', 'margin-bottom:24px')
html = html.replace('margin-bottom:24px', 'margin-bottom:16px')
html = html.replace('margin-bottom:20px', 'margin-bottom:14px')
html = html.replace('margin-bottom:16px', 'margin-bottom:10px')
html = html.replace('margin-bottom:12px', 'margin-bottom:8px')

# Adjust font sizes globally to prevent overflowing inside the 420x525 container
# Using a function to scale down all font-size by ~20-25%
def scale_fonts(match):
    size = int(match.group(1))
    # Background huge numbers
    if size >= 200:
        new_size = int(size * 0.70)
    elif size >= 50:
        new_size = int(size * 0.78)
    elif size >= 30:
        new_size = int(size * 0.8)
    elif size >= 20:
        new_size = int(size * 0.85)
    elif size >= 14:
        new_size = int(size * 0.85)
    else:
        new_size = size # don't scale too small things below 14 extensively
    return f"font-size:{new_size}px"

html = re.sub(r'font-size:\s*([0-9]+)px', scale_fonts, html)

with open('barca_postmortem_carousel_fixed.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Patch applied to barca_postmortem_carousel_fixed.html")
