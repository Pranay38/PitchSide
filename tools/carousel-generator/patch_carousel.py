import re

with open('bayern_madrid_carousel.html', 'r', encoding='utf-8') as f:
    text = f.read()

# CSS patches
text = text.replace('padding:9px 0;', 'padding:5px 0;')

# Inline style patches for tight layouts
text = text.replace('padding:22px 28px 60px 32px;', 'padding:22px 28px 40px 32px;')
text = text.replace('padding:16px 28px 60px;', 'padding:16px 28px 40px;')
text = text.replace('padding:24px 28px 60px 32px;', 'padding:24px 28px 40px 32px;')
text = text.replace('padding:24px 32px 60px;', 'padding:24px 32px 40px;')
text = text.replace('padding:9px 10px;', 'padding:5px 10px;')
text = text.replace('margin-bottom:14px;', 'margin-bottom:8px;')
text = text.replace('margin-bottom:12px;', 'margin-bottom:6px;')
text = text.replace('font-size:44px;', 'font-size:36px;')
text = text.replace('font-size:42px;', 'font-size:36px;')

# For Slide 3 "THE RED CARD THAT BROKE MADRID'S HEART" maybe font size needs reducing
text = text.replace('font-size:36px;line-height:0.9;', 'font-size:32px;line-height:0.9;')
text = text.replace('font-size:38px;', 'font-size:32px;')

# For list items or rows gaps
text = text.replace('gap:12px;', 'gap:8px;')

with open('bayern_madrid_carousel.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched carousel styling to fit 4:5 aspect ratio.")
