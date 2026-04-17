with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any occurrence of font-size:58px to 46px
text = text.replace('font-size:58px', 'font-size:46px')
text = text.replace('font-size:56px', 'font-size:46px')

with open('arsenal_carousel 2_final_final.html', 'w', encoding='utf-8') as f:
    f.write(text)
