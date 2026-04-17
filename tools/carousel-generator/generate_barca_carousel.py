import base64
from pathlib import Path

# Provide a small dummy transparent base64 for the avatar
avatar_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The Touchline Dribble — Barca Atleti Carousel</title>
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
  --barca-red:   #A50044;
  --barca-blue:  #004D98;
  --ucl-gold:    #F0A500;
  --ucl-navy:    #002447;
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
  box-shadow: 0 0 0 2px var(--ucl-gold), 0 0 0 4px #1A1A1A;
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
      <div class="ig-sub">Metropolitano</div>
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
    fill_color = 'var(--barca-red)' if is_light else 'var(--ucl-gold)'
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
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="serif" style="font-size:42px;line-height:1.0;color:#fff;margin-bottom:20px;text-transform:uppercase;">
                MISSION<br/><span style="color:var(--ucl-gold);font-style:italic;">IMPOSSIBLE</span><br/>OR NOT? 🌙
              </div>
              <div class="sans" style="font-size:14px;font-weight:500;color:#ccc;line-height:1.4;margin-bottom:12px;">
                Cubarsi gone. Alvarez magic. Sorloth ice cold. Barca head to the Metropolitano needing to do the unthinkable. Tonight. 
              </div>
              <div style="border-left: 3px solid var(--ucl-gold); padding-left: 12px; margin-top: 8px;">
                 <div class="sans" style="font-size:12px; font-weight: 600; color: #fff;">Need to win: 3-0</div>
                 <div class="sans" style="font-size:11px; color: #aaa;">Venue: Madrid, 90 mins</div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="sans" style="font-size:10px;font-weight:800;color:var(--barca-red);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                HOW IT ALL WENT WRONG
              </div>
              <div class="serif" style="font-size:36px;line-height:1.0;color:var(--charcoal);margin-bottom:16px;text-transform:uppercase;">
                THE NIGHT<br/>CAMP NOU<br/><span style="color:var(--barca-red);font-style:italic;">FELL SILENT</span> 😶
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
                <div style="display:flex;gap:12px;">
                  <div class="sans" style="font-weight:700;color:var(--barca-red);width:26px;">43'</div>
                  <div class="sans" style="font-size:13px;color:#333;line-height:1.4;"><b>Cubarsi Red Card:</b> Last-man foul, game changed instantly.</div>
                </div>
                <div style="display:flex;gap:12px;">
                  <div class="sans" style="font-weight:700;color:var(--barca-red);width:26px;">45'</div>
                  <div class="sans" style="font-size:13px;color:#333;line-height:1.4;"><b>Álvarez Goal:</b> Stunning free kick into the top corner. Unstoppable.</div>
                </div>
                <div style="display:flex;gap:12px;">
                  <div class="sans" style="font-weight:700;color:var(--barca-red);width:26px;">70'</div>
                  <div class="sans" style="font-size:13px;color:#333;line-height:1.4;"><b>Sørloth Goal:</b> Clinical volley. 10-man Barca had nothing left.</div>
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="sans" style="font-size:10px;font-weight:800;color:var(--ucl-gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                THE MATHS
              </div>
              <div class="serif" style="font-size:38px;line-height:1.0;color:#fff;margin-bottom:16px;text-transform:uppercase;">
                WHAT BARCA<br/>NEED <span style="color:var(--ucl-gold);font-style:italic;">TONIGHT</span> 🧮
              </div>
              
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="padding:10px;background:rgba(255,255,255,0.05);border-left:3px solid var(--green);">
                  <div class="sans" style="font-size:14px;font-weight:600;color:#fff;margin-bottom:2px;">Win 3-0</div>
                  <div class="sans" style="font-size:12px;color:#ccc;">Through in 90 mins. Dream scenario.</div>
                </div>
                <div style="padding:10px;background:rgba(255,255,255,0.05);border-left:3px solid var(--ucl-gold);">
                  <div class="sans" style="font-size:14px;font-weight:600;color:#fff;margin-bottom:2px;">Win 2-0</div>
                  <div class="sans" style="font-size:12px;color:#ccc;">Forces Extra Time. 2-2 on aggregate.</div>
                </div>
                <div style="padding:10px;background:rgba(255,255,255,0.05);border-left:3px solid var(--barca-red);">
                  <div class="sans" style="font-size:14px;font-weight:600;color:#fff;margin-bottom:2px;">Any other result</div>
                  <div class="sans" style="font-size:12px;color:#ccc;">Atleti go through. No away goals rule to save them.</div>
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="sans" style="font-size:10px;font-weight:800;color:var(--barca-blue);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                THE CASE FOR BARCA
              </div>
              <div class="serif" style="font-size:38px;line-height:1.0;color:var(--charcoal);margin-bottom:16px;text-transform:uppercase;">
                DON'T WRITE<br/>THEM OFF<br/><span style="color:var(--barca-blue);font-style:italic;">JUST YET</span> ✋
              </div>
              
              <ul style="padding-left:14px;margin-top:6px;display:flex;flex-direction:column;gap:10px;" class="sans">
                <li style="font-size:13px;color:#333;line-height:1.4;"><b>Lamine Yamal:</b> Atleti tried to triple-mark him in leg 1. Couldn't. Won't.</li>
                <li style="font-size:13px;color:#333;line-height:1.4;"><b>Rashford:</b> Ran Atleti ragged in leg 1. Created chaos. Found his home.</li>
                <li style="font-size:13px;color:#333;line-height:1.4;"><b>Europe Pedigree:</b> Thrashed Newcastle 7-2 in QF leg 2. They know big comebacks.</li>
                <li style="font-size:13px;color:#333;line-height:1.4;"><b>Atleti rotated:</b> Simeone rested players vs Sevilla and lost 2-1. They aren't sharp.</li>
              </ul>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="sans" style="font-size:10px;font-weight:800;color:var(--barca-red);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                THE OBSTACLES
              </div>
              <div class="serif" style="font-size:38px;line-height:1.0;color:#fff;margin-bottom:16px;text-transform:uppercase;">
                WHY IT'S SO<br/><span style="color:var(--barca-red);font-style:italic;">DAMN HARD</span> 😤
              </div>
              
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="padding:10px;background:rgba(255,255,255,0.05);border-left:3px solid #ccc;">
                  <div class="sans" style="font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;">🚫 No Cubarsi & Raphinha</div>
                  <div class="sans" style="font-size:11px;color:#ccc;">Best CB suspended. Top scorer injured. Massive losses.</div>
                </div>
                <div style="padding:10px;background:rgba(255,255,255,0.05);border-left:3px solid #ccc;">
                  <div class="sans" style="font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;">🏟️ Metropolitano wall</div>
                  <div class="sans" style="font-size:11px;color:#ccc;">68,000 Atleti fans creating hell. Simeone teams live for this.</div>
                </div>
                <div style="padding:10px;background:rgba(255,255,255,0.05);border-left:3px solid #ccc;">
                  <div class="sans" style="font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;">😈 Simeone's block</div>
                  <div class="sans" style="font-size:11px;color:#ccc;">Nobody defends a lead like Diego Simeone. Nobody.</div>
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--off-white)",
        "is_light": True,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;padding:70px 36px 60px;position:relative;z-index:2;">
              <div class="sans" style="font-size:10px;font-weight:800;color:var(--charcoal);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">
                KEY BATTLES TONIGHT
              </div>
              <div class="serif" style="font-size:34px;line-height:1.0;color:var(--charcoal);margin-bottom:20px;text-transform:uppercase;">
                WHERE THE TIE<br/>GETS WON OR <span style="color:var(--barca-red);font-style:italic;">LOST</span> ⚔️
              </div>
              
              <div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div class="sans" style="font-size:13px;font-weight:700;color:var(--charcoal);width:40%;text-align:right;">Yamal<br/><span style="font-weight:400;font-size:11px;color:#555;">Barca's spark</span></div>
                  <div class="serif" style="font-size:15px;color:var(--barca-red);font-style:italic;">vs</div>
                  <div class="sans" style="font-size:13px;font-weight:700;color:var(--charcoal);width:40%;">Le Normand<br/><span style="font-weight:400;font-size:11px;color:#555;">Atleti's rock</span></div>
                </div>
                
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div class="sans" style="font-size:13px;font-weight:700;color:var(--charcoal);width:40%;text-align:right;">Rashford<br/><span style="font-weight:400;font-size:11px;color:#555;">Pace & direct</span></div>
                  <div class="serif" style="font-size:15px;color:var(--barca-red);font-style:italic;">vs</div>
                  <div class="sans" style="font-size:13px;font-weight:700;color:var(--charcoal);width:40%;">Molina<br/><span style="font-weight:400;font-size:11px;color:#555;">Best outlet</span></div>
                </div>
                
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div class="sans" style="font-size:13px;font-weight:700;color:var(--charcoal);width:40%;text-align:right;">De Jong / Pedri<br/><span style="font-weight:400;font-size:11px;color:#555;">Control tempo</span></div>
                  <div class="serif" style="font-size:15px;color:var(--barca-red);font-style:italic;">vs</div>
                  <div class="sans" style="font-size:13px;font-weight:700;color:var(--charcoal);width:40%;">Koke / Llorente<br/><span style="font-weight:400;font-size:11px;color:#555;">Grind duels</span></div>
                </div>
              </div>
            </div>
        """
    },
    {
        "bg": "var(--charcoal)",
        "is_light": False,
        "content": """
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 36px 40px;position:relative;z-index:2;text-align:center;">
              <div class="serif" style="font-size:38px;line-height:1.0;color:#fff;margin-bottom:16px;text-transform:uppercase;">
                ARE WE IN FOR<br/>ANOTHER UCL <span style="color:var(--ucl-gold);font-style:italic;">CLASSIC</span><br/>TONIGHT?
              </div>
              <div class="sans" style="font-size:14px;font-weight:500;color:#ccc;margin-bottom:24px;">
                Will Barca pull off the impossible, or will Simeone's dark arts prevail?
              </div>
              <div class="sans" style="font-size:13px;font-weight:700;color:var(--ucl-gold);letter-spacing:1px;text-transform:uppercase;padding:12px 24px;border:2px solid var(--ucl-gold);border-radius:50px;">
                DROP YOUR PREDICTIONS 👇
              </div>
            </div>
        """
    }
]

total_slides = len(slides_data)
slides_html = ""

for i, slide in enumerate(slides_data):
    is_light = slide["is_light"]
    bg = slide["bg"]
    content = slide["content"]
    
    branding = generate_branding(is_light)
    progress = generate_progress_bar(i, total_slides, is_light)
    arrow = generate_arrow(is_light, i == total_slides - 1)
    
    slide_html = f"""
      <div class="slide" style="background: {bg};">
        {branding}
        {content}
        {progress}
        {arrow}
      </div>
    """
    slides_html += slide_html

html_bottom = """
    </div> <!-- .carousel-track -->
  </div> <!-- .carousel-viewport -->

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
    <strong>thetouchlinedribble</strong> Barca's biggest test of the season tonight at the Metropolitano 🏟️ Need a miracle to go through, but don't count out Lamine Yamal... <br/>
    <span class="hash">#barcelona #atleticomadrid #ucl #championsleague #lamineyamal #simeone</span>
    <div class="ig-time">2 HOURS AGO</div>
  </div>

