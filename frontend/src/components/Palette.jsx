import { useState } from "react";

export function ColorSwatch({ color, size = 40, showLabel = true }) {
  const [copied, setCopied] = useState(false);

  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(color.hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div style={{ ...styles.swatch, cursor: "pointer" }} title={`${color.hex} — click to copy`} onClick={copy}>
      <div
        style={{
          ...styles.chip,
          width: size,
          height: size,
          background: color.hex,
          boxShadow: `0 4px 12px ${color.hex}44`,
        }}
      >
        {copied && <span style={styles.checkmark}>✓</span>}
      </div>
      {showLabel && (
        <div style={styles.label}>
          <span style={styles.hex}>{color.hex}</span>
          {color.percentage != null && (
            <span style={styles.pct}>{color.percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
    </div>
  );
}

export function PaletteStrip({ colors, height = 12 }) {
  const total = colors.reduce((s, c) => s + (c.percentage || 1), 0);
  return (
    <div style={{ display: "flex", height, borderRadius: 6, overflow: "hidden" }}>
      {colors.map((c, i) => (
        <div
          key={i}
          style={{
            flex: (c.percentage || 1) / total,
            background: c.hex,
            transition: "flex 0.3s",
          }}
          title={`${c.hex} ${c.percentage ? c.percentage.toFixed(1) + "%" : ""}`}
        />
      ))}
    </div>
  );
}

export function PaletteRow({ colors, size = 32 }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c} size={size} showLabel={false} />
      ))}
    </div>
  );
}

export function FullPalette({ colors }) {
  return (
    <div style={styles.fullPalette}>
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c} size={36} showLabel={true} />
      ))}
    </div>
  );
}

const MOOD_ICONS = {
  warm: "🔥", cool: "❄️", cinematic: "🎬", vibrant: "✨",
  muted: "🌫", neutral: "⚪",
};

export function MoodBadge({ mood }) {
  return (
    <span style={styles.moodBadge}>
      {MOOD_ICONS[mood] || "⚪"} {mood}
    </span>
  );
}

const styles = {
  swatch: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  chip: {
    borderRadius: 8,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "transform 0.15s",
  },
  checkmark: { color: "#fff", fontSize: 14, textShadow: "0 1px 3px rgba(0,0,0,0.8)" },
  label: { textAlign: "center" },
  hex: { display: "block", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" },
  pct: { display: "block", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" },
  fullPalette: { display: "flex", gap: 10, flexWrap: "wrap" },
  moodBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 99,
    fontSize: 10,
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    textTransform: "capitalize",
  },
};
