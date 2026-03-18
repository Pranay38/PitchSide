import React, { useState, useRef, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";

const AC = "#39FF14"; // Neon green
const HOT = "#FF3D00"; // Hot orange
const W = "#FFFFFF";
const DIM = "rgba(255,255,255,0.45)";
const S = 540;
const FF = "'Bebas Neue', Impact, 'Arial Black', sans-serif";
const FB = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

interface SlideData {
  tag?: string;
  headline?: string;
  subtext?: string;
  stat?: string;
  label?: string;
  context?: string;
  fact?: string;
  commentary?: string;
  take?: string;
  support?: string;
  [key: string]: any;
}

interface Slide {
  type: "cover" | "stat" | "fact" | "hottake" | "cta";
  data: SlideData;
  img: string | null;
}

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
const BgImg = ({ src }: { src: string | null }) => src ? (
  <img src={src} alt=""
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
      objectFit: "cover", zIndex: 0 }} />
) : (
  <div style={{ position: "absolute", inset: 0, background: "#111", zIndex: 0 }} />
);

// ── Slide wrappers ─────────────────────────────────────────────────────────────
const wrap: React.CSSProperties = {
  width: S, height: S, position: "relative",
  overflow: "hidden", flexShrink: 0, background: "#0B0B0B"
};

// COVER slide
function CoverSlide({ d, img }: { d: SlideData, img: string | null }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.65} />
      {/* neon left border */}
      <div style={{ position:"absolute", top:0, left:0, width:5, height:"62%", background:AC, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"0 36px 36px 36px" }}>
        
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:14, width:"fit-content" }}>
          <div style={{ width:7, height:7, background:AC, borderRadius:"50%" }} />
          <span style={{ color:AC, fontSize:11, letterSpacing:3.5, fontFamily:FB, fontWeight:700, textTransform:"uppercase" }}>
            {d.tag || "Football"}
          </span>
        </div>

        <h1 style={{ color:W, fontSize:58, lineHeight:0.95, margin:"0 0 14px",
          textTransform:"uppercase", fontFamily:FF, letterSpacing:1 }}>
          {d.headline}
        </h1>

        <div style={{ width:44, height:3, background:AC, marginBottom:14 }} />

        <p style={{ color:DIM, fontSize:14, margin:0, lineHeight:1.55, fontFamily:FB, fontWeight:400, maxWidth:380 }}>
          {d.subtext}
        </p>

        <div style={{ marginTop:24, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:AC, fontSize:11, fontFamily:FB, fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>Swipe →</span>
        </div>
      </div>
      <Bar />
    </div>
  );
}

// STAT slide
function StatSlide({ d, img, n, t }: { d: SlideData, img: string | null, n: number, t: number }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.78} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:AC, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 40px" }}>
        <div style={{ color:DIM, fontSize:10, letterSpacing:3, marginBottom:24, fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>
          {n} / {t}
        </div>
        <div style={{ fontSize:106, color:AC, lineHeight:0.9, fontFamily:FF, marginBottom:8 }}>
          {d.stat}
        </div>
        <div style={{ borderLeft:`5px solid ${AC}`, paddingLeft:16, marginBottom:18 }}>
          <span style={{ color:W, fontSize:24, textTransform:"uppercase", fontFamily:FF, letterSpacing:0.5 }}>
            {d.label}
          </span>
        </div>
        <p style={{ color:DIM, fontSize:14, margin:0, lineHeight:1.6, fontFamily:FB, fontWeight:400, maxWidth:400 }}>
          {d.context}
        </p>
      </div>
      <Bar />
    </div>
  );
}

