import re

for i in range(1, 8):
    with open(f'slide_{i}_raw.html', 'r', encoding='utf-8') as f:
        text = f.read()
    
    print(f'\n--- Slide {i} ---')
    lines = text.split('\n')
    for line in lines:
        c = re.sub(r'<[^>]+>', '', line).strip()
        if c:
            print(c)
