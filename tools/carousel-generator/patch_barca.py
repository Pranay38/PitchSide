import re
import os

with open('barca_atletico_carousel.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add logo/branding to each slide if not present
slide_counter = [0]
def inject_branding(match):
    idx = slide_counter[0]
    slide_counter[0] += 1
    
    bg_style = match.group(1)

    # Skip 1st slide (0) and last slide (6)
    if idx == 0 or idx == 6:
        return match.group(0)

    is_light = "ttd-off" in bg_style
    
    color = 'var(--charcoal)' if is_light else '#fff'
    opacity = '0.3' if is_light else '0.4'
    
    branding = f"""
      <div style="position: absolute; top: 28px; left: 32px; right: 32px; display: flex; justify-content: space-between; align-items: center; z-index: 20;">
        <span style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 800; color: {color}; opacity: {opacity}; letter-spacing: 1.5px; text-transform: uppercase;">@thetouchlinedribble</span>
      </div>
"""
    
    # Check if branding is already there
    if "@thetouchlinedribble" not in html[match.end():match.end()+500]:
        return match.group(0) + "\n" + branding
    return match.group(0)

html = re.sub(r'<div class="slide" style="(background:[^"]+);">', inject_branding, html)

# 2. Adjust paddings so content doesn't crop
# Replace padding:24px 24px 60px 30px with padding:60px 32px 60px 32px
html = re.sub(r'padding:\s*24px 24px 60px 30px', 'padding:60px 32px 60px 32px', html)
# Replace padding:18px 24px 60px with padding:60px 32px 60px
html = re.sub(r'padding:\s*18px 24px 60px;', 'padding:60px 32px 60px 32px;', html)
# Replace padding:18px 14px 60px with padding:60px 24px 60px 24px
html = re.sub(r'padding:\s*18px 14px 60px;', 'padding:60px 24px 60px 24px;', html)
# General padding starting with 18, 20, 24 followed by other params
html = re.sub(r'flex:1;display:flex;flex-direction:column;padding:\s*[0-9]+px\s+[0-9]+px\s+60px(\s+[0-9]+px)?;', 'flex:1;display:flex;flex-direction:column;padding:60px 32px 60px 32px;', html)

# 3. Adjust font sizes globally to prevent cropping
html = html.replace('font-size:56px', 'font-size:44px')
html = html.replace('font-size:54px', 'font-size:42px')
html = html.replace('font-size:46px', 'font-size:38px')
html = html.replace('font-size:18px', 'font-size:15px')
html = html.replace('font-size:20px', 'font-size:16px')
html = html.replace('font-size:13px', 'font-size:12px')
# The background huge numbers
html = html.replace('font-size:210px', 'font-size:150px')
html = html.replace('font-size:200px', 'font-size:140px')
html = html.replace('font-size:180px', 'font-size:130px')

with open('barca_atletico_carousel_fixed.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Patch applied to barca_atletico_carousel_fixed.html")
