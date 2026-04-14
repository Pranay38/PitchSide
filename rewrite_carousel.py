import re

with open('generate_carousel.py', 'r') as f:
    orig = f.read()

# Replace the slides_data and generative functions
new_helpers = '''def generate_branding(is_light):
    color = 'var(--charcoal)' if is_light else '#fff'
    opacity = '0.3' if is_light else '0.4'
    return f"""
      <div style="position: absolute; top: 28px; left: 32px; right: 32px; display: flex; justify-content: space-between; align-items: center; z-index: 20;">
        <span class="sans" style="font-size: 10px; font-weight: 800; color: {color}; opacity: {opacity}; letter-spacing: 1.5px; text-transform: uppercase;">@thetouchlinedribble</span>
      </div>
"""

def generate_progress_bar(index, total, is_light):
    pct = ((index + 1) / total) * 100
    track_color = 'rgba(0,0,0,0.06)' if is_light else 'rgba(255,255,255,0.08)'
    fill_color = 'var(--green)' if is_light else 'var(--green)'
    label_color = 'var(--charcoal)' if is_light else '#fff'
    return f"""
      <div class="prog">
        <div class="prog-track" style="background: {track_color};">
          <div class="prog-fill" style="width: {pct}%; background: {fill_color};"></div>
        </div>
        <span class="prog-num" style="color: {label_color}; opacity: 0.5;">{index+1}/{total}</span>
      </div>
"""

def generate_arrow(is_light, is_last):
    if is_last:
        return ""
    stroke = 'rgba(0,0,0,0.15)' if is_light else 'rgba(255,255,255,0.2)'
    return f"""
      <div class="arrow">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
"""

slides_data = [
    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;position:relative;z-index:2;">
              <div class="serif" style="font-size:52px;line-height:0.95;color:var(--charcoal);margin-bottom:20px;text-transform:uppercase;">
                IT'S APRIL.<br/>ARE WE<br/><span style="color:var(--green);font-style:italic;">BOTTLING</span><br/>IT? 🍼
              </div>
              <div class="sans" style="font-size:16px;font-weight:500;color:#555;line-height:1.5;margin-bottom:24px;max-width:85%;">
                The PTSD is kicking in, but is this year actually different? Let's talk about it.
              </div>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
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
        """
    },
    {
        "bg": "linear-gradient(165deg, var(--green-dark) 0%, var(--green) 100%)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;">
              <h2 class="serif" style="font-size:40px;line-height:1.0;color:#fff;margin-bottom:20px;">
                Meanwhile, in Manchester...
              </h2>
              
              <p class="sans" style="font-size:18px;color:rgba(255,255,255,0.9);line-height:1.55;font-weight:600;margin-bottom:32px;">
                Pep’s cyborgs have activated their end-of-season protocol. 🤖
              </p>
              
              <p class="sans" style="font-size:16px;color:rgba(255,255,255,0.8);line-height:1.5;font-weight:400;margin-bottom:24px;">
                The inevitable 15-game winning streak is fully underway.
              </p>
              
              <div style="border-left: 3px solid #fff; padding-left: 16px; margin-top: auto; margin-bottom: 20px;">
                <div style="font-family:'Newsreader',serif;font-style:italic;font-size:22px;line-height:1.3;color:#fff;">
                  "City’s upcoming fixtures look like a cakewalk compared to ours. We literally have to be perfect."
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;">
              <h2 class="serif" style="font-size:40px;line-height:1.0;color:var(--charcoal);margin-bottom:32px;">
                Why We Won't Crumble
              </h2>
              
              <div style="display:flex;flex-direction:column;gap:28px;">
                <div>
                  <div class="sans" style="font-size:18px;font-weight:800;color:var(--green);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">🧱 Elite Rest-Defense</div>
                  <div class="sans" style="font-size:15px;color:#444;line-height:1.5;">No more chaotic transitions. Saliba and Gabriel are locking off counter-attacks entirely.</div>
                </div>
                
                <div>
                  <div class="sans" style="font-size:18px;font-weight:800;color:var(--green);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">🧠 The "Dark Arts"</div>
                  <div class="sans" style="font-size:15px;color:#444;line-height:1.5;">We finally know how to kill a game. Time wasting, drawing fouls, grinding out ugly 1-0s.</div>
                </div>
                
                <div>
                  <div class="sans" style="font-size:18px;font-weight:800;color:var(--green);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">🔋 Declan Rice's Lungs</div>
                  <div class="sans" style="font-size:15px;color:#444;line-height:1.5;">Having a midfield enforcer who simply doesn't run out of stamina in April is a cheat code.</div>
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;">
              <h2 class="serif" style="font-size:40px;line-height:1.0;color:#fff;margin-bottom:16px;">
                The Gauntlet:<br/><span style="color:var(--green);font-style:italic;">Us vs Them</span>
              </h2>
              
              <p class="sans" style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.5;margin-bottom:40px;">
                It's not just about us. It's about surviving the schedule while praying for a City slip-up.
              </p>
              
              <div style="margin-bottom: 32px;">
                <div class="sans" style="font-size:12px;font-weight:700;color:var(--green-light);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Arsenal's Nightmare Run</div>
                <div class="serif" style="font-size:24px;color:#fff;line-height:1.2;">Massive away days against fierce rivals fighting for Europe.</div>
                <div class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px;">The margin for error is absolute zero.</div>
              </div>
              
              <div>
                <div class="sans" style="font-size:12px;font-weight:700;color:#60A5FA;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">City's "Tough" Games</div>
                <div class="serif" style="font-size:24px;color:#fff;line-height:1.2;">Mostly bottom-half teams with nothing to play for.</div>
                <div class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px;">Already on the beach. Classic.</div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:80px 32px 60px;">
              <div class="serif" style="font-size:38px;line-height:1;color:var(--charcoal);margin-bottom:32px;">
                How To Survive April<br/><span style="color:var(--green);font-style:italic;">(For Fans)</span>
              </div>
              
              <div style="display:flex;flex-direction:column;gap:24px;">
                <div>
                  <div class="sans" style="font-size:18px;font-weight:800;color:var(--charcoal);text-transform:uppercase;margin-bottom:4px;">01. Ignore City's Score</div>
                  <div class="sans" style="font-size:15px;color:#555;line-height:1.5;">
                    It will only cause you pain. Assume De Bruyne assisted Haaland in the 8th minute.
                  </div>
                </div>
                
                <div>
                  <div class="sans" style="font-size:18px;font-weight:800;color:var(--charcoal);text-transform:uppercase;margin-bottom:4px;">02. Embrace the Sh*thouse</div>
                  <div class="sans" style="font-size:15px;color:#555;line-height:1.5;">
                    We don't need "Wengerball". We need Ben White winding up goalkeepers for 90 minutes.
                  </div>
                </div>
                
                <div>
                  <div class="sans" style="font-size:18px;font-weight:800;color:var(--charcoal);text-transform:uppercase;margin-bottom:4px;">03. Back The Boys</div>
                  <div class="sans" style="font-size:15px;color:#555;line-height:1.5;">
                    The Emirates atmosphere has to be flawless. No groaning when a pass goes backward.
                  </div>
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:32px 32px 60px;position:relative;">
              <h2 class="serif" style="font-size:52px;line-height:1.0;color:#fff;margin-bottom:20px;">
                BE HONEST...
              </h2>
              
              <p class="sans" style="font-size:18px;color:rgba(255,255,255,0.6);line-height:1.4;margin-bottom:40px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                Are we lifting the trophy,<br/>or destined for failure?
              </p>
              
              <div class="sans" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;background:var(--green);color:#fff;font-weight:800;font-size:14px;letter-spacing:1.5px;border-radius:32px;text-transform:uppercase;">
                Drop your hot take 👇
              </div>
            </div>
        """
    }
]

for i, slide in enumerate(slides_data):
    html_template += f"""
      <div class="slide" style="background: {slide['bg']};">
        {generate_branding(slide['is_light'])}
        {slide['content']}
        {generate_progress_bar(i, len(slides_data), slide['is_light'])}
        {generate_arrow(slide['is_light'], i == len(slides_data) - 1)}
      </div>
"""
'''
start_idx = orig.find('def generate_progress_bar')
end_idx = orig.find('html_template += """\n    </div>\n  </div>')

new_file = orig[:start_idx] + new_helpers + orig[end_idx:]

with open('generate_carousel.py', 'w') as f:
    f.write(new_file)
