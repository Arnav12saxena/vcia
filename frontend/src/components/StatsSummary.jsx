import { MoodBadge } from "./Palette";

export default function StatsSummary({ metadata, frames, scenes }) {
  if (!metadata) return null;

  // Overall mood distribution
  const moodCounts = {};
  frames?.forEach((f) => {
    moodCounts[f.mood] = (moodCounts[f.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

  // Global palette: merge top colors from all scenes
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
    <div style={styles.wrapper}>
      {/* Stats row */}
      <div style={styles.statsRow}>
        <Stat label="Duration" value={metadata.duration_formatted} />
        <Stat label="Resolution" value={`${metadata.width}×${metadata.height}`} />
        <Stat label="FPS" value={metadata.fps} />
        <Stat label="Frames analyzed" value={frames?.length || 0} />
        <Stat label="Scenes" value={scenes?.length || 0} />
        <Stat label="Dominant mood" value={<MoodBadge mood={dominantMood} />} />
      </div>

      {/* Global palette strip */}
      {globalPalette.length > 0 && (
        <div style={styles.paletteSection}>
          <div style={styles.palLabel}>Global Color Palette</div>
          <div style={styles.paletteStrip}>
            {globalPalette.map((hex, i) => (
              <div
                key={i}
                style={{ flex: 1, background: hex, minWidth: 0 }}
                title={hex}
              />
            ))}
          </div>
          <div style={styles.hexList}>
            {globalPalette.map((hex, i) => (
              <span key={i} style={styles.hexTag}>{hex}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  wrapper: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 12,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  statLabel: {
    fontFamily: "var(--font-display)",
    fontSize: 9,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  statValue: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  paletteSection: { display: "flex", flexDirection: "column", gap: 8 },
  palLabel: {
    fontFamily: "var(--font-display)",
    fontSize: 10,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  paletteStrip: {
    display: "flex",
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--border)",
  },
  hexList: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  hexTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-secondary)",
    background: "var(--bg-elevated)",
    padding: "2px 6px",
    borderRadius: 4,
    border: "1px solid var(--border)",
  },
};
