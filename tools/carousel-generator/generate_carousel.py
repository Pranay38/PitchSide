import base64
from pathlib import Path

# Provide a small dummy transparent base64 for the avatar
avatar_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The Touchline Dribble — Arsenal Carousel</title>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

:root {{
  --green:       #16A34A;
  --green-light: #4ADE80;
  --green-dark:  #0D5C2A;
  --off-white:   #F2F5F0;
  --charcoal:    #0E1510;
  --mid-grey:    #8A9E8F;
}}

body {{
  background: #111;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 32px 20px 60px;
  font-family: 'Outfit', sans-serif;
}}

/* ── IG FRAME ── */
.ig-frame {{
  width: 420px;
  background: #1A1A1A;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.65);
  overflow: hidden;
}}

.ig-header {{
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px 9px;
}}

.ig-avatar {{
  width: 36px; height: 36px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
  box-shadow: 0 0 0 2px var(--green), 0 0 0 4px #1A1A1A;
}}
.ig-avatar img {{ width: 100%; height: 100%; object-fit: cover; background: #fff; }}
.ig-handle {{ font-size: 13px; font-weight: 600; color: #fff; }}
.ig-sub {{ font-size: 11px; color: #555; }}
.ig-more {{ margin-left: auto; color: #555; font-size: 18px; cursor: pointer; font-weight: bold; padding-bottom: 8px; }}

/* ── CAROUSEL ── */
.carousel-viewport {{
  width: 420px; height: 525px;
  overflow: hidden; position: relative;
  cursor: grab; touch-action: pan-y;
}}
.carousel-viewport:active {{ cursor: grabbing; }}
.carousel-track {{
  display: flex; height: 100%;
  transition: transform 0.36s cubic-bezier(0.4,0,0.2,1);
  will-change: transform;
}}

/* ── SLIDES ── */
.slide {{
  width: 420px; height: 525px;
  flex-shrink: 0; position: relative;
  overflow: hidden; display: flex; flex-direction: column;
}}

/* ── TYPOGRAPHY ── */
.serif {{ font-family: 'Newsreader', serif; letter-spacing: -1px; }}
.sans {{ font-family: 'Outfit', sans-serif; }}

/* ── PROGRESS BAR ── */
.prog {{
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 16px 28px 20px;
  display: flex; align-items: center; gap: 10px;
  z-index: 20;
}}
.prog-track {{
  flex: 1; height: 3px; border-radius: 99px; overflow: hidden;
}}
.prog-fill {{ height: 100%; border-radius: 99px; }}
.prog-num {{
  font-size: 11px; font-weight: 500; font-family: 'Outfit', sans-serif;
  letter-spacing: 0.5px; white-space: nowrap;
}}

/* ── SWIPE ARROW ── */
.arrow {{
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 48px; display: flex; align-items: center; justify-content: center;
  z-index: 15; pointer-events: none;
}}

/* ── IG BOTTOM ── */
.ig-dots {{
  display: flex; justify-content: center; gap: 5px; padding: 8px 0;
  background: #1A1A1A;
}}
.dot {{
  width: 6px; height: 6px; border-radius: 50%;
  background: #444; transition: background 0.3s, transform 0.3s;
}}
.dot.active {{ background: #3897f0; transform: scale(1.1); }}

.ig-actions {{
  display: flex; align-items: center; gap: 14px;
  padding: 8px 14px 6px; background: #1A1A1A;
}}
.ig-bookmark {{ margin-left: auto; }}

.ig-caption {{
  padding: 5px 14px 16px; background: #1A1A1A;
  font-size: 12.5px; color: #ccc; font-family: 'Outfit', sans-serif; line-height: 1.45;
}}
.ig-caption strong {{ color: #fff; }}
.ig-caption .hash {{ color: #E0E0E0; }}
.ig-time {{ font-size: 10px; color: #666; margin-top: 3px; }}
</style>
</head>
<body>
<div class="ig-frame">

  <div class="ig-header">
    <div class="ig-avatar"><img src="data:image/png;base64,{avatar_b64}" alt="Avatar"></div>
    <div>
      <div class="ig-handle">thetouchlinedribble</div>
    </div>
    <div class="ig-more">...</div>
  </div>

  <div class="carousel-viewport">
    <div class="carousel-track" id="track">
"""

def generate_branding(is_light):
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
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="serif" style="font-size:44px;line-height:1.0;color:var(--charcoal);margin-bottom:24px;text-transform:uppercase;">
                IT'S APRIL.<br/>ARE <span style="color:var(--green);font-style:italic;">ARSENAL</span><br/>BOTTLING<br/>IT? 🍼
              </div>
              <div class="sans" style="font-size:15px;font-weight:500;color:#555;line-height:1.5;margin-bottom:32px;max-width:90%;">
                The PTSD is kicking in, but is this year actually different? Let's talk about it.
              </div>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
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
html_template += """
    </div>
  </div>
  
  <div class="ig-dots">
    <div class="dot active"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
  
  <div class="ig-actions">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    <svg class="ig-bookmark" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
  </div>
  
  <div class="ig-caption">
    <strong>thetouchlinedribble</strong> Are Arsenal actually going to do it this time? 👀 Don't bottle it... <span class="hash">#Arsenal #PremierLeague #Gunners #COYG</span>
    <div class="ig-time">2 HOURS AGO</div>
  </div>

</div>

<script>
  const track = document.getElementById('track');
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let currentIndex = 0;
  const slides = document.querySelectorAll('.slide').length;
  const dots = document.querySelectorAll('.dot');
  
  track.addEventListener('mousedown', dragStart);
  track.addEventListener('touchstart', dragStart, {passive: true});
  
  track.addEventListener('mousemove', drag);
  track.addEventListener('touchmove', drag, {passive: true});
  
  track.addEventListener('mouseup', dragEnd);
  track.addEventListener('mouseleave', dragEnd);
  track.addEventListener('touchend', dragEnd);
  
  function dragStart(e) {
    isDragging = true;
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    track.style.transition = 'none';
  }
  
  function drag(e) {
    if (!isDragging) return;
    const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    const diff = currentX - startX;
    currentTranslate = prevTranslate + diff;
    track.style.transform = `translateX(${currentTranslate}px)`;
  }
  
  function dragEnd() {
    isDragging = false;
    track.style.transition = 'transform 0.36s cubic-bezier(0.4,0,0.2,1)';
    const movedBy = currentTranslate - prevTranslate;
    
    if (movedBy < -100 && currentIndex < slides - 1) currentIndex++;
    if (movedBy > 100 && currentIndex > 0) currentIndex--;
    
    prevTranslate = currentIndex * -420;
    track.style.transform = `translateX(${prevTranslate}px)`;
    
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }
</script>
</body>
</html>
"""

output_path = Path("/Users/pranayagrawal/Documents/Football blog/Football Blog Platform MVP/generate_carousel.html")
output_path.write_text(html_template, encoding="utf-8")
print(f"HTML generated successfully! Saved to {output_path}")