// FACT slide
function FactSlide({ d, img, n, t }: { d: SlideData, img: string | null, n: number, t: number }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.76} />
      <div style={{ position:"absolute", top:0, right:0, width:5, height:"100%", background:AC, opacity:0.7, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 44px 0 40px" }}>
        <div style={{ color:DIM, fontSize:10, letterSpacing:3, marginBottom:20, fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>{n} / {t}</div>
        <div style={{ fontSize:72, color:AC, lineHeight:0.7, marginBottom:12, fontFamily:"Georgia, serif", fontWeight:900 }}>"</div>
        <p style={{ color:W, fontSize:30, lineHeight:1.2, margin:"0 0 20px", textTransform:"uppercase", fontFamily:FF, letterSpacing:0.5, maxWidth:410 }}>{d.fact}</p>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <div style={{ width:36, height:3, background:AC }} />
          <div style={{ width:10, height:3, background:AC, opacity:0.35 }} />
        </div>
        <p style={{ color:DIM, fontSize:13, margin:0, lineHeight:1.65, fontFamily:FB, fontWeight:400 }}>{d.commentary}</p>
      </div>
      <Bar />
    </div>
  );
}

// HOT TAKE slide
function HotTakeSlide({ d, img, n, t }: { d: SlideData, img: string | null, n: number, t: number }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.75} />
      <div style={{ position:"absolute", top:0, right:0, width:5, height:"100%", background:HOT, zIndex:2 }} />

      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2,
        display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 52px 0 40px" }}>
        <div style={{ color:DIM, fontSize:10, letterSpacing:3, marginBottom:18, fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>{n} / {t}</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:HOT, color:W, fontSize:10, fontWeight:700, letterSpacing:2.5, padding:"5px 12px", marginBottom:22, textTransform:"uppercase", width:"fit-content", fontFamily:FB }}>
          🔥 Hot Take
        </div>
        <p style={{ color:W, fontSize:32, lineHeight:1.15, margin:"0 0 20px", textTransform:"uppercase", fontFamily:FF, letterSpacing:0.5, maxWidth:400 }}>{d.take}</p>
        <div style={{ width:36, height:3, background:HOT, marginBottom:14 }} />
        <p style={{ color:DIM, fontSize:13, margin:0, lineHeight:1.65, fontFamily:FB, fontWeight:400 }}>{d.support}</p>
      </div>
      <Bar />
    </div>
  );
}

// CTA slide
function CTASlide({ img }: { img: string | null }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.82} />
      <div style={{ position:"absolute", inset:"0 0 38px 0", zIndex:2, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", padding:"0 44px" }}>
        <div style={{ color:DIM, fontSize:10, letterSpacing:4, marginBottom:20, fontFamily:FB, fontWeight:600, textTransform:"uppercase" }}>Enjoyed this?</div>
        <h2 style={{ color:AC, fontSize:68, lineHeight:0.92, textTransform:"uppercase", margin:"0 0 26px", fontFamily:FF }}>Follow<br />The Blog</h2>
        <div style={{ border:`1px solid ${AC}55`, padding:"10px 30px", marginBottom:18 }}>
          <span style={{ color:W, fontSize:16, fontFamily:FB, fontWeight:700, letterSpacing:1 }}>@thetouchlinedribble</span>
        </div>
        <p style={{ color:DIM, fontSize:12, margin:0, fontFamily:FB, fontWeight:600, letterSpacing:2, textTransform:"uppercase" }}>Football. Culture. No cap.</p>
      </div>
      <Bar />
    </div>
  );
}

function renderSlide(slide: Slide, i: number, total: number) {
  const { type, data, img } = slide;
  switch (type) {
    case "cover":    return <CoverSlide d={data} img={img} />;
    case "stat":     return <StatSlide d={data} img={img} n={i+1} t={total} />;
    case "fact":     return <FactSlide d={data} img={img} n={i+1} t={total} />;
    case "hottake":  return <HotTakeSlide d={data} img={img} n={i+1} t={total} />;
    case "cta":      return <CTASlide img={img} />;
    default: return null;
  }
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ img, onImg, label }: { img: string | null, onImg: (url: string) => void, label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  
  const toBase64 = (f: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(f);
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await toBase64(f);
    onImg(url);
  };
  
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith("image/")) return;
    const url = await toBase64(f);
    onImg(url);
  }, [onImg]);

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      className="transition-colors hover:border-green-500/80"
      style={{
        border: img ? `1.5px solid ${AC}55` : "1px dashed var(--color-border-secondary, #374151)",
        borderRadius: "var(--border-radius-md, 8px)",
        padding: img ? "0" : "10px 12px",
        cursor: "pointer",
        background: img ? "transparent" : "var(--color-background-secondary, rgba(255,255,255,0.02))",
        display: "flex", alignItems: "center", gap: 10,
        overflow: "hidden", minHeight: 48, position: "relative",
      }}>
      {img
        ? <>
            <img src={img} alt="" style={{ width:52, height:52, objectFit:"cover", flexShrink:0 }} />
            <span style={{ fontSize:12, color:"var(--color-text-secondary, #9CA3AF)" }}>
              {label} — click to change
            </span>
          </>
        : <>
            <span style={{ fontSize:20 }}>🖼️</span>
            <span style={{ fontSize:12, color:"var(--color-text-secondary, #9CA3AF)" }}>
              {label} — click or drag photo here
            </span>
          </>
      }
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display:"none" }} />
    </div>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────────
