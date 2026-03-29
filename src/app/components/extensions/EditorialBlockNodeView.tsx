import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useCallback } from "react";
import type { EditorialBlockKind } from "./EditorialBlockExtension";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function parseItems(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stringifyItems(items: string[]): string {
  return JSON.stringify(items);
}

const KIND_META: Record<EditorialBlockKind, { label: string; color: string; icon: string }> = {
  "timeline":          { label: "Timeline",        color: "#16A34A", icon: "⏱" },
  "stats-card":        { label: "Stats Card",       color: "#0F172A", icon: "📊" },
  "quote-block":       { label: "Quote Block",      color: "#16A34A", icon: "💬" },
  "key-takeaways":     { label: "Key Takeaways",    color: "#0F172A", icon: "✅" },
  "comparison-table":  { label: "Comparison Table", color: "#16A34A", icon: "⚖️" },
  "tactical-board":    { label: "Tactical Board",   color: "#0F172A", icon: "🎯" },
  "match-center":      { label: "Match Center",     color: "#0F172A", icon: "🏟️" },
};

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[#0F172A] text-sm " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/40 focus:border-[#16A34A] transition-all";

const textareaCls = inputCls + " resize-none font-mono leading-6";

/* ─── mini preview components ──────────────────────────────────────────────── */

function TimelinePreview({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.99))", padding: 20, marginBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 5, height: 22, borderRadius: 99, background: "#16A34A", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#16A34A" }}>Timeline</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#0F172A" }}>{title || "Timeline"}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.slice(0, 4).map((row, i) => {
          const [label, title2, note] = row.split("|").map(s => s.trim());
          return (
            <div key={i} style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", padding: "10px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#16A34A" }}>{label || "—"}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 3 }}>{title2 || "—"}</div>
              {note && <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{note}</div>}
            </div>
          );
        })}
        {items.length > 4 && <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center" }}>+ {items.length - 4} more steps</div>}
      </div>
    </div>
  );
}

function StatsCardPreview({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ borderRadius: 24, background: "#0F172A", padding: 20, color: "#fff" }}>
      <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#4ade80" }}>Stats Card</div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", marginTop: 4 }}>{title || "Stats Card"}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: 8, marginTop: 12 }}>
        {items.slice(0, 3).map((row, i) => {
          const [label, value, hint] = row.split("|").map(s => s.trim());
          return (
            <div key={i} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94A3B8" }}>{label || "—"}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 4 }}>{value || "—"}</div>
              {hint && <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{hint}</div>}
            </div>
          );
        })}
      </div>
      {items.length > 3 && (
        <div style={{ fontSize: 11, color: "#4ade80", marginTop: 8 }}>+ {items.length - 3} more metrics</div>
      )}
    </div>
  );
}

function QuoteBlockPreview({ quote, attribution, role }: { quote: string; attribution: string; role: string }) {
  return (
    <div style={{ borderRadius: 24, border: "1px solid rgba(22,163,74,0.2)", background: "rgba(22,163,74,0.06)", padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#16A34A" }}>Quote Block</div>
      <blockquote style={{ margin: "12px 0 0", padding: 0, border: "none", fontSize: 18, fontWeight: 900, lineHeight: 1.35, color: "#0F172A" }}>
        "{quote || "Add your quote here…"}"
      </blockquote>
      {(attribution || role) && (
        <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 10 }}>
          {attribution}{attribution && role ? " · " : ""}{role}
        </p>
      )}
    </div>
  );
}

function KeyTakeawaysPreview({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ borderRadius: 24, background: "linear-gradient(135deg,#0f172a,#111f35)", padding: 20, color: "#fff" }}>
      <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#4ade80" }}>Key Takeaways</div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", marginTop: 4 }}>{title || "Key Takeaways"}</div>
      <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.slice(0, 4).map((item, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "8px 12px" }}>
            <span style={{ marginTop: 5, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0, display: "block" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>{item.replace(/^[-*]\s*/, "")}</span>
          </li>
        ))}
        {items.length > 4 && <div style={{ fontSize: 11, color: "#4ade80", paddingLeft: 18 }}>+ {items.length - 4} more</div>}
      </ul>
    </div>
  );
}

