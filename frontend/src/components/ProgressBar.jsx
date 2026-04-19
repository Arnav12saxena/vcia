export default function ProgressBar({ progress, uploadPct, stage, filename }) {
  // Determine what to show — during upload show upload%, then switch to analysis%
  const isUploading = uploadPct > 0 && uploadPct < 100 && progress === 0;
  const displayPct  = isUploading ? uploadPct : progress;
  const displayStage = isUploading ? `Uploading… ${uploadPct}%` : (stage || "Processing…");

  return (
    <div style={S.wrapper} role="status" aria-label={`Progress: ${displayPct}%`}>
      {/* Header row */}
      <div style={S.header}>
        <span style={S.label}>
          {isUploading ? "Uploading" : "Analyzing"}
        </span>
        {filename && (
          <span
            style={S.filename}
            className="truncate"
            title={filename}
          >
            {filename}
          </span>
        )}
        <span style={S.pct} aria-hidden>{displayPct}%</span>
      </div>

      {/* Progress track */}
      <div style={S.track} role="progressbar" aria-valuenow={displayPct} aria-valuemin={0} aria-valuemax={100}>
        <div
          style={{
            ...S.fill,
            width: `${displayPct}%`,
            background: displayPct === 100
              ? "var(--success)"
              : isUploading
                ? "linear-gradient(90deg, var(--cool), #5cdffc)"
                : "linear-gradient(90deg, var(--accent), #b05cfc)",
          }}
        />
        <div style={S.shimmer} aria-hidden />
      </div>

      {/* Stage label */}
      <div style={S.stage}>{displayStage}</div>
    </div>
  );
}

const S = {
  wrapper: {
    padding: "14px 16px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    minWidth: 0,
  },
  label: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 13,
    color: "var(--text-primary)",
    flexShrink: 0,
  },
  filename: {
    flex: 1,
    color: "var(--text-muted)",
    fontSize: 11,
    minWidth: 0,
  },
  pct: {
    fontFamily: "var(--font-mono)",
    color: "var(--accent)",
    fontWeight: 600,
    fontSize: 13,
    flexShrink: 0,
  },
  track: {
    position: "relative",
    height: 6,
    background: "var(--border)",
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    borderRadius: 99,
    transition: "width 0.4s ease",
    minWidth: displayPct => displayPct > 0 ? 6 : 0,
  },
  shimmer: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.6s infinite linear",
    pointerEvents: "none",
  },
  stage: {
    marginTop: 8,
    color: "var(--text-muted)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    animation: "pulse 2.5s ease-in-out infinite",
  },
};
