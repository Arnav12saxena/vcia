import { useState } from "react";

/* ── ColorSwatch ──────────────────────────────────────────────── */
export function ColorSwatch({ color, size = 36, showLabel = true }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      style={S.swatch}
      title={`${color.hex} — tap to copy`}
      aria-label={`Color ${color.hex}${color.percentage != null ? `, ${color.percentage.toFixed(1)}%` : ""}. Tap to copy.`}
      onClick={copy}
    >
      <span
        style={{
          ...S.chip,
          width: size,
          height: size,
          background: color.hex,
        }}
        aria-hidden
      >
        {copied && <span style={S.check} aria-hidden>✓</span>}
      </span>
      {showLabel && (
        <span style={S.label} aria-hidden>
          <span style={S.hex}>{color.hex}</span>
          {color.percentage != null && (
            <span style={S.pct}>{color.percentage.toFixed(1)}%</span>
          )}
        </span>
      )}
    </button>
  );
}

/* ── PaletteStrip ─────────────────────────────────────────────── */
export function PaletteStrip({ colors, height = 12 }) {
  const total = colors.reduce((s, c) => s + (c.percentage || 1), 0);
  return (
    <div
      style={{ display:"flex", height, borderRadius:5, overflow:"hidden" }}
      role="img"
      aria-label={`Color palette: ${colors.slice(0,5).map(c=>c.hex).join(", ")}`}
    >
      {colors.map((c, i) => (
        <div
          key={i}
          style={{ flex: (c.percentage || 1) / total, background: c.hex }}
          title={`${c.hex}${c.percentage != null ? ` ${c.percentage.toFixed(1)}%` : ""}`}
        />
      ))}
    </div>
  );
}

/* ── PaletteRow ───────────────────────────────────────────────── */
export function PaletteRow({ colors, size = 30 }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c} size={size} showLabel={false} />
      ))}
    </div>
  );
}

/* ── FullPalette ──────────────────────────────────────────────── */
export function FullPalette({ colors }) {
  return (
    <div style={S.fullGrid}>
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c} size={32} showLabel />
      ))}
    </div>
  );
}

/* ── MoodBadge ────────────────────────────────────────────────── */
const MOOD_ICONS = {
  warm:     "🔥",
  cool:     "❄️",
  cinematic:"🎬",
  vibrant:  "✨",
  muted:    "🌫",
  neutral:  "⚪",
};

export function MoodBadge({ mood }) {
  return (
    <span style={S.moodBadge} aria-label={`Mood: ${mood}`}>
      <span aria-hidden>{MOOD_ICONS[mood] || "⚪"}</span>
      {" "}{mood}
    </span>
  );
}

/* ── Styles ───────────────────────────────────────────────────── */
const S = {
  swatch: {
    display:"flex", flexDirection:"column", alignItems:"center", gap:4,
    background:"none", border:"none", cursor:"pointer",
    padding:"4px 2px",
    minWidth: 44,
    minHeight: 44,
  },
  chip: {
    borderRadius: 8,
    flexShrink: 0,
    display:"flex", alignItems:"center", justifyContent:"center",
    border:"1px solid rgba(255,255,255,0.1)",
    transition:"transform 0.15s",
  },
  check: { color:"#fff", fontSize:14, textShadow:"0 1px 3px rgba(0,0,0,0.8)" },
  label: { display:"flex", flexDirection:"column", alignItems:"center", gap:1 },
  hex:   { fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-secondary)" },
  pct:   { fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)" },

  fullGrid: {
    display:"flex", gap:8, flexWrap:"wrap",
  },

  moodBadge: {
    display:"inline-flex", alignItems:"center", gap:3,
    padding:"3px 8px",
    background:"var(--bg-elevated)",
    border:"1px solid var(--border)",
    borderRadius:99,
    fontSize:"clamp(9px, 2vw, 10px)",
    color:"var(--text-secondary)",
    fontFamily:"var(--font-mono)",
    textTransform:"capitalize",
    whiteSpace:"nowrap",
  },
};
