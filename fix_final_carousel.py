with open('arsenal_carousel 2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Slide 1 fix text and font size.
old_s1 = '''<div style="font-family: 'Newsreader', serif; font-style: italic;font-size:56px;line-height:0.9;color:var(--charcoal);margin-bottom:20px;text-transform:uppercase;">
          IT'S APRIL.<br/>
        <span style="color:var(--green);">ARE WE</span><br/>
        BOTTLING<br/>
        IT? 🍼
        </div>'''

new_s1 = '''<div style="font-family: 'Newsreader', serif; font-style: italic;font-size:44px;line-height:1.0;color:var(--charcoal);margin-bottom:20px;text-transform:uppercase;">
          IT'S APRIL.<br/>
        <span style="color:var(--green);">ARE ARSENAL</span><br/>
        BOTTLING<br/>
        IT? 🍼
        </div>'''

text = text.replace(old_s1, new_s1)

# Let's also check if there's an alternative format of Slide 1 from the clean up script.
old_s1_alt = 'font-size:56px;line-height:0.9;color:var(--charcoal);margin-bottom:20px;text-transform:uppercase;"'
if "ARE WE" in text:
    text = text.replace("ARE WE", "ARE ARSENAL")
    text = text.replace("font-size:56px", "font-size:46px")

# 2. Slide 2 fix font size.
old_s2 = '''<h2 style="font-family: 'Newsreader', serif; font-style: italic;font-size:46px;line-height:1.0;color:#fff;margin-bottom:28px;">
          THE FAMILIAR<br/>SCENT OF<br/><span style="color:var(--green);">COLLAPSE 📉</span>
        </h2>'''

new_s2 = '''<h2 style="font-family: 'Newsreader', serif; font-style: italic;font-size:40px;line-height:1.0;color:#fff;margin-bottom:28px;">
          THE FAMILIAR<br/>SCENT OF<br/><span style="color:var(--green);">COLLAPSE 📉</span>
        </h2>'''
text = text.replace(old_s2, new_s2)

if "font-size:46px" in text and "FAMILIAR" in text:
    # Just generic replace for Slide 2 font size if the exact block failed
    text = text.replace("font-size:46px;line-height:1.0;color:#fff;margin-bottom:28px;", "font-size:40px;line-height:1.0;color:#fff;margin-bottom:28px;")


with open('arsenal_carousel 2_fixed.html', 'w', encoding='utf-8') as f:
    f.write(text)

