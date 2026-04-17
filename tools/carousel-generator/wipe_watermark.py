from bs4 import BeautifulSoup

with open('bayern_madrid_carousel.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

slides = soup.find_all('div', class_='slide')

for index in [0, 6]: # Slide 1 and Slide 7
    if index < len(slides):
        # find the div inside the slide that has the watermark text
        for div in slides[index].find_all('div'):
            if div.get_text(strip=True) == '@thetouchlinedribble':
                # double check it has position absolute and top:20px
                if 'top:20px' in div.get('style', ''):
                    div.decompose()
                    print(f"Removed watermark from slide {index + 1}")

with open('bayern_madrid_carousel.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

