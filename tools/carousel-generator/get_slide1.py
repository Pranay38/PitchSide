import re

with open('bayern_madrid_carousel.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'data:image.*?(?=\")', '', text)

from bs4 import BeautifulSoup
soup = BeautifulSoup(text, 'html.parser')
slides = soup.find_all('div', class_=re.compile(r'slide'))

print(slides[0].prettify())

