import React, { useState, useRef, useEffect, useCallback } from "react";

const AC  = "#39FF14"; // Neon green
const HOT = "#FF3D00"; // Hot Red
const W   = "#FFFFFF";
const DIM = "rgba(255,255,255,0.45)";
const WIDTH  = 540;
const HEIGHT = 960;    // 9:16 Aspect Ratio for Reels
const FF  = "'Bebas Neue', Impact, 'Arial Black', sans-serif";
const FB  = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

const Tint = ({ strength = 0.72 }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength + 0.1}) 100%)`, zIndex: 1 }} />
);

const Bar = () => (
  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: AC, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 3 }}>
    <span style={{ fontSize: 13, fontWeight: 900, color: "#0B0B0B", letterSpacing: 2.5, fontFamily: FF, textTransform: "uppercase" }}> The Touchline Dribble </span>
    <span style={{ fontSize: 11, color: "#0B0B0B", opacity: 0.55, fontFamily: FB, fontWeight: 700, letterSpacing: 1 }}> @thetouchlinedribble </span>
  </div>
);

const BgImg = ({ src }) => src ? (
  <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
) : ( <div style={{ position: "absolute", inset: 0, background: "#111", zIndex: 0 }} /> );

const wrap = { width: WIDTH, height: HEIGHT, position: "relative", overflow: "hidden", flexShrink: 0, background: "#0B0B0B" };

// COVER slide (Reel Hook)
function CoverSlide({ d, img }) {
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.65} />
      <div style={{ position:"absolute", top:0, left:0, width:8, height:"65%", background:AC, zIndex:2 }} />
      <div style={{ position:"absolute", inset:"0 0 48px 0", zIndex:2, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 40px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:16, width:"fit-content", background:AC, padding:"4px 12px" }}>
          <span style={{ color:"#000", fontSize:14, letterSpacing:3.5, fontFamily:FB, fontWeight:900, textTransform:"uppercase" }}> {d.tag || "QUICK TAKE"} </span>
        </div>
        <h1 style={{ color:W, fontSize:64, lineHeight:0.95, margin:"0 0 16px", textTransform:"uppercase", fontFamily:FF, letterSpacing:1 }}> {d.headline} </h1>
        <div style={{ width:60, height:4, background:AC, marginBottom:16 }} />
        <p style={{ color:DIM, fontSize:20, margin:0, lineHeight:1.55, fontFamily:FB, fontWeight:400 }}> {d.subtext} </p>
      </div>
      <Bar />
    </div>
  );
}

// BODY slide (Fact/Stat)
function BodySlide({ d, img, isHot = false }) {
  const COLOR = isHot ? HOT : AC;
  return (
    <div style={wrap}>
      <BgImg src={img} />
      <Tint strength={0.78} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:6, background:COLOR, zIndex:2 }} />
      <div style={{ position:"absolute", inset:"0 0 48px 0", zIndex:2, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 40px" }}>
        {isHot && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:HOT, color:W, fontSize:12, fontWeight:900, letterSpacing:2.5, padding:"5px 12px", marginBottom:22, textTransform:"uppercase", width:"fit-content", fontFamily:FB }}>
                🔥 Hot Take
            </div>
        )}
        <div style={{ fontSize:90, color:COLOR, lineHeight:0.9, fontFamily:FF, marginBottom:12 }}> {d.main} </div>
        <p style={{ color:W, fontSize:28, margin:0, lineHeight:1.6, fontFamily:FB, fontWeight:600 }}> {d.context} </p>
      </div>
      <Bar />
    </div>
  );
}

function renderSlide(slide) {
  const { type, data, img } = slide;
  switch (type) {
    case "cover": return <CoverSlide d={data} img={img} />;
    case "body":  return <BodySlide d={data} img={img} />;
    case "hottake": return <BodySlide d={data} img={img} isHot={true} />;
    default: return null;
  }
}

export function QuickTakeVideoGenerator() {
  const [article, setArticle] = useState("");
  const [slides,  setSlides]  = useState([]);
  const [cur,     setCur]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [recordState, setRecordState] = useState("idle"); // idle, recording
  const slideRef = useRef(null);

  useEffect(() => {
    ["https://cdn.jsdelivr.net/npm/@fontsource/bebas-neue@5/index.css",
     "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/400.css",
     "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/700.css",
     "https://cdn.jsdelivr.net/npm/@fontsource/barlow-condensed@5/900.css"
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
    setLoading(true); setSlides([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        // Fallback or use backend route usually, for MVP we handle client side if API is passed or we mockup
        // Since we don't confidently have key on client, we will use a dummy generation parser to simulate the Auto Gen for the UI demonstration
      });
      // Mocked AI output for MVP safety without leaking keys
      setTimeout(() => {
          setSlides([
            { type: "cover", data: { tag: "QUICK TAKE", headline: "MADRID'S MASTERCLASS", subtext: "Why Carlo Ancelotti outclassed Tuchel." }, img: null },
            { type: "body", data: { main: "72% possession", context: "Total domination in the midfield third by Toni Kroos." }, img: null },
            { type: "hottake", data: { main: "BAYERN IS BROKEN", context: "This squad needs a total rebuild before 2027." }, img: null }
          ]);
          setCur(0);
          setLoading(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const updateImg = (idx, url) => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, img: url } : s));

  const recordVideo = async () => {
    if (!slideRef.current || !window.html2canvas) return;
    setRecordState("recording");

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    
    // Fallback if MediaRecorder is not supported for canvas
    let stream;
    try {
        stream = canvas.captureStream(10); // 10 fps
    } catch (e) {
        alert("Browser doesn't support canvas stream capture");
        setRecordState("idle");
        return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "quick-take-reel.webm"; 
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();

    // Auto-advance and capture loop
    const origCur = cur;
    for (let i = 0; i < slides.length; i++) {
      setCur(i);
      await new Promise(r => setTimeout(r, 300)); // UI flush

      // Render 3 seconds per slide at 10 fps = 30 frames
      for(let f = 0; f < 30; f++) {
        const frameCanvas = await window.html2canvas(slideRef.current, { scale: 1, backgroundColor: "#0B0B0B" });
        ctx.clearRect(0,0,WIDTH,HEIGHT);
        ctx.drawImage(frameCanvas, 0, 0, WIDTH, HEIGHT);
        await new Promise(r => setTimeout(r, 50)); // simulate frame delay
      }
    }
    recorder.stop();
    setCur(origCur);
    setRecordState("idle");
  };

  return (
    <div className="bg-[#0f172a] text-white p-8 rounded-3xl w-full mx-auto font-sans shadow-2xl border border-gray-800">
      <h2 className="text-3xl font-black font-outfit uppercase tracking-wider mb-2 text-[#39FF14]">Auto-Social Reels Generator</h2>
      <p className="text-gray-400 mb-6 text-sm">Dump full text below and auto-generate a 15-second 9:16 webm video.</p>

      <textarea
          value={article} onChange={e => setArticle(e.target.value)}
          placeholder="Paste match reaction or quick take here..."
          className="w-full bg-[#1e293b] border border-gray-700 rounded-xl p-4 h-32 text-sm focus:outline-none focus:border-[#39FF14] mb-4"
      />
      
      <button onClick={generate} disabled={loading} className="w-full bg-[#39FF14] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-colors mb-8">
        {loading ? "Generating Hook & Body..." : "1. Setup Slides"}
      </button>

      {slides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr,540px] gap-8">
              <div>
                  <h3 className="font-bold uppercase tracking-widest text-[#39FF14] mb-4 text-xs">2. Upload Slide Backgrounds</h3>
                  <div className="space-y-4">
                      {slides.map((s, i) => (
                          <div key={i} className="flex items-center gap-4 bg-[#1e293b] p-4 rounded-xl border border-gray-700">
                              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                              <div className="flex-1">
                                  <div className="text-xs uppercase text-gray-400 font-bold mb-1">{s.type}</div>
                                  <input type="file" accept="image/*" className="text-xs" onChange={(e) => {
                                      if(e.target.files[0]) {
                                          const reader = new FileReader();
                                          reader.onload = () => updateImg(i, reader.result);
                                          reader.readAsDataURL(e.target.files[0]);
                                      }
                                  }} />
                              </div>
                          </div>
                      ))}
                  </div>

                  <h3 className="font-bold uppercase tracking-widest text-[#39FF14] mt-8 mb-4 text-xs">3. Generate & Download Reel</h3>
                  <button onClick={recordVideo} disabled={recordState === "recording"} className="w-full bg-[#FF3D00] text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(255,61,0,0.4)]">
                     {recordState === "recording" ? "Recording Canvas (Do not switch tabs)..." : "Record to .WebM Video"}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">Renders using html2canvas and MediaRecorder. Produces a 9:16 ready-to-post webm file.</p>
              </div>

              {/* Preview Window */}
              <div className="flex justify-center items-start bg-black rounded-3xl p-4 outline outline-2 outline-white/10">
                  <div 
                      ref={slideRef} 
                      className="origin-top relative" 
                      style={{ 
                          width: WIDTH, height: HEIGHT, 
                          transform: 'scale(0.8)', 
                          marginBottom: '-192px' 
                      }}>
                      {renderSlide(slides[cur])}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
