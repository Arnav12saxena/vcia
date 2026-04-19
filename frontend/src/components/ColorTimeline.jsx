import { useState, useRef, useCallback } from "react";

/**
 * ColorTimeline
 * Renders a horizontal strip of color bars — one per analyzed frame.
 * Hovering shows frame details. Clicking selects the frame.
 */
export default function ColorTimeline({ frames, scenes, onSelectFrame, selectedFrame }) {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
  const containerRef = useRef();

  const handleMouseMove = useCallback((e, frame) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered(frame);
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  if (!frames?.length) return null;

  const totalDuration = frames[frames.length - 1]?.timestamp || 1;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>Color Timeline</span>
        <span style={styles.meta}>{frames.length} frames · {scenes?.length || 0} scenes</span>
      </div>

      {/* Frame color strip */}
      <div ref={containerRef} style={styles.stripWrapper}>
        {/* Scene boundary markers */}
        {scenes?.map((scene, i) => {
          const pct = (scene.start_timestamp / totalDuration) * 100;
          return (
            <div
              key={i}
              style={{ ...styles.sceneMark, left: `${pct}%` }}
              title={`Scene ${scene.scene_number}: ${scene.start_formatted}`}
            />
          );
        })}

        {/* Frame bars */}
        <div style={styles.frameStrip}>
          {frames.map((frame, i) => {
            const color = frame.average_color?.hex || "#333";
            const isSelected = selectedFrame?.frame_index === frame.frame_index;
            return (
              <div
                key={i}
                style={{
                  ...styles.frameBar,
                  background: color,
                  outline: isSelected ? "2px solid #fff" : "none",
                  zIndex: isSelected ? 2 : 1,
                }}
                onMouseMove={(e) => handleMouseMove(e, frame)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectFrame?.(frame)}
              />
            );
          })}
        </div>

        {/* Dominant color strip (top 1 per frame) */}
        <div style={styles.dominantStrip}>
          {frames.map((frame, i) => {
            const color = frame.dominant_colors?.[0]?.hex || "#333";
            return (
              <div
                key={i}
                style={{ ...styles.dominantBar, background: color }}
              />
            );
          })}
        </div>

        {/* Hover tooltip */}
        {hovered && (
          <div
            style={{
              ...styles.tooltip,
              left: Math.min(tooltip.x, containerRef.current?.offsetWidth - 160 || 9999),
              top: tooltip.y - 90,
              pointerEvents: "none",
            }}
          >
            <div style={styles.tooltipThumb}>
              {hovered.thumbnail && (
                <img src={`data:image/jpeg;base64,${hovered.thumbnail}`}
                  style={styles.thumbImg} alt="" />
              )}
            </div>
            <div style={styles.tooltipInfo}>
              <div style={styles.tooltipTime}>{hovered.timestamp_formatted}</div>
              <div style={styles.tooltipColors}>
                {hovered.dominant_colors?.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ ...styles.tooltipDot, background: c.hex }} title={c.hex} />
                ))}
              </div>
              <div style={styles.tooltipMood}>{hovered.mood}</div>
            </div>
          </div>
        )}
      </div>

      {/* Scene palette row */}
      {scenes?.length > 0 && (
        <div style={styles.scenePaletteRow}>
          {scenes.map((scene, i) => {
            const width = ((scene.end_timestamp - scene.start_timestamp) / totalDuration) * 100;
            return (
              <div
                key={i}
                style={{ ...styles.sceneBlock, width: `${Math.max(width, 2)}%` }}
                title={`Scene ${scene.scene_number}: ${scene.start_formatted} → ${scene.end_formatted}`}
              >
                {scene.palette?.slice(0, 6).map((c, ci) => (
                  <div
                    key={ci}
                    style={{
                      flex: c.percentage,
                      background: c.hex,
                      minWidth: 2,
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Time ruler */}
      <TimeRuler duration={totalDuration} />
    </div>
  );
}

function TimeRuler({ duration }) {
  const formatTs = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const ticks = [];
  const step = duration <= 30 ? 5 : duration <= 120 ? 15 : duration <= 600 ? 60 : 300;
  for (let t = 0; t <= duration; t += step) {
    ticks.push(t);
  }

  return (
    <div style={styles.ruler}>
      {ticks.map((t) => (
        <div key={t} style={{ ...styles.tick, left: `${(t / duration) * 100}%` }}>
          <div style={styles.tickLine} />
          <span style={styles.tickLabel}>{formatTs(t)}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 20px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 14,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  meta: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-muted)",
  },
  stripWrapper: {
    position: "relative",
    userSelect: "none",
  },
  sceneMark: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    background: "rgba(255,255,255,0.5)",
    zIndex: 3,
    pointerEvents: "none",
  },
  frameStrip: {
    display: "flex",
    height: 48,
    borderRadius: "8px 8px 0 0",
    overflow: "hidden",
    cursor: "crosshair",
  },
  frameBar: {
    flex: 1,
    minWidth: 1,
    transition: "transform 0.1s",
  },
  dominantStrip: {
    display: "flex",
    height: 20,
    borderRadius: "0 0 0 0",
    overflow: "hidden",
    opacity: 0.8,
  },
  dominantBar: {
    flex: 1,
    minWidth: 1,
  },
  tooltip: {
    position: "absolute",
    background: "var(--bg-base)",
    border: "1px solid var(--border-active)",
    borderRadius: 8,
    padding: 8,
    display: "flex",
    gap: 8,
    minWidth: 150,
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
    zIndex: 10,
  },
  tooltipThumb: { flexShrink: 0 },
  thumbImg: {
    width: 64,
    height: 40,
    objectFit: "cover",
    borderRadius: 4,
    display: "block",
  },
  tooltipInfo: { display: "flex", flexDirection: "column", gap: 4 },
  tooltipTime: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-primary)",
    fontWeight: 600,
  },
  tooltipColors: { display: "flex", gap: 3 },
  tooltipDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  tooltipMood: {
    fontSize: 9,
    color: "var(--text-muted)",
    textTransform: "capitalize",
  },
  scenePaletteRow: {
    display: "flex",
    height: 16,
    gap: 1,
    marginTop: 2,
    borderRadius: "0 0 4px 4px",
    overflow: "hidden",
  },
  sceneBlock: {
    display: "flex",
    overflow: "hidden",
    flexShrink: 0,
  },
  ruler: {
    position: "relative",
    height: 20,
    marginTop: 4,
  },
  tick: {
    position: "absolute",
    transform: "translateX(-50%)",
  },
  tickLine: {
    width: 1,
    height: 4,
    background: "var(--border-active)",
    margin: "0 auto",
  },
  tickLabel: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    color: "var(--text-muted)",
    textAlign: "center",
    marginTop: 2,
    whiteSpace: "nowrap",
  },
};
