import React, { useState } from "react";
import { useTitleRace } from "../hooks/useTitleRace";

// ── Data ───────────────────────────────────────
// Dynamic total and current gameweeks are derived from fetch.

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFF: Record<number, { label: string, color: string, bg: string, short: string }> = {
  1: { label: "Easy",   color: "#22c55e", bg: "#22c55e18", short: "E" },
  2: { label: "Medium", color: "#f59e0b", bg: "#f59e0b18", short: "M" },
  3: { label: "Hard",   color: "#ef4444", bg: "#ef444418", short: "H" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const leader    = (teams: any[]) => Math.max(...teams.map(t => t.pts));
const maxPts    = (team: any)  => team.pts + team.remaining.length * 3;
const gamesLeft = (team: any)  => team.remaining.length;
const ptsNeeded = (team: any, leaderPts: number) => Math.max(0, leaderPts - team.pts + 1);

function formColor(r: string) {
  return r === "W" ? "#22c55e" : r === "D" ? "#f59e0b" : "#ef4444";
}

function pathToTitle(team: any, teams: any[]) {
  const top      = leader(teams);
  const gap      = top - team.pts;
  const gl       = gamesLeft(team);
  const maxP     = maxPts(team);
  const isLeader = team.pts === top;

  if (isLeader) {
    const easyLeft = team.remaining.filter((f: any) => f.diff === 1).length;
    const hardLeft = team.remaining.filter((f: any) => f.diff === 3).length;
    if (gap === 0 && hardLeft <= 1)
      return { label: "Overwhelming favourite", color: "#22c55e", icon: "🏆" };
    return { label: "Strong favourite",        color: "#22c55e", icon: "🟢" };
  }
  if (maxP < top)
    return { label: "Mathematically out",      color: "#6b7280", icon: "❌" };
  if (gap > 12)
    return { label: "Miracle needed",          color: "#ef4444", icon: "🔴" };
  if (gap > 6)
    return { label: "Very unlikely",           color: "#f59e0b", icon: "🟡" };
  return   { label: "Still in the hunt",       color: "#6CABDD", icon: "🔵" };
}

// ── Form dots ─────────────────────────────────────────────────────────────────
function FormDots({ form }: { form: string[] }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {form.map((r, i) => (
        <div key={i} style={{
          width: 18, height: 18, borderRadius: "50%",
          background: formColor(r),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 800, color: "#fff",
        }}>
          {r}
        </div>
      ))}
    </div>
  );
}

// ── Fixture pills ─────────────────────────────────────────────────────────────
function FixturePills({ remaining, max = 8 }: { remaining: any[], max?: number }) {
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {remaining.slice(0, max).map((f, i) => {
        const d = DIFF[f.diff] || DIFF[2];
        return (
          <div key={i} title={`${f.h ? "H" : "A"} vs ${f.opp} — ${d.label}`}
            style={{
              padding: "2px 6px", borderRadius: 4, fontSize: 9.5,
              fontWeight: 700, background: d.bg,
              color: d.color, border: `1px solid ${d.color}44`,
              whiteSpace: "nowrap", cursor: "default",
            }}>
            {f.h ? "" : "@"}{f.opp.split(" ")[0]}
          </div>
        );
      })}
    </div>
  );
}