</div>

<script>
  // Simple swipe logic just to preview in browser
  const track = document.getElementById('track');
  const dots = document.querySelectorAll('.dot');
  let startX = 0, currentTX = 0, idx = 0;
  const maxIdx = 6;
  const w = 420;

  viewport = document.querySelector('.carousel-viewport');
  viewport.addEventListener('pointerdown', e => {{
    startX = e.clientX;
    track.style.transition = 'none';
  }});
  viewport.addEventListener('pointermove', e => {{
    if(!startX) return;
    let diff = e.clientX - startX;
    track.style.transform = `translateX(${{-idx * w + diff}}px)`;
  }});
  viewport.addEventListener('pointerup', e => {{
    if(!startX) return;
    let diff = e.clientX - startX;
    startX = 0;
    track.style.transition = 'transform 0.36s cubic-bezier(0.4,0,0.2,1)';
    if(diff < -50 && idx < maxIdx) idx++;
    else if(diff > 50 && idx > 0) idx--;
    track.style.transform = `translateX(${{-idx * w}}px)`;
    
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }});
  viewport.addEventListener('pointerleave', e => viewport.dispatchEvent(new Event('pointerup')));
</script>
</body>
</html>
"""

output_path = Path("barca_carousel.html")
output_path.write_text(html_template + slides_html + html_bottom, encoding="utf-8")
print(f"Generated {output_path.absolute()}")
