import re
import shutil

source = 'bayern_madrid_carousel.html'
dest = 'bayern_madrid_carousel_3x4.html'

with open(source, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace heights
# .carousel-viewport{width:420px;height:525px;
# .slide{width:420px;height:525px;
text = text.replace('height:525px;', 'height:560px;')

# For sanity, also reduce padding back if we want, or leave it. Leaving it is fine as it just means more empty space at bottom.
# But 3:4 is MORE vertical space than 4:5. (525 -> 560) so nothing will be cut!

with open(dest, 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Created {dest} with 3:4 aspect ratio (420x560px).")
