with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

slides = text.split('<!-- ═══════ SLIDE')
for i, s in enumerate(slides[1:]):
    with open(f'slide_{i+1}_raw.html', 'w', encoding='utf-8') as out:
        out.write(s)
