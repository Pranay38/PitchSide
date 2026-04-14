with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

header = text.split('<!-- ═══════ SLIDE 1')[0]
footer = text.split('<!-- ── PROGRESS BAR ── -->')[1]

with open('arsenal_carousel 2_recovered.html', 'w', encoding='utf-8') as f:
    f.write(header)
    for i in range(1, 8):
        with open(f'slide_{i}_raw.html', 'r', encoding='utf-8') as s:
            f.write("<!-- ═══════ SLIDE " + str(i))
            # wait, my dump script didn't include the '<!-- ═══════ SLIDE X' part
            # It just split by it. So I need to prefix it.
            slide_content = s.read()
            f.write(slide_content)
    f.write('<!-- ── PROGRESS BAR ── -->')
    f.write(footer)

import re

with open('arsenal_carousel 2_recovered.html', 'r', encoding='utf-8') as f:
    orig = f.read()
    orig = orig.replace(
        'family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
        'family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap'
    )
    orig = re.sub(r"font-family:\s*'Newsreader',\s*serif;\s*font-style:\s*italic", "font-family: 'Bebas Neue',sans-serif", orig)

with open('arsenal_carousel 2_recovered.html', 'w', encoding='utf-8') as f:
    f.write(orig)