function ComparisonTablePreview({ title, columns, items }: { title: string; columns: string; items: string[] }) {
  const cols = columns ? columns.split("|").map(s => s.trim()) : ["Metric", "Option A", "Option B"];
  return (
    <div style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#fff", padding: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#16A34A" }}>Comparison Table</div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>{title || "Comparison Table"}</div>
      <div style={{ marginTop: 12, overflowX: "auto", borderRadius: 14, border: "1px solid #f1f5f9" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#F8FAFC" }}>
            <tr>
              {cols.map((col, i) => (
                <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: "#94A3B8" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 4).map((row, i) => {
              const cells = row.split("|").map(s => s.trim());
              while (cells.length < cols.length) cells.push("—");
              return (
                <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                  {cells.slice(0, cols.length).map((cell, j) => (
                    <td key={j} style={{ padding: "8px 12px", color: j === 0 ? "#0F172A" : "#475569", fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                  ))}
                </tr>
              );
            })}
            {items.length > 4 && (
              <tr><td colSpan={cols.length} style={{ padding: "6px 12px", fontSize: 11, color: "#94A3B8" }}>+ {items.length - 4} more rows</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TacticalBoardPreview({ title, description, blockId }: { title: string; description: string; blockId: string }) {
  return (
    <div style={{ borderRadius: 24, background: "linear-gradient(180deg,#0f172a,#111f35)", padding: 20, color: "#fff" }}>
      <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#4ade80" }}>🎯 Tactical Board Embed</div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", marginTop: 4 }}>{title || "Tactical Board"}</div>
      {description && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 6, lineHeight: 1.5 }}>{description}</div>}
      <div style={{ marginTop: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", padding: 20, textAlign: "center" }}>
        {blockId ? (
          <>
            <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>⚽ Sequence: {blockId}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>The tactical animation will load when published</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No sequence ID set yet</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Click "Edit" to paste a tactical board sequence ID</div>
          </>
        )}
      </div>
    </div>
  );
}

function MatchCenterPreview({ blockId }: { blockId: string }) {
  return (
    <div style={{ borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.18em", color: "#16A34A", marginBottom: 8 }}>🏟️ Stadium Match Center</div>
      {blockId ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Match ID: {blockId}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Live match center will load when published</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>No match ID set</div>
          <div style={{ fontSize: 11, color: "#CBD5E1", marginTop: 4 }}>Click "Edit" to add a match ID</div>
        </>
      )}
    </div>
  );
}

/* ─── edit forms ────────────────────────────────────────────────────────────── */

function EditFormTimeline({
  title, items, onUpdate,
}: { title: string; items: string[]; onUpdate: (d: Record<string, string>) => void }) {
  const rowsText = items.join("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input className={inputCls} value={title} onChange={e => onUpdate({ title: e.target.value })} placeholder="How the match turned" />
      </div>
      <div>
        <label style={labelStyle}>Steps — one per line: <code style={{ fontSize: 11 }}>time | event | note (optional)</code></label>
        <textarea className={textareaCls} rows={5} value={rowsText}
          onChange={e => onUpdate({ items: stringifyItems(e.target.value.split("\n")) })}
          placeholder={"12' | Early overload | Built access down the right\n37' | Midfield reset | Control improved\n61' | Double substitution | Tempo lift changed the game"} />
      </div>
    </div>
  );
}

function EditFormStatsCard({
  title, items, onUpdate,
}: { title: string; items: string[]; onUpdate: (d: Record<string, string>) => void }) {
  const rowsText = items.join("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input className={inputCls} value={title} onChange={e => onUpdate({ title: e.target.value })} placeholder="Match Snapshot" />
      </div>
      <div>
        <label style={labelStyle}>Metrics — one per line: <code style={{ fontSize: 11 }}>label | value | hint (optional)</code></label>
        <textarea className={textareaCls} rows={4} value={rowsText}
          onChange={e => onUpdate({ items: stringifyItems(e.target.value.split("\n")) })}
          placeholder={"Possession | 61% | Territory tilted after min 20\nShots | 14 | Sustained pressure from zone 14\nPPDA | 8.4 | Press stayed live"} />
      </div>
    </div>
  );
}

function EditFormQuoteBlock({
  quote, attribution, role, onUpdate,
}: { quote: string; attribution: string; role: string; onUpdate: (d: Record<string, string>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Quote</label>
        <textarea className={textareaCls} rows={3} value={quote}
          onChange={e => onUpdate({ quote: e.target.value })}
          placeholder="We had to find a different angle into midfield." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={labelStyle}>Attribution (name)</label>
          <input className={inputCls} value={attribution} onChange={e => onUpdate({ attribution: e.target.value })} placeholder="Manager Name" />
        </div>
        <div>
          <label style={labelStyle}>Role / title</label>
          <input className={inputCls} value={role} onChange={e => onUpdate({ role: e.target.value })} placeholder="Head coach" />
        </div>
      </div>
    </div>
  );
}

function EditFormKeyTakeaways({
  title, items, onUpdate,
}: { title: string; items: string[]; onUpdate: (d: Record<string, string>) => void }) {
  const rowsText = items.join("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input className={inputCls} value={title} onChange={e => onUpdate({ title: e.target.value })} placeholder="Key Takeaways" />
      </div>
      <div>
        <label style={labelStyle}>Bullet points — one per line</label>
        <textarea className={textareaCls} rows={5} value={rowsText}
          onChange={e => onUpdate({ items: stringifyItems(e.target.value.split("\n")) })}
          placeholder={"The press worked because distances stayed short.\nThe bench changed rhythm, not just personnel.\nTerritory mattered more than raw possession."} />
      </div>
    </div>
  );
}

function EditFormComparisonTable({
  title, columns, items, onUpdate,
}: { title: string; columns: string; items: string[]; onUpdate: (d: Record<string, string>) => void }) {
  const rowsText = items.join("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input className={inputCls} value={title} onChange={e => onUpdate({ title: e.target.value })} placeholder="Before and After" />
      </div>
      <div>
        <label style={labelStyle}>Column headers — pipe-separated: <code style={{ fontSize: 11 }}>Metric|First Half|Second Half</code></label>
        <input className={inputCls} value={columns} onChange={e => onUpdate({ columns: e.target.value })} placeholder="Metric|First Half|Second Half" />
      </div>
      <div>
        <label style={labelStyle}>Rows — one per line: <code style={{ fontSize: 11 }}>Metric name | Value 1 | Value 2</code></label>
        <textarea className={textareaCls} rows={5} value={rowsText}
          onChange={e => onUpdate({ items: stringifyItems(e.target.value.split("\n")) })}
          placeholder={"Touches in box | 5 | 13\nProgressive passes | 17 | 28\nShots | 4 | 10"} />
      </div>
    </div>
  );
}

function EditFormTacticalBoard({
  title, description, blockId, onUpdate,
}: { title: string; description: string; blockId: string; onUpdate: (d: Record<string, string>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={labelStyle}>Sequence ID <span style={{ color: "#94A3B8", fontWeight: 400 }}>(copy from Tactical Board tool)</span></label>
        <input className={inputCls} value={blockId} onChange={e => onUpdate({ blockId: e.target.value })}
          placeholder="e.g. tb_a8f3d2c1" />
      </div>
      <div>
        <label style={labelStyle}>Title</label>
        <input className={inputCls} value={title} onChange={e => onUpdate({ title: e.target.value })} placeholder="Pressing trap sequence" />
      </div>
      <div>
        <label style={labelStyle}>Description <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span></label>
        <textarea className={textareaCls} rows={2} value={description}
          onChange={e => onUpdate({ description: e.target.value })}
          placeholder="Brief context for this tactical sequence." />
      </div>
    </div>
  );
}

function EditFormMatchCenter({
  blockId, onUpdate,
}: { blockId: string; onUpdate: (d: Record<string, string>) => void }) {
  return (
    <div>
      <label style={labelStyle}>Match ID</label>
      <input className={inputCls} value={blockId} onChange={e => onUpdate({ blockId: e.target.value })} placeholder="match-id-here" />
      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>Paste the Stadium Match Center match ID from the admin panel.</p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748B",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 5,
};

/* ─── main node view component ─────────────────────────────────────────────── */

export function EditorialBlockNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const kind = node.attrs.kind as EditorialBlockKind;
  const meta = KIND_META[kind] || { label: kind, color: "#16A34A", icon: "✦" };

  const { title, items: itemsRaw, columns, quote, attribution, role, blockId, description } = node.attrs;
  const items = parseItems(itemsRaw);

  const handleUpdate = useCallback((data: Record<string, string>) => {
    updateAttributes(data);
  }, [updateAttributes]);

  const renderPreview = () => {
    switch (kind) {
      case "timeline":         return <TimelinePreview title={title} items={items} />;
      case "stats-card":       return <StatsCardPreview title={title} items={items} />;
      case "quote-block":      return <QuoteBlockPreview quote={quote} attribution={attribution} role={role} />;
      case "key-takeaways":    return <KeyTakeawaysPreview title={title} items={items} />;
      case "comparison-table": return <ComparisonTablePreview title={title} columns={columns} items={items} />;
      case "tactical-board":   return <TacticalBoardPreview title={title} description={description} blockId={blockId} />;
      case "match-center":     return <MatchCenterPreview blockId={blockId} />;
      default:                 return null;
    }
  };

  const renderEditForm = () => {
    switch (kind) {
      case "timeline":         return <EditFormTimeline title={title} items={items} onUpdate={handleUpdate} />;
      case "stats-card":       return <EditFormStatsCard title={title} items={items} onUpdate={handleUpdate} />;
      case "quote-block":      return <EditFormQuoteBlock quote={quote} attribution={attribution} role={role} onUpdate={handleUpdate} />;
      case "key-takeaways":    return <EditFormKeyTakeaways title={title} items={items} onUpdate={handleUpdate} />;
      case "comparison-table": return <EditFormComparisonTable title={title} columns={columns} items={items} onUpdate={handleUpdate} />;
      case "tactical-board":   return <EditFormTacticalBoard title={title} description={description} blockId={blockId} onUpdate={handleUpdate} />;
      case "match-center":     return <EditFormMatchCenter blockId={blockId} onUpdate={handleUpdate} />;
      default:                 return null;
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      style={{ userSelect: "none", margin: "20px 0" }}
      contentEditable={false}
    >
      {/* header bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: isEditing ? "16px 16px 0 0" : 16,
        padding: "8px 14px",
        borderBottom: isEditing ? "1px solid transparent" : undefined,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{meta.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: meta.color }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 10, color: "#94A3B8", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "1px 7px" }}>
            Editorial Block
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              border: `1px solid ${isEditing ? "#16A34A" : "#E2E8F0"}`,
              background: isEditing ? "#16A34A" : "#fff",
              color: isEditing ? "#fff" : "#475569",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseDown={e => { e.preventDefault(); setIsEditing(v => !v); }}
          >
            {isEditing ? "▼ Done" : "✏ Edit"}
          </button>
          <button
            type="button"
            title="Remove block"
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid #FEE2E2",
              background: "#FFF5F5",
              color: "#EF4444",
              fontSize: 12,
              cursor: "pointer",
            }}
            onMouseDown={e => { e.preventDefault(); deleteNode(); }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* edit form */}
      {isEditing && (
        <div style={{
          border: "1px solid #E2E8F0",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          padding: 16,
          background: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {renderEditForm()}
          <button
            type="button"
            style={{
              alignSelf: "flex-end",
              padding: "6px 18px",
              borderRadius: 10,
              border: "none",
              background: "#16A34A",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onMouseDown={e => { e.preventDefault(); setIsEditing(false); }}
          >
            ✓ Done editing
          </button>
        </div>
      )}

      {/* visual preview */}
      <div style={{ marginTop: isEditing ? 12 : 0 }}>
        {renderPreview()}
      </div>
    </NodeViewWrapper>
  );
}
