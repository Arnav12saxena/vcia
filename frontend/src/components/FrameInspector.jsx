import { FullPalette, MoodBadge, PaletteStrip } from "./Palette";

export default function FrameInspector({ frame }) {
  if (!frame) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>⊹</div>
        <div>Hover or click a frame on the timeline to inspect</div>
      </div>
    );
  }

  const { dominant_colors, average_color, histogram, mood, timestamp_formatted, frame_number } = frame;

  return (
    <div style={styles.wrapper} className="fade-up">
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.frameLabel}>Frame #{frame_number}</span>
          <span style={styles.timestamp}>{timestamp_formatted}</span>
          <MoodBadge mood={mood} />
        </div>
        <div
          style={{
            ...styles.avgDot,
            background: average_color?.hex,
            boxShadow: `0 0 12px ${average_color?.hex}88`,
          }}
          title={`Average: ${average_color?.hex}`}
        />
      </div>

      {/* Thumbnail + palette strip */}
      {frame.thumbnail && (
        <img
          src={`data:image/jpeg;base64,${frame.thumbnail}`}
          style={styles.thumb}
          alt={`Frame ${frame_number}`}
        />
      )}

      {dominant_colors?.length > 0 && (
        <>
          <PaletteStrip colors={dominant_colors} height={10} />
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Dominant Colors</div>
            <FullPalette colors={dominant_colors} />
          </div>
        </>
      )}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Average Color</div>
        <div style={styles.avgRow}>
          <div style={{ ...styles.avgChip, background: average_color?.hex }} />
          <span style={styles.avgHex}>{average_color?.hex}</span>
          <span style={styles.avgRgb}>
            rgb({average_color?.rgb?.r}, {average_color?.rgb?.g}, {average_color?.rgb?.b})
          </span>
        </div>
      </div>

      {histogram && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Color Histogram</div>
          <HistogramViz histogram={histogram} />
        </div>
      )}
    </div>
  );
}

function HistogramViz({ histogram }) {
  const channels = [
    { key: "r", color: "#fc5c7c", label: "R" },
    { key: "g", color: "#5cfc8c", label: "G" },
    { key: "b", color: "#5cb8fc", label: "B" },
  ];

  return (
    <div style={styles.histWrapper}>
      {channels.map(({ key, color, label }) => {
        const data = histogram[key] || [];
        const max = Math.max(...data, 0.001);
        return (
          <div key={key} style={styles.histChannel}>
            <span style={{ ...styles.histLabel, color }}>{label}</span>
            <div style={styles.histBars}>
              {data.map((val, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.histBar,
                    height: `${(val / max) * 100}%`,
                    background: color,
                    opacity: 0.4 + (val / max) * 0.6,
                  }}
                  title={`Bin ${i * 32}–${(i + 1) * 32}: ${(val * 100).toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "var(--text-muted)",
    fontSize: 12,
    minHeight: 160,
    textAlign: "center",
  },
  emptyIcon: { fontSize: 28, opacity: 0.4 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  frameLabel: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  timestamp: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-secondary)",
    background: "var(--bg-elevated)",
    padding: "2px 8px",
    borderRadius: 4,
  },
  avgDot: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.15)",
    flexShrink: 0,
  },
  thumb: {
    width: "100%",
    borderRadius: 8,
    display: "block",
    border: "1px solid var(--border)",
  },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 10,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  avgRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avgChip: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  },
  avgHex: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--text-primary)",
    fontWeight: 500,
  },
  avgRgb: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-muted)",
  },
  histWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  histChannel: {
    display: "flex",
    alignItems: "flex-end",
    gap: 6,
    height: 36,
  },
  histLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 600,
    width: 12,
    flexShrink: 0,
    alignSelf: "center",
  },
  histBars: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: "100%",
  },
  histBar: {
    flex: 1,
    borderRadius: "2px 2px 0 0",
    minHeight: 2,
    transition: "height 0.3s",
  },
};