const fieldMeta: Record<string, [string, string][]> = {
  cover:    [["tag","Tag / Category"],["headline","Headline"],["subtext","Subtext"]],
  stat:     [["stat","Stat Value"],["label","Label"],["context","Context"]],
  fact:     [["fact","Fact"],["commentary","Commentary"]],
  hottake:  [["take","The Take"],["support","Support line"]],
  cta:      [],
};

function EditPanel({ slide, idx, onChange }: { slide: Slide, idx: number, onChange: (i: number, f: string, v: string) => void }) {
  const fields = fieldMeta[slide.type] || [];
  if (!fields.length) return (
    <div style={{ padding:"14px 0", fontSize:13, color:"var(--color-text-tertiary, #6B7280)", textAlign:"center" }}>
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
            <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:2, color:"var(--color-text-tertiary, #6B7280)", marginBottom:5 }}>
              {label}
            </div>
            {long
              ? <textarea value={val} rows={2}
                  onChange={e => onChange(idx, key, e.target.value)}
                  className="bg-white/5 border border-white/10 text-white"
                  style={{ width:"100%", fontSize:13, lineHeight:1.5, padding:"8px 10px", resize:"vertical", borderRadius:"6px", outline:"none" }} />
              : <input value={val} type="text"
                  onChange={e => onChange(idx, key, e.target.value)}
                  className="bg-white/5 border border-white/10 text-white"
                  style={{ width:"100%", fontSize:13, padding:"8px 10px", borderRadius:"6px", outline:"none" }} />
            }
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface InstagramCarouselGeneratorProps {
  initialText?: string;
  onClose?: () => void;
}

