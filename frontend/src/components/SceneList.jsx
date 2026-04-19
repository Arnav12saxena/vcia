import { useState } from "react";
import { PaletteStrip, MoodBadge } from "./Palette";

export default function SceneList({ scenes, frames, onSelectScene }) {
  const [expanded, setExpanded] = useState(null);

  if (!scenes?.length) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Scenes</span>
        <span style={styles.count}>{scenes.length} detected</span>
      </div>

      <div style={styles.list}>
        {scenes.map((scene) => {
          const isOpen = expanded === scene.scene_number;
          return (
            <div key={scene.scene_number} style={styles.sceneCard}>
              <div
                style={styles.sceneHeader}
                onClick={() => {
                  setExpanded(isOpen ? null : scene.scene_number);
                  onSelectScene?.(scene);
                }}
              >
                {/* Scene number badge */}
                <div style={styles.sceneBadge}>{scene.scene_number}</div>

                {/* Palette strip */}
                <div style={styles.sceneMiddle}>
                  {scene.palette?.length > 0 && (
                    <PaletteStrip colors={scene.palette} height={20} />
                  )}
                  <div style={styles.sceneTime}>
                    {scene.start_formatted} → {scene.end_formatted}
                    <span style={styles.sceneDur}>
                      ({scene.duration_seconds.toFixed(1)}s · {scene.frame_count} frames)
                    </span>
                  </div>
                </div>

                {/* Mood + expand */}
                <div style={styles.sceneRight}>
                  <MoodBadge mood={scene.mood} />
                  <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={styles.sceneBody} className="fade-up">
                  <div style={styles.detailGrid}>
                    <DetailItem label="Start" value={scene.start_formatted} />
                    <DetailItem label="End" value={scene.end_formatted} />
                    <DetailItem label="Duration" value={`${scene.duration_seconds.toFixed(2)}s`} />
                    <DetailItem label="Frames" value={scene.frame_count} />
                    <DetailItem label="Mood" value={scene.mood} />
                    <DetailItem label="Avg Color" value={
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          display: "inline-block",
                          width: 12, height: 12,
                          borderRadius: 3,
                          background: scene.average_color?.hex,
                        }} />
                        {scene.average_color?.hex}
                      </span>
                    } />
                  </div>

                  <div style={styles.paletteDetail}>
                    <div style={styles.paletteTitle}>Scene Palette</div>
                    <div style={styles.swatchRow}>
                      {scene.palette?.map((c, i) => (
                        <SceneSwatch key={i} color={c} />
                      ))}
                    </div>
                  </div>

                  {/* Sample frame thumbnails */}
                  <SceneFrames frameIndices={scene.frame_indices} frames={frames} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SceneSwatch({ color }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={styles.swatch}
      title={`${color.hex} — ${color.percentage?.toFixed(1)}%`}
      onClick={() => {
        navigator.clipboard.writeText(color.hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
    >
      <div style={{ ...styles.swatchChip, background: color.hex }}>
        {copied && <span style={styles.check}>✓</span>}
      </div>
      <span style={styles.swatchHex}>{color.hex}</span>
      {color.percentage != null && (
        <span style={styles.swatchPct}>{color.percentage.toFixed(1)}%</span>
      )}
    </div>
  );
}

function SceneFrames({ frameIndices, frames }) {
  if (!frames?.length || !frameIndices?.length) return null;
  const sample = frameIndices.filter((_, i) => i % Math.max(1, Math.floor(frameIndices.length / 6)) === 0).slice(0, 6);
  const frameMap = Object.fromEntries(frames.map(f => [f.frame_index, f]));

  return (
    <div style={styles.thumbsRow}>
      {sample.map((idx) => {
        const f = frameMap[idx];
        if (!f?.thumbnail) return null;
        return (
          <img
            key={idx}
            src={`data:image/jpeg;base64,${f.thumbnail}`}
            style={styles.thumbImg}
            alt={`Frame ${idx}`}
            title={f.timestamp_formatted}
          />
        );
      })}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  count: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-muted)",
  },
  list: { display: "flex", flexDirection: "column", gap: 6 },
  sceneCard: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  sceneHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  sceneBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: "var(--bg-card)",
    border: "1px solid var(--border-active)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    flexShrink: 0,
  },
  sceneMiddle: { flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  sceneTime: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-secondary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sceneDur: { color: "var(--text-muted)", marginLeft: 6 },
  sceneRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  chevron: { color: "var(--text-muted)", fontSize: 10 },
  sceneBody: {
    borderTop: "1px solid var(--border)",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  detailItem: { display: "flex", flexDirection: "column", gap: 2 },
  detailLabel: {
    fontFamily: "var(--font-display)",
    fontSize: 9,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  detailValue: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-primary)",
  },
  paletteDetail: { display: "flex", flexDirection: "column", gap: 6 },
  paletteTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 10,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  swatchRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  swatch: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    cursor: "pointer",
  },
  swatchChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s",
  },
  check: { color: "#fff", fontSize: 14 },
  swatchHex: { fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-secondary)" },
  swatchPct: { fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" },
  thumbsRow: { display: "flex", gap: 4, flexWrap: "wrap" },
  thumbImg: {
    width: 72,
    height: 44,
    objectFit: "cover",
    borderRadius: 4,
    border: "1px solid var(--border)",
  },
};
