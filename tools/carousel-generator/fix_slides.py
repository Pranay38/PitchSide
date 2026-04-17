with open('generate_carousel.py', 'r') as f:
    text = f.read()

# Fix Slide 1
slide_1_old = """    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": \"\"\"
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;position:relative;z-index:2;">
              <div class="serif" style="font-size:52px;line-height:0.95;color:var(--charcoal);margin-bottom:20px;text-transform:uppercase;">
                IT'S APRIL.<br/>ARE WE<br/><span style="color:var(--green);font-style:italic;">BOTTLING</span><br/>IT? 🍼
              </div>
              <div class="sans" style="font-size:16px;font-weight:500;color:#555;line-height:1.5;margin-bottom:24px;max-width:85%;">
                The PTSD is kicking in, but is this year actually different? Let's talk about it.
              </div>
            </div>
        \"\"\"
    },"""

slide_1_new = """    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": \"\"\"
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="serif" style="font-size:44px;line-height:1.0;color:var(--charcoal);margin-bottom:24px;text-transform:uppercase;">
                IT'S APRIL.<br/>ARE <span style="color:var(--green);font-style:italic;">ARSENAL</span><br/>BOTTLING<br/>IT? 🍼
              </div>
              <div class="sans" style="font-size:15px;font-weight:500;color:#555;line-height:1.5;margin-bottom:32px;max-width:90%;">
                The PTSD is kicking in, but is this year actually different? Let's talk about it.
              </div>
            </div>
        \"\"\"
    },"""

# Fix Slide 2
slide_2_old = """    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": \"\"\"
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;">
              <h2 class="serif" style="font-size:42px;line-height:1.0;color:#fff;margin-bottom:24px;">
                The Familiar Scent of Collapse 📉
              </h2>
              <div style="display:flex;flex-direction:column;gap:16px;">
                <p class="sans" style="font-size:16px;color:rgba(255,255,255,0.85);line-height:1.6;font-weight:400;">
                  We've been here before. We dominate for 8 months, the weather gets warmer, and suddenly dropping points to mid-table teams becomes a weekly tradition.
                </p>
                <p class="sans" style="font-size:16px;color:rgba(255,255,255,0.85);line-height:1.6;font-weight:400;">
                  The "bottling" allegations are already queued up in everyone's drafts. Can Arteta's men silence the noise?
                </p>
              </div>
            </div>
        \"\"\"
    },"""

slide_2_new = """    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": \"\"\"
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;">
              <h2 class="serif" style="font-size:36px;line-height:1.1;color:#fff;margin-bottom:28px;">
                The Familiar Scent<br/>Of Collapse 📉
              </h2>
              <div style="display:flex;flex-direction:column;gap:18px;">
                <p class="sans" style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;font-weight:400;">
                  We've been here before. We dominate for 8 months, the weather gets warmer, and dropping points to mid-table teams becomes a weekly tradition.
                </p>
                <p class="sans" style="font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;font-weight:400;">
                  The "bottling" allegations are already queued up in everyone's drafts. Can Arteta's men silence the noise?
                </p>
              </div>
            </div>
        \"\"\"
    },"""

text = text.replace(slide_1_old, slide_1_new)
text = text.replace(slide_2_old, slide_2_new)

with open('generate_carousel.py', 'w') as f:
    f.write(text)

