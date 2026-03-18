import { useState, useRef, useEffect, useCallback } from "react";

const AC  = "#39FF14";
const HOT = "#FF3D00";
const W   = "#FFFFFF";
const DIM = "rgba(255,255,255,0.45)";
const S   = 540;
const FF  = "'Bebas Neue', Impact, 'Arial Black', sans-serif";
const FB  = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

// ── Shared tint overlay ────────────────────────────────────────────────────────
const Tint = ({ strength = 0.72 }) => (
  <div style={{
    position: "absolute", inset: 0,
    background: `linear-gradient(160deg, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength + 0.1}) 100%)`,
    zIndex: 1
  }} />
);

// ── Brand bar ──────────────────────────────────────────────────────────────────
const Bar = () => (
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0, height: 38,
    background: AC, display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "0 20px", zIndex: 3
  }}>
    <span style={{ fontSize: 11, fontWeight: 900, color: "#0B0B0B",
      letterSpacing: 2.5, fontFamily: FF, textTransform: "uppercase" }}>
      The Touchline Dribble
    </span>
    <span style={{ fontSize: 9, color: "#0B0B0B", opacity: 0.55,
      fontFamily: FB, fontWeight: 700, letterSpacing: 1 }}>
      @thetouchlinedribble
    </span>
  </div>
);

// ── BG image layer ────────────────────────────────────────────────────────────
const BgImg = ({ src }) => src ? (
  <img src={src} alt=""
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
      objectFit: "cover", zIndex: 0 }} />
) : (
  <div style={{ position: "absolute", inset: 0, background: "#111", zIndex: 0 }} />
);

// ── Slide wrappers ─────────────────────────────────────────────────────────────
const wrap = {
  width: S, height: S, position: "relative",
  overflow: "hidden", flexShrink: 0, background: "#0B0B0B"
};

// COVER slide
function CoverSlide({ d, img }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.65} />
      {/* neon left border */}
      <div style={{ position:"absolute", top:0, left:0, width:5, height:"62%",
        background:AC, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"flex-end",
        padding:"0 36px 36px 36px" }}>

        {/* tag */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:7,
          marginBottom:14, width:"fit-content" }}>
          <div style={{ width:7, height:7, background:AC, borderRadius:"50%" }} />
          <span style={{ color:AC, fontSize:11, letterSpacing:3.5,
            fontFamily:FB, fontWeight:700, textTransform:"uppercase" }}>
            {d.tag || "Football"}
          </span>
        </div>

        <h1 style={{ color:W, fontSize:58, lineHeight:0.95, margin:"0 0 14px",
          textTransform:"uppercase", fontFamily:FF, letterSpacing:1 }}>
          {d.headline}
        </h1>

        <div style={{ width:44, height:3, background:AC, marginBottom:14 }} />

        <p style={{ color:DIM, fontSize:14, margin:0, lineHeight:1.55,
          fontFamily:FB, fontWeight:400, maxWidth:380 }}>
          {d.subtext}
        </p>

        <div style={{ marginTop:24, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:AC, fontSize:11, fontFamily:FB, fontWeight:700,
            letterSpacing:3, textTransform:"uppercase" }}>Swipe →</span>
        </div>
      </div>
      <Bar />
    </div>
  );
}

// STAT slide
function StatSlide({ d, img, n, t }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.78} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
        background:AC, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"0 40px" }}>

        <div style={{ color:DIM, fontSize:10, letterSpacing:3, marginBottom:24,
          fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>
          {n} / {t}
        </div>

        <div style={{ fontSize:106, color:AC, lineHeight:0.9, fontFamily:FF,
          marginBottom:8 }}>
          {d.stat}
        </div>

        <div style={{ borderLeft:`5px solid ${AC}`, paddingLeft:16, marginBottom:18 }}>
          <span style={{ color:W, fontSize:24, textTransform:"uppercase",
            fontFamily:FF, letterSpacing:0.5 }}>
            {d.label}
          </span>
        </div>

        <p style={{ color:DIM, fontSize:14, margin:0, lineHeight:1.6,
          fontFamily:FB, fontWeight:400, maxWidth:400 }}>
          {d.context}
        </p>
      </div>
      <Bar />
    </div>
  );
}

