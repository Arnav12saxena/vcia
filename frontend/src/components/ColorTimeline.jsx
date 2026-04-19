import { useState, useRef, useCallback, useEffect } from "react";

export default function ColorTimeline({ frames, scenes, onSelectFrame, selectedFrame }) {
  const [hovered,    setHovered]    = useState(null);
  const [tooltip,    setTooltip]    = useState({ x: 0, visible: false });
  const [isTouch,    setIsTouch]    = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  const handlePointerMove = useCallback((e, frame) => {
    if (isTouch) return; // skip hover tooltip on touch devices
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered(frame);
    const x = e.clientX - rect.left;
    setTooltip({
      x: Math.min(x, rect.width - 160),
      visible: true,
    });
  }, [isTouch]);

  const handlePointerLeave = useCallback(() => {
    setHovered(null);
    setTooltip(t => ({ ...t, visible: false }));
  }, []);

  const handleTap = useCallback((frame) => {
    onSelectFrame?.(frame);
  }, [onSelectFrame]);

  if (!frames?.length) return null;

  const totalDuration = frames[frames.length - 1]?.timestamp || 1;

  return (
    <div style={S.wrapper}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.title}>Color Timeline</span>
        <span style={S.meta}>{frames.length} frames · {scenes?.length || 0} scenes</span>
      </div>

      {/* Strip container */}
      <div
        ref={containerRef}
        style={S.stripWrapper}
        aria-label="Video color timeline"
        role="img"
      >
        {/* Scene markers */}
        {scenes?.map((scene, i) => {
          const pct = (scene.start_timestamp / totalDuration) * 100;
          return (
            <div
              key={i}
              style={{ ...S.sceneMark, left: `${pct}%` }}
              title={`Scene ${scene.scene_number}: ${scene.start_formatted}`}
              aria-hidden
            />
          );
        })}

        {/* Frame color strip */}
        <div style={S.frameStrip} aria-hidden>
          {frames.map((frame, i) => {
            const isSelected = selectedFrame?.frame_index === frame.frame_index;
            return (
              <div
                key={i}
                style={{
                  ...S.frameBar,
                  background: frame.average_color?.hex || "#333",
                  outline: isSelected ? "2px solid rgba(255,255,255,0.9)" : "none",
                  outlineOffset: isSelected ? "-1px" : "0",
                }}
                onMouseMove={(e) => handlePointerMove(e, frame)}
                onMouseLeave={handlePointerLeave}
                onClick={() => handleTap(frame)}
              />
            );
          })}
        </div>

        {/* Dominant color strip */}
        <div style={S.dominantStrip} aria-hidden>
          {frames.map((frame, i) => (
            <div
              key={i}
              style={{ ...S.dominantBar, background: frame.dominant_colors?.[0]?.hex || "#333" }}
            />
          ))}
        </div>

        {/* Hover tooltip — desktop only */}
        {!isTouch && hovered && tooltip.visible && (
          <div style={{ ...S.tooltip, left: tooltip.x }}>
            {hovered.thumbnail && (
              <img
                src={`data:image/jpeg;base64,${hovered.thumbnail}`}
                style={S.tooltipImg}
                alt=""
              />
            )}
            <div style={S.tooltipBody}>
              <div style={S.tooltipTime}>{hovered.timestamp_formatted}</div>
              <div style={S.tooltipDots}>
                {hovered.dominant_colors?.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    style={{ ...S.tooltipDot, background: c.hex }}
                    title={c.hex}
                  />
                ))}
              </div>
              <div style={S.tooltipMood}>{hovered.mood}</div>
            </div>
          </div>
        )}
      </div>

      {/* Scene palette row */}
      {scenes?.length > 0 && (
        <div style={S.scenePaletteRow}>
          {scenes.map((scene, i) => {
            const dur  = scene.end_timestamp - scene.start_timestamp;
            const pct  = Math.max((dur / totalDuration) * 100, 1.5);
            return (
              <div
                key={i}
                style={{ ...S.sceneBlock, width: `${pct}%` }}
                title={`Scene ${scene.scene_number}: ${scene.start_formatted} → ${scene.end_formatted}`}
              >
                {scene.palette?.slice(0, 6).map((c, ci) => (
                  <div key={ci} style={{ flex: 1, background: c.hex, minWidth: 1 }} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Time ruler */}
      <TimeRuler duration={totalDuration} />

      {/* Touch hint */}
      {isTouch && (
        <div style={S.touchHint}>Tap any frame to inspect its colors</div>
      )}
    </div>
  );
}

function TimeRuler({ duration }) {
  const fmt = (s) => {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // Adaptive tick count based on duration
  const step = duration <= 30 ? 5 : duration <= 120 ? 15 : duration <= 600 ? 60 : 300;
  const ticks = [];
  for (let t = 0; t <= duration; t += step) ticks.push(t);
  // Always include the end
  if (ticks[ticks.length - 1] < duration) ticks.push(Math.floor(duration));

  return (
    <div style={S.ruler} aria-hidden>
      {ticks.map((t) => (
        <div key={t} style={{ ...S.tick, left: `${(t / duration) * 100}%` }}>
          <div style={S.tickLine} />
          <span style={S.tickLabel}>{fmt(t)}</span>
        </div>
      ))}
    </div>
  );
}

const S = {
  wrapper: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "14px 16px",
    overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "baseline",
    gap: 10, marginBottom: 12, flexWrap: "wrap",
  },
  title: {
    fontFamily: "var(--font-display)", fontWeight: 700,
    fontSize: 14, color: "var(--text-primary)",
  },
  meta: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-muted)",
  },

  /* Strip */
  stripWrapper: { position: "relative", userSelect: "none" },
  sceneMark: {
    position: "absolute", top: 0, bottom: 0,
    width: 1.5, background: "rgba(255,255,255,0.5)",
    zIndex: 3, pointerEvents: "none",
  },
  frameStrip: {
    display: "flex",
    height: "clamp(32px, 8vw, 48px)",
    borderRadius: "6px 6px 0 0",
    overflow: "hidden",
    cursor: "crosshair",
  },
  frameBar: {
    flex: 1, minWidth: 1, position: "relative",
  },
  dominantStrip: {
    display: "flex",
    height: "clamp(12px, 3vw, 18px)",
    overflow: "hidden",
    opacity: 0.85,
  },
  dominantBar: { flex: 1, minWidth: 1 },

  /* Tooltip */
  tooltip: {
    position: "absolute",
    top: -92,
    background: "var(--bg-base)",
    border: "1px solid var(--border-active)",
    borderRadius: 8,
    padding: 8,
    display: "flex",
    gap: 8,
    minWidth: 148,
    maxWidth: 180,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    zIndex: 10,
    pointerEvents: "none",
  },
  tooltipImg: {
    width: 60, height: 38,
    objectFit: "cover", borderRadius: 4, display: "block", flexShrink: 0,
  },
  tooltipBody: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  tooltipTime: {
    fontFamily: "var(--font-mono)", fontSize: 10,
    color: "var(--text-primary)", fontWeight: 600,
  },
  tooltipDots: { display: "flex", gap: 3, flexWrap: "wrap" },
  tooltipDot: {
    width: 12, height: 12, borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  },
  tooltipMood: { fontSize: 9, color: "var(--text-muted)", textTransform: "capitalize" },

  /* Scene palette row */
  scenePaletteRow: {
    display: "flex", height: 14, gap: 1, marginTop: 2,
    borderRadius: "0 0 4px 4px", overflow: "hidden",
  },
  sceneBlock: { display: "flex", overflow: "hidden", flexShrink: 0 },

  /* Ruler */
  ruler: { position: "relative", height: 20, marginTop: 4 },
  tick:  { position: "absolute", transform: "translateX(-50%)" },
  tickLine: { width: 1, height: 4, background: "var(--border-active)", margin: "0 auto" },
  tickLabel: {
    display: "block", fontFamily: "var(--font-mono)",
    fontSize: "clamp(8px, 2vw, 9px)", color: "var(--text-muted)",
    textAlign: "center", marginTop: 2, whiteSpace: "nowrap",
  },

  /* Touch hint */
  touchHint: {
    textAlign: "center", fontFamily: "var(--font-mono)",
    fontSize: 10, color: "var(--text-muted)", marginTop: 8,
  },
};
