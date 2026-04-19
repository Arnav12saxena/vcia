export default function ProgressBar({ progress, stage, filename }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.label}>Analyzing</span>
        <span style={styles.filename}>{filename}</span>
        <span style={styles.pct}>{progress}%</span>
      </div>

      <div style={styles.track}>
        <div
          style={{
            ...styles.fill,
            width: `${progress}%`,
            background: progress === 100
              ? "var(--success)"
              : "linear-gradient(90deg, var(--accent), #b05cfc)",
          }}
        />
        {/* Shimmer overlay */}
        <div style={styles.shimmer} />
      </div>

      <div style={styles.stage}>{stage}</div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "20px 24px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  label: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  filename: {
    flex: 1,
    color: "var(--text-muted)",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pct: {
    fontFamily: "var(--font-mono)",
    color: "var(--accent)",
    fontWeight: 600,
    fontSize: 14,
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
    transition: "width 0.3s ease",
  },
  shimmer: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.5s infinite linear",
  },
  stage: {
    marginTop: 8,
    color: "var(--text-secondary)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    animation: "pulse 2s infinite",
  },
};
