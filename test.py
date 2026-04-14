with open('slide_6_raw.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
c1 = text.count('<div')
c2 = text.count('</div>')
print("Original:", c1, c2)

# My regex logic
t2 = re.sub(r'<div[^>]*>\s*<div[^>]*>MAY 3</div>.*?\(sneaky dangerous\).*?</div>\s*</div>\s*</div>', '', text, flags=re.DOTALL|re.IGNORECASE)
print("After MAY 3:", t2.count('<div'), t2.count('</div>'))

t3 = re.sub(r'<div[^>]*>\s*<div[^>]*>MAY 24</div>.*?\(all 10 simultaneous\).*?</div>\s*</div>\s*</div>', '', t2, flags=re.DOTALL|re.IGNORECASE)
print("After MAY 24:", t3.count('<div'), t3.count('</div>'))
