with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Wait, `arsenal_carousel 2.html` currently is the modified version. We need to grab its header up to slide 1.
# What does the header end with? Let's assume right before '<!-- ═══════ SLIDE 1 — HERO ═══════ -->' or similar.
# Wait, I don't know the exact string because `text.split` might fail.
# Slide 1 raw starts with ' 1 — HERO ═══════ -->\n  <!-- Dark pitch-green with big type -->'
# because my dump script split by '<!-- ═══════ SLIDE'

# I can just use my `generate_carousel.py`'s `html_template` to reconstruct the header, but wait, `generate_carousel.py` has the template!
# No, let's just use `arsenal_carousel 2.html` header. We can find `<div class="carousel-track" id="track">`
idx = text.find('id="track">')
header = text[:idx + len('id="track">')] + '\n\n'

with open('arsenal_carousel 2_recovered.html', 'w', encoding='utf-8') as f:
    f.write(header)
    for i in range(1, 8):
        with open(f'slide_{i}_raw.html', 'r', encoding='utf-8') as s:
            f.write("  <!-- ═══════ SLIDE")
            f.write(s.read())

import re
with open('arsenal_carousel 2_recovered.html', 'r', encoding='utf-8') as f:
    orig = f.read()
    orig = orig.replace(
        'family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
        'family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap'
    )
    orig = re.sub(r"font-family:\s*'Newsreader',\s*serif;\s*font-style:\s*italic", "font-family: 'Bebas Neue',sans-serif", orig)

with open('arsenal_carousel 2.html', 'w', encoding='utf-8') as f:
    f.write(orig)

