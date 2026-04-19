import { FullPalette, MoodBadge } from "./Palette";

export default function FrameInspector({ frame }) {
  if (!frame) {
    return (
      <div style={S.empty} aria-label="No frame selected">
        <div style={S.emptyIcon} aria-hidden>⊹</div>
        <div style={S.emptyText}>
          Tap a frame on the timeline to inspect its colors
        </div>
      </div>
    );
  }

  const { dominant_colors, average_color, histogram, mood,
          timestamp_formatted, frame_number } = frame;

  return (
    <div style={S.wrapper} className="fade-up">
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.frameNum}>Frame #{frame_number}</span>
          <span style={S.ts} aria-label={`Timestamp: ${timestamp_formatted}`}>
            {timestamp_formatted}
          </span>
          <MoodBadge mood={mood} />
        </div>
        <div
          style={{ ...S.avgDot, background: average_color?.hex }}
          title={`Average: ${average_color?.hex}`}
          aria-label={`Average color: ${average_color?.hex}`}
        />
      </div>

      {/* Thumbnail */}
      {frame.thumbnail && (
        <img
          src={`data:image/jpeg;base64,${frame.thumbnail}`}
          style={S.thumb}
          alt={`Frame at ${timestamp_formatted}`}
          loading="lazy"
        />
      )}

      {/* Palette strip */}
      {dominant_colors?.length > 0 && (
        <div style={S.strip}>
          {dominant_colors.map((c, i) => (
            <div
              key={i}
              style={{
                flex: c.percentage || 1,
                background: c.hex,
                minWidth: 4,
              }}
              title={`${c.hex} ${c.percentage?.toFixed(1)}%`}
            />
          ))}
        </div>
      )}

      {/* Dominant colors */}
      {dominant_colors?.length > 0 && (
        <section>
          <div style={S.sectionTitle} className="section-eyebrow">Dominant Colors</div>
          <FullPalette colors={dominant_colors} />
        </section>
      )}

      {/* Average color */}
      <section>
        <div style={S.sectionTitle} className="section-eyebrow">Average Color</div>
        <div style={S.avgRow}>
          <div
            style={{ ...S.avgChip, background: average_color?.hex }}
            aria-hidden
          />
          <div>
            <div style={S.avgHex}>{average_color?.hex}</div>
            <div style={S.avgRgb}>
              rgb({average_color?.rgb?.r}, {average_color?.rgb?.g}, {average_color?.rgb?.b})
            </div>
          </div>
        </div>
      </section>

      {/* Histogram */}
      {histogram && (
        <section>
          <div style={S.sectionTitle} className="section-eyebrow">RGB Histogram</div>
          <Histogram histogram={histogram} />
        </section>
      )}
    </div>
  );
}

function Histogram({ histogram }) {
  const channels = [
    { key:"r", color:"#fc5c7c", label:"R" },
    { key:"g", color:"#5cfc8c", label:"G" },
    { key:"b", color:"#5cb8fc", label:"B" },
  ];

  return (
    <div style={S.histWrap}>
      {channels.map(({ key, color, label }) => {
        const data = histogram[key] || [];
        const max  = Math.max(...data, 0.001);
        return (
          <div key={key} style={S.histChannel} aria-label={`${label} channel histogram`}>
            <span style={{ ...S.histLabel, color }}>{label}</span>
            <div style={S.histBars}>
              {data.map((val, i) => (
                <div
                  key={i}
                  style={{
                    ...S.histBar,
                    height: `${(val / max) * 100}%`,
                    background: color,
                    opacity: 0.35 + (val / max) * 0.65,
                  }}
                  title={`${(val * 100).toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  /* Empty state */
  empty: {
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    gap:10, color:"var(--text-muted)", fontSize:12,
    minHeight:120, textAlign:"center", padding:"16px 0",
  },
  emptyIcon: { fontSize:24, opacity:0.35 },
  emptyText: { maxWidth:200, lineHeight:1.5 },

  /* Main layout */
  wrapper: {
    display:"flex", flexDirection:"column", gap:14,
  },
  header: {
    display:"flex", alignItems:"center",
    justifyContent:"space-between", flexWrap:"wrap", gap:8,
  },
  headerLeft: {
    display:"flex", alignItems:"center",
    gap:8, flexWrap:"wrap", flex:1, minWidth:0,
  },
  frameNum: {
    fontFamily:"var(--font-display)", fontWeight:700,
    fontSize:13, color:"var(--text-primary)",
  },
  ts: {
    fontFamily:"var(--font-mono)", fontSize:11,
    color:"var(--text-secondary)",
    background:"var(--bg-elevated)",
    padding:"2px 7px", borderRadius:4,
  },
  avgDot: {
    width:22, height:22, borderRadius:"50%",
    border:"2px solid rgba(255,255,255,0.15)",
    flexShrink:0,
  },

  thumb: {
    width:"100%", borderRadius:8, display:"block",
    border:"1px solid var(--border)",
  },

  strip: {
    display:"flex", height:8,
    borderRadius:99, overflow:"hidden",
  },

  sectionTitle: { marginBottom:8 },

  avgRow: { display:"flex", alignItems:"center", gap:10 },
  avgChip: {
    width:28, height:28, borderRadius:6,
    border:"1px solid rgba(255,255,255,0.1)",
    flexShrink:0,
  },
  avgHex: {
    fontFamily:"var(--font-mono)", fontSize:13,
    color:"var(--text-primary)", fontWeight:500,
  },
  avgRgb: {
    fontFamily:"var(--font-mono)", fontSize:10,
    color:"var(--text-muted)", marginTop:2,
  },

  histWrap: { display:"flex", flexDirection:"column", gap:5 },
  histChannel: {
    display:"flex", alignItems:"flex-end",
    gap:6, height:32,
  },
  histLabel: {
    fontFamily:"var(--font-mono)", fontSize:10,
    fontWeight:600, width:12, flexShrink:0, alignSelf:"center",
  },
  histBars: {
    flex:1, display:"flex", alignItems:"flex-end",
    gap:1.5, height:"100%",
  },
  histBar: {
    flex:1, borderRadius:"2px 2px 0 0",
    minHeight:2, transition:"height 0.3s",
  },
};
