import re

with open('bayern_madrid_carousel.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove base64 strings to make it printable
text_no_b64 = re.sub(r'data:image/[^;]+;base64,[^"]+', 'b64_REMOVED', text)

print("FILE LENGTH:", len(text_no_b64))

# print CSS
css = re.search(r'<style>(.*?)</style>', text_no_b64, re.DOTALL)
if css:
    print("CSS:")
    css_text = css.group(1)
    for line in css_text.splitlines():
        if "font-size" in line or "padding" in line or "margin" in line or "height" in line or "width" in line or "transform" in line:
            print(line.strip())

# Print out structure with classes
html_struct = re.sub(r'<svg.*?</svg>', '<svg>...</svg>', text_no_b64, flags=re.DOTALL)
from bs4 import BeautifulSoup
soup = BeautifulSoup(html_struct, 'html.parser')
for slide in soup.find_all(class_='slide-container'):
    print("\n--- SLIDE ---")
    for child in slide.children:
        if child.name:
            print(child.name, child.get('class'))
