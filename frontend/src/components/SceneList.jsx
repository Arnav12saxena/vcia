import { useState } from "react";
import { PaletteStrip, MoodBadge } from "./Palette";

export default function SceneList({ scenes, frames, onSelectScene }) {
  const [expanded, setExpanded] = useState(null);

  if (!scenes?.length) return null;

  return (
    <div style={S.wrapper}>
      <div style={S.header}>
        <span style={S.title}>Scenes</span>
        <span style={S.count}>{scenes.length} detected</span>
      </div>

      <div style={S.list} role="list">
        {scenes.map((scene) => {
          const isOpen = expanded === scene.scene_number;
          return (
            <SceneCard
              key={scene.scene_number}
              scene={scene}
              frames={frames}
              isOpen={isOpen}
              onToggle={() => {
                setExpanded(isOpen ? null : scene.scene_number);
                if (!isOpen) onSelectScene?.(scene);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SceneCard({ scene, frames, isOpen, onToggle }) {
  return (
    <div style={S.card} role="listitem">
      {/* Header — always visible, tap to expand */}
      <button
        style={S.cardHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`scene-body-${scene.scene_number}`}
      >
        <div style={S.badge} aria-hidden>{scene.scene_number}</div>

        <div style={S.middle}>
          {scene.palette?.length > 0 && (
            <PaletteStrip colors={scene.palette} height={18} />
          )}
          <div style={S.timeRow}>
            <span style={S.timeText} className="truncate">
              {scene.start_formatted} → {scene.end_formatted}
            </span>
            <span style={S.dur}>
              {scene.duration_seconds.toFixed(1)}s · {scene.frame_count}f
            </span>
          </div>
        </div>

        <div style={S.right}>
          <MoodBadge mood={scene.mood} />
          <span style={S.chevron} aria-hidden>{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded details */}
      {isOpen && (
        <div
          id={`scene-body-${scene.scene_number}`}
          style={S.body}
          className="fade-up"
        >
          {/* Stats grid */}
          <div style={S.detailGrid}>
            <Detail label="Start"    value={scene.start_formatted} />
            <Detail label="End"      value={scene.end_formatted} />
            <Detail label="Duration" value={`${scene.duration_seconds.toFixed(1)}s`} />
            <Detail label="Frames"   value={scene.frame_count} />
            <Detail label="Mood"     value={scene.mood} />
            <Detail label="Avg color" value={
              <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{
                  display:"inline-block", width:12, height:12,
                  borderRadius:3, background:scene.average_color?.hex,
                  flexShrink:0,
                }} />
                <span style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>
                  {scene.average_color?.hex}
                </span>
              </span>
            } />
          </div>

          {/* Scene palette */}
          <div style={S.paletteSection}>
            <div style={S.palLabel} className="section-eyebrow">Scene Palette</div>
            <div style={S.swatchRow}>
              {scene.palette?.map((c, i) => (
                <Swatch key={i} color={c} />
              ))}
            </div>
          </div>

          {/* Thumbnail strip */}
          <SceneThumbs
            frameIndices={scene.frame_indices}
            frames={frames}
          />
        </div>
      )}
    </div>
  );
}

function Swatch({ color }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      style={S.swatch}
      onClick={copy}
      title={`${color.hex} — tap to copy`}
      aria-label={`Copy color ${color.hex}`}
    >
      <span
        style={{ ...S.swatchChip, background: color.hex }}
        aria-hidden
      >
        {copied && <span style={S.checkmark} aria-hidden>✓</span>}
      </span>
      <span style={S.swatchHex}>{color.hex}</span>
      {color.percentage != null && (
        <span style={S.swatchPct}>{color.percentage.toFixed(0)}%</span>
      )}
    </button>
  );
}

function SceneThumbs({ frameIndices, frames }) {
  if (!frames?.length || !frameIndices?.length) return null;
  const stride = Math.max(1, Math.floor(frameIndices.length / 5));
  const sample = frameIndices.filter((_, i) => i % stride === 0).slice(0, 5);
  const map    = Object.fromEntries(frames.map(f => [f.frame_index, f]));
  const valid  = sample.map(idx => map[idx]).filter(f => f?.thumbnail);
  if (!valid.length) return null;

  return (
    <div>
      <div style={S.palLabel} className="section-eyebrow">Sample Frames</div>
      <div style={S.thumbRow}>
        {valid.map((f, i) => (
          <img
            key={i}
            src={`data:image/jpeg;base64,${f.thumbnail}`}
            style={S.thumb}
            alt={`Frame at ${f.timestamp_formatted}`}
            title={f.timestamp_formatted}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={S.detail}>
      <div style={S.detailLabel} className="section-eyebrow">{label}</div>
      <div style={S.detailValue}>{value}</div>
    </div>
  );
}

const S = {
  wrapper: { display:"flex", flexDirection:"column", gap:10 },
  header:  { display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" },
  title:   { fontFamily:"var(--font-display)", fontWeight:700, fontSize:14, color:"var(--text-primary)" },
  count:   { fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)" },
  list:    { display:"flex", flexDirection:"column", gap:6 },

  card: {
    background:"var(--bg-elevated)", border:"1px solid var(--border)",
    borderRadius:"var(--radius)", overflow:"hidden",
  },
  cardHeader: {
    display:"flex", alignItems:"center", gap:10,
    padding:"10px 12px", cursor:"pointer",
    background:"none", border:"none", color:"inherit",
    width:"100%", textAlign:"left",
    minHeight:52, /* touch target */
    transition:"background 0.15s",
  },
  badge: {
    width:24, height:24, borderRadius:6, flexShrink:0,
    background:"var(--bg-card)", border:"1px solid var(--border-active)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontFamily:"var(--font-mono)", fontSize:11, fontWeight:600,
    color:"var(--text-secondary)",
  },
  middle:  { flex:1, display:"flex", flexDirection:"column", gap:4, minWidth:0 },
  timeRow: { display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", minWidth:0 },
  timeText:{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-secondary)", flex:1, minWidth:0 },
  dur:     { fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-muted)", flexShrink:0 },
  right:   { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  chevron: { color:"var(--text-muted)", fontSize:10 },

  body: {
    borderTop:"1px solid var(--border)", padding:"12px 14px",
    display:"flex", flexDirection:"column", gap:14,
  },

  /* Detail grid — 2 cols on mobile, 3 on wider */
  detailGrid: {
    display:"grid",
    gridTemplateColumns:"repeat(2, 1fr)",
    gap:"8px 12px",
  },
  detail:      { display:"flex", flexDirection:"column", gap:2 },
  detailLabel: { fontSize:9, color:"var(--text-muted)" },
  detailValue: { fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-primary)", wordBreak:"break-word" },

  paletteSection: { display:"flex", flexDirection:"column", gap:8 },
  palLabel: { marginBottom:2 },
  swatchRow: {
    display:"flex", gap:8, flexWrap:"wrap",
  },
  swatch: {
    display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    background:"none", border:"none", cursor:"pointer",
    padding:"4px 2px", minWidth:36, minHeight:44,
  },
  swatchChip: {
    width:32, height:32, borderRadius:8,
    border:"1px solid rgba(255,255,255,0.1)",
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0,
  },
  checkmark: { color:"#fff", fontSize:14 },
  swatchHex: { fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-secondary)" },
  swatchPct: { fontFamily:"var(--font-mono)", fontSize:9, color:"var(--text-muted)" },

  thumbRow: {
    display:"flex", gap:5, flexWrap:"wrap", marginTop:6,
  },
  thumb: {
    width:"clamp(56px, 15vw, 80px)",
    height:"clamp(35px, 9vw, 50px)",
    objectFit:"cover", borderRadius:5,
    border:"1px solid var(--border)",
  },
};
