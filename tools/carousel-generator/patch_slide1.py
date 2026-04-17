with open('bayern_madrid_carousel.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Shrink the massive headlines in Slide 1
text = text.replace("font-size:54px;line-height:0.88;color:#fff;margin-bottom:10px;", "font-size:44px;line-height:0.88;color:#fff;margin-bottom:6px;")
text = text.replace("margin-bottom:16px;", "margin-bottom:12px;")
text = text.replace("padding:10px 14px;", "padding:8px 12px;")
text = text.replace("margin-bottom:8px;", "margin-bottom:6px;")

with open('bayern_madrid_carousel.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Patched Slide 1 for scaling!")