// FACT slide
function FactSlide({ d, img, n, t }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.76} />
      <div style={{ position:"absolute", top:0, right:0, width:5, height:"100%",
        background:AC, opacity:0.7, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"0 44px 0 40px" }}>

        <div style={{ color:DIM, fontSize:10, letterSpacing:3, marginBottom:20,
          fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>
          {n} / {t}
        </div>

        {/* oversized quote */}
        <div style={{ fontSize:72, color:AC, lineHeight:0.7,
          marginBottom:12, fontFamily:"Georgia, serif", fontWeight:900 }}>"</div>

        <p style={{ color:W, fontSize:30, lineHeight:1.2, margin:"0 0 20px",
          textTransform:"uppercase", fontFamily:FF, letterSpacing:0.5,
          maxWidth:410 }}>
          {d.fact}
        </p>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <div style={{ width:36, height:3, background:AC }} />
          <div style={{ width:10, height:3, background:AC, opacity:0.35 }} />
        </div>

        <p style={{ color:DIM, fontSize:13, margin:0, lineHeight:1.65,
          fontFamily:FB, fontWeight:400 }}>
          {d.commentary}
        </p>
      </div>
      <Bar />
    </div>
  );
}

// HOT TAKE slide
function HotTakeSlide({ d, img, n, t }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.75} />
      <div style={{ position:"absolute", top:0, right:0, width:5, height:"100%",
        background:HOT, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"0 52px 0 40px" }}>

        <div style={{ color:DIM, fontSize:10, letterSpacing:3, marginBottom:18,
          fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>
          {n} / {t}
        </div>

        <div style={{ display:"inline-flex", alignItems:"center", gap:6,
          background:HOT, color:W, fontSize:10, fontWeight:700, letterSpacing:2.5,
          padding:"5px 12px", marginBottom:22, textTransform:"uppercase",
          width:"fit-content", fontFamily:FB }}>
          🔥 Hot Take
        </div>

        <p style={{ color:W, fontSize:32, lineHeight:1.15, margin:"0 0 20px",
          textTransform:"uppercase", fontFamily:FF, letterSpacing:0.5, maxWidth:400 }}>
          {d.take}
        </p>

        <div style={{ width:36, height:3, background:HOT, marginBottom:14 }} />

        <p style={{ color:DIM, fontSize:13, margin:0, lineHeight:1.65,
          fontFamily:FB, fontWeight:400 }}>
          {d.support}
        </p>
      </div>
      <Bar />
    </div>
  );
}

// CTA slide
function CTASlide({ img }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.82} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center",
        alignItems:"center", textAlign:"center", padding:"0 44px" }}>

        <div style={{ color:DIM, fontSize:10, letterSpacing:4, marginBottom:20,
          fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>
          Enjoyed this?
        </div>

        <h2 style={{ color:AC, fontSize:68, lineHeight:0.92,
          textTransform:"uppercase", margin:"0 0 26px", fontFamily:FF }}>
          Follow<br />The Blog
        </h2>

        <div style={{ border:`1px solid ${AC}55`, padding:"10px 30px",
          marginBottom:18 }}>
          <span style={{ color:W, fontSize:16, fontFamily:FB,
            fontWeight:700, letterSpacing:1 }}>
            @thetouchlinedribble
          </span>
        </div>

        <p style={{ color:DIM, fontSize:12, margin:0, fontFamily:FB,
          fontWeight:600, letterSpacing:2, textTransform:"uppercase" }}>
          Football. Culture. No cap.
        </p>
      </div>
      <Bar />
    </div>
  );
}

