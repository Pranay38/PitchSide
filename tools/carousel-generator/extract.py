import re

with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

slides = text.split('<!-- ═══════ SLIDE')
for i, s in enumerate(slides[1:]):
    print(f'\n\n=== SLIDE {i+1} ===')
    # Print the specific lines containing text
    lines = s.split('\n')
    for line in lines:
        if bool(re.search(r'>[^<]+<', line)):
            clean = re.sub(r'<[^>]+>', '', line).strip()
            if clean:
                print(clean)
