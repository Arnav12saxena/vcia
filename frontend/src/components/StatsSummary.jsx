import { MoodBadge } from "./Palette";

export default function StatsSummary({ metadata, frames, scenes }) {
  if (!metadata) return null;

  const moodCounts = {};
  frames?.forEach((f) => {
    moodCounts[f.mood] = (moodCounts[f.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

  const colorFreq = {};
  scenes?.forEach((s) => {
    s.palette?.forEach((c) => {
      colorFreq[c.hex] = (colorFreq[c.hex] || 0) + c.percentage;
    });
  });
  const globalPalette = Object.entries(colorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);

  return (
    <div style={S.wrapper}>
      {/* Stats grid — auto-fills, wraps on mobile */}
      <div style={S.grid}>
        <Stat label="Duration"     value={metadata.duration_formatted} />
        <Stat label="Resolution"   value={`${metadata.width}×${metadata.height}`} />
        <Stat label="FPS"          value={metadata.fps} />
        <Stat label="Frames"       value={frames?.length || 0} />
        <Stat label="Scenes"       value={scenes?.length || 0} />
        <Stat label="Mood"         value={<MoodBadge mood={dominantMood} />} />
      </div>

      {/* Global palette */}
      {globalPalette.length > 0 && (
        <div style={S.paletteSection}>
          <div style={S.palLabel} className="section-eyebrow">Global Palette</div>

          {/* Color strip */}
          <div style={S.strip}>
            {globalPalette.map((hex, i) => (
              <div
                key={i}
                style={{ flex: 1, background: hex }}
                title={hex}
              />
            ))}
          </div>

          {/* Hex tags — horizontal scroll on mobile */}
          <div style={S.hexScroll}>
            <div style={S.hexList}>
              {globalPalette.map((hex, i) => (
                <HexTag key={i} hex={hex} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel} className="section-eyebrow">{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

function HexTag({ hex }) {
  const copy = () => navigator.clipboard?.writeText(hex);
  return (
    <button
      style={S.hexTag}
      onClick={copy}
      title={`Copy ${hex}`}
      aria-label={`Copy color ${hex}`}
    >
      <span
        style={{ width: 8, height: 8, borderRadius: 2, background: hex, flexShrink: 0 }}
      />
      {hex}
    </button>
  );
}

const S = {
  wrapper: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  /* Auto-fill grid: 3 columns on mobile, more on wider screens */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px 12px",
  },

  stat: { display: "flex", flexDirection: "column", gap: 3 },
  statLabel: {
    fontSize: 9, letterSpacing: "0.08em",
    color: "var(--text-muted)", textTransform: "uppercase",
  },
  statValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "clamp(11px, 2.5vw, 13px)",
    fontWeight: 600,
    color: "var(--text-primary)",
    wordBreak: "break-word",
  },

  paletteSection: { display: "flex", flexDirection: "column", gap: 8 },
  palLabel: { marginBottom: 2 },
  strip: {
    display: "flex",
    height: 28,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--border)",
  },

  /* Horizontal scroll container for hex tags on mobile */
  hexScroll: {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    WebkitOverflowScrolling: "touch",
    marginLeft: -2,
    marginRight: -2,
    paddingLeft: 2,
    paddingRight: 2,
  },
  hexList: {
    display: "flex",
    gap: 5,
    paddingBottom: 2,
    width: "max-content",
  },
  hexTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-secondary)",
    background: "var(--bg-elevated)",
    padding: "4px 8px",
    borderRadius: 4,
    border: "1px solid var(--border)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    minHeight: 28,
    transition: "border-color 0.15s",
  },
};