function renderSlide(slide, i, total) {
  const { type, data, img } = slide;
  switch (type) {
    case "cover":    return <CoverSlide    d={data} img={img} />;
    case "stat":     return <StatSlide     d={data} img={img} n={i+1} t={total} />;
    case "fact":     return <FactSlide     d={data} img={img} n={i+1} t={total} />;
    case "hottake":  return <HotTakeSlide  d={data} img={img} n={i+1} t={total} />;
    case "cta":      return <CTASlide      img={img} />;
    default: return null;
  }
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ img, onImg, label }) {
  const fileRef = useRef();
  const toBase64 = f => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(f);
  });

  const onFile = async e => {
    const f = e.target.files[0];
    if (!f) return;
    const url = await toBase64(f);
    onImg(url);
  };
  const onDrop = useCallback(async e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith("image/")) return;
    const url = await toBase64(f);
    onImg(url);
  }, [onImg]);

  return (
    <div
      onClick={() => fileRef.current.click()}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      style={{
        border: img ? `1.5px solid ${AC}55` : "1px dashed var(--color-border-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: img ? "0" : "10px 12px",
        cursor: "pointer",
        background: img ? "transparent" : "var(--color-background-secondary)",
        display: "flex", alignItems: "center", gap: 10,
        overflow: "hidden", minHeight: 48, position: "relative",
        transition: "border-color 0.15s"
      }}>
      {img
        ? <>
            <img src={img} alt="" style={{ width:52, height:52,
              objectFit:"cover", flexShrink:0 }} />
            <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>
              {label} — click to change
            </span>
          </>
        : <>
            <span style={{ fontSize:20 }}>📷</span>
            <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>
              {label} — click or drag photo here
            </span>
          </>
      }
      <input ref={fileRef} type="file" accept="image/*"
        onChange={onFile} style={{ display:"none" }} />
    </div>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────────
const fieldMeta = {
  cover:    [["tag","Tag / Category"],["headline","Headline"],["subtext","Subtext"]],
  stat:     [["stat","Stat Value"],["label","Label"],["context","Context"]],
  fact:     [["fact","Fact"],["commentary","Commentary"]],
  hottake:  [["take","The Take"],["support","Support line"]],
  cta:      [],
};

function EditPanel({ slide, idx, onChange }) {
  const fields = fieldMeta[slide.type] || [];
  if (!fields.length) return (
    <div style={{ padding:"14px 0", fontSize:13,
      color:"var(--color-text-tertiary)", textAlign:"center" }}>
      CTA slide — no editable text
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"14px 0 4px" }}>
      {fields.map(([key, label]) => {
        const val = slide.data[key] || "";
        const long = val.length > 40;
        return (
          <div key={key}>
            <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase",
              letterSpacing:2, color:"var(--color-text-tertiary)", marginBottom:5 }}>
              {label}
            </div>
            {long
              ? <textarea value={val} rows={2}
                  onChange={e => onChange(idx, key, e.target.value)}
                  style={{ width:"100%", fontSize:13, lineHeight:1.5,
                    padding:"8px 10px", resize:"vertical",
                    borderRadius:"var(--border-radius-md)", fontFamily:"inherit" }} />
              : <input value={val} type="text"
                  onChange={e => onChange(idx, key, e.target.value)}
                  style={{ width:"100%", fontSize:13,
                    padding:"8px 10px",
                    borderRadius:"var(--border-radius-md)", fontFamily:"inherit" }} />
            }
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [article, setArticle] = useState("");
  const [slides,  setSlides]  = useState([]);
  const [cur,     setCur]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [dlState, setDlState] = useState("idle");
  const [err,     setErr]     = useState("");
  const slideRef = useRef(null);

  useEffect(() => {
    [
      "https://cdn.jsdelivr.net/npm/@fontsource/bebas-neue@5/index.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/400.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/700.css",
    ].forEach(href => {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href;
      document.head.appendChild(l);
    });
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(sc);
  }, []);

  const generate = async () => {
    if (!article.trim()) return;
    setLoading(true); setErr(""); setSlides([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a social media creator for a hype football blog called "The Touchline Dribble".
Extract content from the article for a visual Instagram carousel. Return ONLY raw JSON, no markdown, no explanation:
{
  "cover":   { "tag": "1-2 word category e.g. TRANSFER / OPINION / MATCH", "headline": "MAX 5 WORDS ALL CAPS", "subtext": "one sentence max 10 words" },
  "stats":   [ { "stat": "short number/value", "label": "2-4 WORDS ALL CAPS", "context": "one punchy sentence max 12 words" } ],
  "facts":   [ { "fact": "shocking statement MAX 10 WORDS ALL CAPS", "commentary": "one sentence max 12 words" } ],
  "hottake": { "take": "boldest opinion MAX 8 WORDS ALL CAPS", "support": "one sentence max 12 words" }
}
Rules: 1-2 stats, 1-2 facts max. Keep ALL text extremely short. Hype energy. Less is more.`,
          messages: [{ role: "user", content: `Article:\n\n${article}` }]
        })
      });
      const data = await res.json();
      const raw  = data.content.filter(c => c.type === "text").map(c => c.text).join("");
      const p    = JSON.parse(raw.replace(/```json|```/g, "").trim());

      const built = [
        { type: "cover",   data: p.cover,    img: null },
        ...(p.stats  || []).map(s => ({ type: "stat",    data: s, img: null })),
        ...(p.facts  || []).map(f => ({ type: "fact",    data: f, img: null })),
        p.hottake ? { type: "hottake", data: p.hottake, img: null } : null,
        { type: "cta",    data: {},           img: null }
      ].filter(Boolean);

      setSlides(built);
      setCur(0);
    } catch (e) {
      setErr("Generation failed — try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const updateImg = (idx, url) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, img: url } : s));
  };

  const updateData = (idx, field, val) => {
    setSlides(prev => prev.map((s, i) =>
      i === idx ? { ...s, data: { ...s.data, [field]: val } } : s
    ));
  };

  const capture = async (el, name) => {
    await document.fonts.ready;
    const c = await window.html2canvas(el, {
      scale: 2, backgroundColor: "#0B0B0B", useCORS: true,
      allowTaint: true, logging: false
    });
    const a = document.createElement("a");
    a.download = name;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  const dlOne = async () => {
    if (!slideRef.current || !window.html2canvas) return;
    setDlState("one");
    await capture(slideRef.current, `touchline-slide-${cur + 1}.png`);
    setDlState("idle");
  };

  const dlAll = async () => {
    if (!window.html2canvas) return;
    setDlState("all");
    const orig = cur;
    for (let i = 0; i < slides.length; i++) {
      setCur(i);
      await new Promise(r => setTimeout(r, 380));
      await capture(slideRef.current, `touchline-slide-${i + 1}.png`);
      await new Promise(r => setTimeout(r, 200));
    }
    setCur(orig);
    setDlState("idle");
  };

  const busy = loading || dlState !== "idle";
  const slideName = s => ({ cover:"Cover", stat:"Stat", fact:"Fact", hottake:"Hot Take", cta:"CTA" })[s.type] || s.type;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.25rem 1rem",
      fontFamily: "var(--font-sans)" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 4px",
          color: "var(--color-text-primary)" }}>
          Instagram Carousel Generator
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          Paste article → AI extracts content → upload a photo per slide → download 1080×1080 PNGs
        </p>
      </div>

      {/* Step 1 */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: 2, color: "var(--color-text-tertiary)", marginBottom: 8 }}>
          Step 1 — Paste your article
        </div>
        <textarea
          value={article} onChange={e => setArticle(e.target.value)}
          disabled={busy}
          placeholder="Paste your Pitchside article here..."
          style={{ width: "100%", height: 110, resize: "vertical",
            fontSize: 13, lineHeight: 1.55, padding: "10px 12px",
            marginBottom: 10, borderRadius: "var(--border-radius-md)",
            fontFamily: "inherit", opacity: busy ? 0.5 : 1 }}
        />
        <button onClick={generate} disabled={busy || !article.trim()}
          style={{ width: "100%" }}>
          {loading ? "✦  Building slides..." : "Generate Carousel ↗"}
        </button>
        {err && <p style={{ color: "var(--color-text-danger)", fontSize: 13,
          marginTop: 8, marginBottom: 0 }}>{err}</p>}
      </div>

      {/* Step 2 — photo uploads */}
      {slides.length > 0 && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 2, color: "var(--color-text-tertiary)", marginBottom: 10 }}>
              Step 2 — Upload a photo for each slide
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {slides.map((s, i) => (
                <UploadZone
                  key={i}
                  img={s.img}
                  onImg={url => updateImg(i, url)}
                  label={`Slide ${i + 1} — ${slideName(s)}`}
                />
              ))}
            </div>
          </div>

          {/* Step 3 — preview */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 2, color: "var(--color-text-tertiary)", marginBottom: 12 }}>
              Step 3 — Preview &amp; Download
            </div>
          </div>

          {/* Slide preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div ref={slideRef}
              style={{ borderRadius: 10, overflow: "hidden",
                outline: "1px solid rgba(255,255,255,0.07)" }}>
              {renderSlide(slides[cur], cur, slides.length)}
            </div>
          </div>

          {/* Slide tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14,
            overflowX: "auto", paddingBottom: 4 }}>
            {slides.map((s, i) => (
              <button key={i} onClick={() => !busy && setCur(i)}
                disabled={busy}
                style={{
                  padding: "4px 12px", fontSize: 11, flexShrink: 0,
                  fontWeight: i === cur ? 600 : 400,
                  background: i === cur ? AC : "transparent",
                  color: i === cur ? "#0B0B0B" : "var(--color-text-secondary)",
                  border: i === cur ? `1px solid ${AC}` : "1px solid var(--color-border-tertiary)"
                }}>
                {slideName(s)} {s.img ? "✓" : ""}
              </button>
            ))}
          </div>

          {/* Edit panel for current slide */}
          <div style={{ border:"0.5px solid var(--color-border-tertiary)",
            borderRadius:"var(--border-radius-lg)", padding:"4px 14px 14px",
            marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase",
              letterSpacing:2, color:"var(--color-text-tertiary)",
              padding:"12px 0 4px" }}>
              ✏️  Edit slide {cur + 1} — {slideName(slides[cur])}
            </div>
            <EditPanel
              slide={slides[cur]}
              idx={cur}
              onChange={updateData}
            />
          </div>

          {/* Download */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={dlOne} disabled={busy} style={{ flex: 1 }}>
              {dlState === "one" ? "Capturing..." : `↓  Slide ${cur + 1}`}
            </button>
            <button onClick={dlAll} disabled={busy} style={{ flex: 1 }}>
              {dlState === "all"
                ? `Downloading ${cur + 1}/${slides.length}...`
                : "↓  Download All"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 11,
            color: "var(--color-text-tertiary)", marginTop: 10 }}>
            1080×1080 PNG · ready for Instagram · branding baked in
          </p>
        </>
      )}
    </div>
  );
}