export function InstagramCarouselGenerator({ initialText = "", onClose }: InstagramCarouselGeneratorProps) {
  const [article, setArticle] = useState(initialText);
  const [slides,  setSlides]  = useState<Slide[]>([]);
  const [cur,     setCur]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [dlState, setDlState] = useState("idle");
  const [err,     setErr]     = useState("");
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load requested custom fonts for the render
    [
      "https://cdn.jsdelivr.net/npm/@fontsource/bebas-neue@5/index.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/400.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/700.css",
    ].forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const l = document.createElement("link");
        l.rel = "stylesheet"; l.href = href;
        document.head.appendChild(l);
      }
    });
  }, []);

  const generate = async () => {
    if (!article.trim()) return;
    setLoading(true); setErr(""); setSlides([]);
    try {
      const res = await fetch("/api/sys?action=ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "carousel", article })
      });
      
      const responseBody = await res.json();
      
      if (!res.ok) {
        throw new Error(responseBody.error || "Generation failed");
      }
      
      const p = responseBody.data;

      const built: Slide[] = [
        { type: "cover",   data: p.cover,    img: null },
        ...(p.stats  || []).map((s: any) => ({ type: "stat" as const,    data: s, img: null })),
        ...(p.facts  || []).map((f: any) => ({ type: "fact" as const,    data: f, img: null })),
        p.hottake ? { type: "hottake", data: p.hottake, img: null } : null,
        { type: "cta",    data: {},           img: null }
      ].filter(Boolean) as Slide[];

      setSlides(built);
      setCur(0);
    } catch (e: any) {
      setErr(e.message || "Generation failed — try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const updateImg = (idx: number, url: string) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, img: url } : s));
  };

  const updateData = (idx: number, field: string, val: string) => {
    setSlides(prev => prev.map((s, i) =>
      i === idx ? { ...s, data: { ...s.data, [field]: val } } : s
    ));
  };

  const capture = async (el: HTMLElement, name: string) => {
    await document.fonts.ready;
    const c = await html2canvas(el, {
      scale: 2, backgroundColor: "#0B0B0B", useCORS: true,
      allowTaint: true, logging: false
    });
    const a = document.createElement("a");
    a.download = name;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  const dlOne = async () => {
    if (!slideRef.current || dlState !== "idle") return;
    setDlState("one");
    await capture(slideRef.current, `touchline-slide-${cur + 1}.png`);
    setDlState("idle");
  };

  const dlAll = async () => {
    if (!slideRef.current || dlState !== "idle") return;
    setDlState("all");
    const orig = cur;
    for (let i = 0; i < slides.length; i++) {
        setCur(i);
        // We wait slightly longer between slides to ensure React updates
        await new Promise(r => setTimeout(r, 450));
        if (slideRef.current) {
            await capture(slideRef.current, `touchline-slide-${i + 1}.png`);
        }
        await new Promise(r => setTimeout(r, 200));
    }
    setCur(orig);
    setDlState("idle");
  };

  const busy = loading || dlState !== "idle";
  const slideName = (s: Slide) => ({ cover:"Cover", stat:"Stat", fact:"Fact", hottake:"Hot Take", cta:"CTA" }[s.type] || s.type);

  return (
    <div className="flex flex-col gap-6" style={{ width: "100%", fontFamily: "var(--font-sans, system-ui)" }}>
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
          Instagram Carousel Studio
        </h2>
        <p className="text-sm mt-3 text-gray-500 dark:text-gray-400">
          Paste an article, and the AI will auto-extract bold stats and hot takes into a downloadable 1080x1080 visual carousel.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Column Controls */}
        <div className="flex-1 max-w-lg space-y-6">
          {/* Step 1 */}
          <div className="bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-500 mb-3">
              Step 1: The Source Text
            </div>
            <textarea
              value={article} onChange={e => setArticle(e.target.value)}
              disabled={busy}
              placeholder="Paste the raw article text here..."
              className="w-full h-32 text-sm bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 outline-none focus:border-green-500/50 resize-y mb-3 transition-opacity"
              style={{ opacity: busy ? 0.5 : 1 }}
            />
            <button 
              onClick={generate} 
              disabled={busy || !article.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "✦ Mining content..." : "Generate Carousel Data ↗"}
            </button>
            {err && <p className="text-red-500 text-xs mt-3 font-medium">{err}</p>}
          </div>

          {/* Step 2 — photo uploads */}
          {slides.length > 0 && (
            <div className="bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 fade-in">
              <div className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-500 mb-4">
                Step 2: Add Visuals
              </div>
              <div className="flex flex-col gap-3">
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
          )}
        </div>

        {/* Right Column Preview */}
        {slides.length > 0 && (
          <div className="flex-1 flex flex-col items-center bg-gray-50 dark:bg-black/30 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-500 mb-4 w-full text-center">
              Step 3: Edit & Download
            </div>

            {/* Slide tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto max-w-full pb-2 px-1 scrollbar-hide">
              {slides.map((s, i) => (
                <button key={i} onClick={() => !busy && setCur(i)} disabled={busy}
                  className={`px-4 py-2 text-xs rounded-full whitespace-nowrap transition-colors ${
                    i === cur ? 'bg-green-500 text-black font-bold shadow-sm' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 font-medium border border-transparent'
                  }`}>
                  {slideName(s)} {s.img ? "✓" : ""}
                </button>
              ))}
            </div>

            {/* Slide preview scaler (to fit in UI) */}
            <div className="relative mb-6 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center bg-[#0B0B0B]" style={{ width: 400, height: 400 }}>
              <div style={{ transform: `scale(${400 / 540})`, transformOrigin: "top left", width: 540, height: 540, position: 'absolute', top: 0, left: 0 }}>
                {/* The actual capture div */}
                <div ref={slideRef} style={{ width: 540, height: 540 }}>
                   {renderSlide(slides[cur], cur, slides.length)}
                </div>
              </div>
            </div>

            {/* Edit panel for current slide */}
            <div className="w-full max-w-sm bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
              <div className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                ✏️ Edit Slide {cur + 1}
              </div>
              <EditPanel slide={slides[cur]} idx={cur} onChange={updateData} />
            </div>

            {/* Download */}
            <div className="flex w-full max-w-sm gap-4">
              <button 
                onClick={dlOne} 
                disabled={busy} 
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 text-gray-900 dark:text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
              >
                {dlState === "one" ? "Capturing..." : `↓ Slide ${cur + 1}`}
              </button>
              <button 
                onClick={dlAll} 
                disabled={busy} 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm shadow-green-500/20"
              >
                {dlState === "all" ? `Downloading ${cur + 1}/${slides.length}...` : "↓ Download All"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Files bypass standard layout shifting and export natively at 1080×1080px.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