// ── Points projection bar ─────────────────────────────────────────────────────
function ProjectionBar({ team, maxPossible }: { team: any, maxPossible: number }) {
  const currentPct  = (team.pts / maxPossible) * 100;
  const maxPct      = (maxPts(team) / maxPossible) * 100;
  return (
    <div style={{ position: "relative", height: 6, background: "rgba(0,0,0,0.08)",
      borderRadius: 3, overflow: "hidden" }}>
      {/* Max possible */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
        width: `${maxPct}%`, background: `${team.color}22`,
        borderRadius: 3 }} />
      {/* Current points */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
        width: `${currentPct}%`, background: team.color,
        borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────
function TeamCard({ team, teams, position, expanded, onToggle }: { team: any, teams: any[], position: number, expanded: boolean, onToggle: () => void }) {
  const top     = leader(teams);
  const gap     = top - team.pts;
  const path    = pathToTitle(team, teams);
  const maxP    = maxPts(team);
  const gl      = gamesLeft(team);
  const isFirst = team.pts === top;

  return (
    <div style={{
      background: expanded ? team.bg : "#1E293B",
      border: `0.5px solid ${expanded ? team.color + "55" : "#334155"}`,
      borderLeft: `3px solid ${team.color}`,
      borderRadius: "0 8px 8px 0",
      marginBottom: 8, transition: "all 0.2s", overflow: "hidden",
      color: "#F1F5F9"
    }}>

      {/* ── Header row ── */}
      <div onClick={onToggle} style={{ padding: "12px 16px", cursor: "pointer",
        display: "grid", alignItems: "center",
        gridTemplateColumns: "24px 1fr auto auto auto auto",
        gap: 12 }}>

        {/* Position */}
        <div style={{ fontSize: 13, fontWeight: 700,
          color: position === 1 ? team.color : "#94A3B8" }}>
          {position}
        </div>

        {/* Team name + form */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {team.logo && <img src={team.logo} alt={team.short} style={{ width: 28, height: 28, objectFit: "contain" }} />}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600,
              color: "#FFFFFF", marginBottom: 4 }}>
              {team.name}
            </div>
            <FormDots form={team.form} />
          </div>
        </div>

        {/* Points */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700,
            color: team.color, lineHeight: 1 }}>
            {team.pts}
          </div>
          <div style={{ fontSize: 9, color: "#94A3B8",
            textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
            pts
          </div>
        </div>

        {/* Gap */}
        <div style={{ textAlign: "center", minWidth: 44 }}>
          {isFirst
            ? <div style={{ fontSize: 11, fontWeight: 700, color: team.color,
                background: `${team.color}18`, padding: "2px 8px",
                borderRadius: 20, whiteSpace: "nowrap" }}>
                Leader
              </div>
            : <>
                <div style={{ fontSize: 15, fontWeight: 700,
                  color: "#FFFFFF", lineHeight: 1 }}>
                  -{gap}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8",
                  textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
                  gap
                </div>
              </>
          }
        </div>

        {/* Games left */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700,
            color: "#FFFFFF", lineHeight: 1 }}>
            {gl}
          </div>
          <div style={{ fontSize: 9, color: "#94A3B8",
            textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
            left
          </div>
        </div>

        {/* Path badge */}
        <div className="hidden sm:block" style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px",
          borderRadius: 20, whiteSpace: "nowrap",
          background: `${path.color}18`, color: path.color,
          border: `1px solid ${path.color}44` }}>
          {path.icon} {path.label}
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop:
          `0.5px solid ${team.color}22` }}>

          {/* Projection bar */}
          <div style={{ marginBottom: 14, paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "#94A3B8",
                textTransform: "uppercase", letterSpacing: 1 }}>
                Points projection
              </span>
              <span style={{ fontSize: 11, color: "#CBD5E1" }}>
                Current <span style={{ color: team.color, fontWeight: 700 }}>{team.pts}</span>
                {" "}→ Max possible{" "}
                <span style={{ fontWeight: 700, color: "#FFFFFF" }}>
                  {maxP}
                </span>
              </span>
            </div>
            <ProjectionBar team={team} maxPossible={110} />
            <div style={{ display: "flex", justifyContent: "space-between",
              marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>0</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>110</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8, marginBottom: 14 }}>
            {[
              { label: "W",   value: team.w, color: "#22c55e" },
              { label: "D",   value: team.d, color: "#f59e0b" },
              { label: "L",   value: team.l, color: "#ef4444" },
              { label: "GD",  value: team.gd > 0 ? `+${team.gd}` : team.gd,
                color: team.gd > 0 ? "#22c55e" : "#ef4444" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#0F172A",
                borderRadius: "6px", padding: "8px",
                textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: s.color }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8",
                  textTransform: "uppercase", letterSpacing: 1 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Fixture difficulty breakdown */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#94A3B8",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Run-in difficulty — {gl} games left
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {Object.entries(DIFF).map(([k, d]) => {
                const count = team.remaining.filter((f: any) => f.diff === parseInt(k)).length;
                return (
                  <div key={k} style={{ flex: count, background: d.bg,
                    border: `1px solid ${d.color}33`,
                    borderRadius: 4, padding: "4px 8px",
                    display: "flex", alignItems: "center", gap: 6,
                    minWidth: 0, overflow: "hidden" }}>
                    <span style={{ fontSize: 11, fontWeight: 700,
                      color: d.color, whiteSpace: "nowrap" }}>
                      {count} {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <FixturePills remaining={team.remaining} />
          </div>

          {/* Path to title */}
          {!isFirst && (
            <div style={{ marginBottom: 12, padding: "10px 12px",
              background: "#0F172A",
              borderRadius: "6px" }}>
              <div style={{ fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 1.5,
                color: "#94A3B8", marginBottom: 5 }}>
                What they need
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: 12, color: "#CBD5E1" }}>
                    Points needed:{" "}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700,
                    color: team.color }}>
                    {ptsNeeded(team, top)} from {gl} games
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#CBD5E1" }}>
                    Max possible:{" "}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700,
                    color: maxP < top + 6 ? "#ef4444" : "#FFFFFF" }}>
                    {maxP} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Verdict */}
          <div style={{ padding: "10px 12px",
            background: `${team.color}0a`,
            border: `1px solid ${team.color}22`,
            borderRadius: "6px" }}>
            <div style={{ fontSize: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 1.5,
              color: team.color, marginBottom: 4 }}>
              Pitchside verdict
            </div>
            <p style={{ fontSize: 13, color: "#CBD5E1",
              margin: 0, lineHeight: 1.6 }}>
              {team.verdict}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Points needed calculator ──────────────────────────────────────────────────
function Calculator({ teams }: { teams: any[] }) {
  const [wins,   setWins]   = useState(6);
  const [draws,  setDraws]  = useState(1);
  const [losses, setLosses] = useState(1);
  const [club,   setClub]   = useState(teams?.[0]?.id || "arsenal");

  const team    = teams.find(t => t.id === club);
  if (!team) return null;
  const gl      = team.remaining.length;
  const total   = wins + draws + losses;
  const projPts = team.pts + wins * 3 + draws;
  const top     = leader(teams);
  // const wouldWin= projPts > top + 24; // rough check assuming leader wins rest

  return (
    <div style={{ background: "#0F172A",
      border: "0.5px solid #334155",
      borderRadius: "8px", padding: "16px",
      marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: 2, color: "#94A3B8", marginBottom: 14 }}>
        "What if" calculator
      </div>

      {/* Club picker */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14,
        overflowX: "auto", paddingBottom: 4 }}>
        {teams.map(t => (
          <button key={t.id} onClick={() => setClub(t.id)}
            style={{ flexShrink: 0, padding: "5px 12px", fontSize: 11,
              fontWeight: 600, borderRadius: 20, cursor: "pointer",
              background: club === t.id ? t.color : "transparent",
              color: club === t.id ? "#fff" : "#CBD5E1",
              border: `1px solid ${club === t.id ? t.color : "#334155"}` }}>
            {t.short}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
        gap: 10, marginBottom: 14 }}>
        {[
          { label: "Wins",   val: wins,   set: setWins,   color: "#22c55e", max: gl },
          { label: "Draws",  val: draws,  set: setDraws,  color: "#f59e0b", max: gl },
          { label: "Losses", val: losses, set: setLosses, color: "#ef4444", max: gl },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between",
              marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700,
                color: "#FFFFFF" }}>{s.val}</span>
            </div>
            <input type="range" min={0} max={s.max} value={s.val} step={1}
              onChange={e => s.set(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: s.color }} />
          </div>
        ))}
      </div>

      {total !== gl && (
        <div style={{ fontSize: 11, color: "#fef08a",
          background: "#a16207",
          padding: "6px 10px", borderRadius: 6, marginBottom: 10 }}>
          {total}/{gl} games assigned — adjust to match games remaining
        </div>
      )}

      {/* Result */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10 }}>
        <div style={{ background: "#1E293B",
          border: "0.5px solid #334155",
          borderRadius: "6px", padding: "12px",
          textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700,
            color: teams.find(t=>t.id===club)?.color }}>
            {projPts}
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8",
            textTransform: "uppercase", letterSpacing: 1 }}>
            Projected pts
          </div>
        </div>
        <div style={{ background: "#1E293B",
          border: "0.5px solid #334155",
          borderRadius: "6px", padding: "12px",
          textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: "#CBD5E1",
            lineHeight: 1.5, marginTop: 4 }}>
            {total !== gl
              ? "Assign all remaining games"
              : projPts >= 86
              ? "💚 Strong title haul"
              : projPts >= 78
              ? "🟡 Might not be enough"
              : "🔴 Probably not enough"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TitleRaceTracker() {
  const [activeLeague, setActiveLeague] = useState("premier-league");
  const { data, isLoading, error } = useTitleRace(activeLeague, 60000);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [showCalc,    setShowCalc]    = useState(false);
  const [activeView,  setActiveView]  = useState("tracker"); // tracker | table

  if (error) return null;
  if (isLoading || !data) {
    return (
      <div className="bg-[#09090B] rounded-2xl p-6 mb-8 border border-gray-800 animate-pulse w-full max-w-[680px] mx-auto">
        <div className="h-6 w-1/2 bg-[#18181B] rounded mb-6"></div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-[#1E293B] rounded-lg"></div>
            ))}
        </div>
      </div>
    );
  }

  // Merge dynamic styles
  const teams = data.teams.map(t => ({
    ...t,
    bg: t.color ? `${t.color}15` : "#C8FF0015"
  }));

  const sorted = [...teams].sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts : b.gd - a.gd
  );

  const top = leader(sorted);
  
  const totalGW = 38;
  const currentGW = teams.length > 0 ? Math.max(...teams.map(t => t.played), 0) : 0;
  
  // Format Date from data.updatedAt
  const formattedDate = data.updatedAt ? new Date(data.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const LAST_UPDATED = `GW${currentGW} — ${formattedDate}`;

  const leagueNames: Record<string, string> = {
    "premier-league": "Premier League",
    "la-liga": "La Liga",
    "serie-a": "Serie A"
  };

  return (
    <div className="bg-[#09090B] p-4 rounded-xl border border-gray-800 shadow-xl" style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem",
      fontFamily: "var(--font-sans)" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        
        {/* League Switcher */}
        <div className="hide-scrollbar" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {Object.entries(leagueNames).map(([id, label]) => (
            <button key={id} onClick={() => setActiveLeague(id)}
              style={{ flexShrink: 0, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                background: activeLeague === id ? "#C8FF00" : "#1E293B",
                color: activeLeague === id ? "#000000" : "#94A3B8",
                border: "none", borderRadius: 20, cursor: "pointer", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              marginBottom: 4 }}>
              <span className="text-white bg-[#C8FF00]/10 text-[#C8FF00] p-1 rounded font-bold text-xs uppercase tracking-widest shadow-[0_0_10px_#C8FF0044]">Live</span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0,
                color: "#FFFFFF", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
                {leagueNames[activeLeague]} Title Race
              </h2>
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              {totalGW - currentGW} gameweeks remaining ·{" "}
              Updated {LAST_UPDATED}
            </div>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", border: "0.5px solid #334155",
            borderRadius: "6px", overflow: "hidden" }}>
            {[["tracker","Tracker"],["table","Table"]].map(([v,l]) => (
              <button key={v} onClick={() => setActiveView(v)}
                style={{ padding: "6px 14px", fontSize: 11, fontWeight: 500,
                  background: activeView === v
                    ? "#1E293B" : "transparent",
                  color: activeView === v
                    ? "#FFFFFF" : "#94A3B8",
                  border: "none", cursor: "pointer",
                  borderRight: v === "tracker"
                    ? "0.5px solid #334155" : "none" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Points gap strip */}
        <div className="hide-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto",
          paddingBottom: 2 }}>
          {sorted.map((t, i) => (
            <div key={t.id} style={{ flexShrink: 0, padding: "6px 12px",
              background: "#0F172A",
              border: `0.5px solid ${t.color}33`,
              borderRadius: "6px",
              borderTop: `2px solid ${t.color}` }}>
              <div style={{ fontSize: 10, color: "#94A3B8",
                marginBottom: 2 }}>{t.short}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.color }}>
                {t.pts}
              </div>
              {i > 0 && (
                <div style={{ fontSize: 9, color: "#94A3B8" }}>
                  -{top - t.pts}
                </div>
              )}
            </div>
          ))}
          <div style={{ flexShrink: 0, padding: "6px 12px",
            background: "#0F172A",
            border: "0.5px solid #334155",
            borderRadius: "6px" }}>
            <div style={{ fontSize: 10, color: "#94A3B8",
              marginBottom: 2 }}>GW</div>
            <div style={{ fontSize: 14, fontWeight: 700,
              color: "#FFFFFF" }}>
              {currentGW}
            </div>
            <div style={{ fontSize: 9, color: "#94A3B8" }}>
              of {totalGW}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tracker view ── */}
      {activeView === "tracker" && (
        <>
          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12,
            flexWrap: "wrap" }}>
            {Object.entries(DIFF).map(([k, d]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2,
                  background: d.bg, border: `1px solid ${d.color}55` }} />
                <span style={{ fontSize: 11, color: "#94A3B8" }}>
                  {d.label} fixture
                </span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>@ = Away</div>
            </div>
          </div>

          {/* Team cards */}
          {sorted.map((team, i) => (
            <TeamCard
              key={team.id}
              team={team}
              teams={teams}
              position={i + 1}
              expanded={expanded === team.id || (!expanded && i === 0)}
              onToggle={() =>
                setExpanded(expanded === team.id ? null : team.id)
              }
            />
          ))}

          {/* Calculator toggle */}
          <button onClick={() => setShowCalc(!showCalc)}
            className="hover:bg-[#1E293B]"
            style={{ width: "100%", fontSize: 12, padding: "9px",
              marginTop: 4, borderRadius: 6, color: "#94A3B8", border: 'none', background: 'transparent', cursor: 'pointer' }}>
            {showCalc ? "Hide" : "Open"} "what if" calculator →
          </button>

          {showCalc && <Calculator teams={teams} />}
        </>
      )}

      {/* ── Table view ── */}
      {activeView === "table" && (
        <div style={{ border: "0.5px solid #334155",
          borderRadius: "8px", overflow: "hidden" }}>
          <div className="hide-scrollbar" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse",
              fontSize: 13, color: '#f1f5f9' }}>
              <thead>
                <tr style={{ background: "#0F172A",
                  borderBottom: "0.5px solid #334155" }}>
                  {["#","Club","P","W","D","L","GD","Pts","Form","Left"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 12px", textAlign: i < 2 ? "left" : "center",
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: 1.5, color: "#94A3B8",
                      whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom: "0.5px solid #334155",
                      background: i % 2 === 0 ? "transparent" : "#0F172A" }}>
                    <td style={{ padding: "12px 12px", fontWeight: 700,
                      color: "#94A3B8", fontSize: 12 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {t.logo ? (
                          <img src={t.logo} alt={t.short} style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 4, height: 20, borderRadius: 2,
                            background: t.color || "#C8FF00", flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: 600,
                          color: "#FFFFFF" }}>
                          {t.name}
                        </span>
                      </div>
                    </td>
                    {[t.played, t.w, t.d, t.l].map((v, j) => (
                      <td key={j} style={{ padding: "12px 12px",
                        textAlign: "center", color: "#CBD5E1" }}>
                        {v}
                      </td>
                    ))}
                    <td style={{ padding: "12px 12px", textAlign: "center",
                      fontWeight: 600,
                      color: t.gd > 0 ? "#22c55e" : (t.gd < 0 ? "#ef4444" : "#94A3B8") }}>
                      {t.gd > 0 ? `+${t.gd}` : t.gd}
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center",
                      fontSize: 16, fontWeight: 700, color: t.color || "#C8FF00" }}>
                      {t.pts}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <FormDots form={t.form} />
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center",
                      fontWeight: 600, color: "#FFFFFF" }}>
                      {t.remaining.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>
          Click any team to expand
        </span>
        <span style={{ fontSize: 11, color: "#94A3B8",
          fontStyle: "italic" }}>
          The Touchline Dribble
        </span>
      </div>
    </div>
  );
}
