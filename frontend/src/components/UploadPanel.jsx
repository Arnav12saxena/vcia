import { useState, useRef, useCallback } from "react";

const ACCEPTED = ".mp4,.mov,.mkv,.avi,.webm";

export default function UploadPanel({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [settings, setSettings] = useState({
    sample_every_n: 10,
    n_colors: 8,
    scene_threshold: 0.35,
  });
  const inputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["mp4","mov","mkv","avi","webm"].includes(ext)) {
      alert("Unsupported format. Use MP4, MOV, MKV, AVI, or WebM.");
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onSubmitClick = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("sample_every_n", settings.sample_every_n);
    fd.append("n_colors", settings.n_colors);
    fd.append("scene_threshold", settings.scene_threshold);
    onSubmit(fd, file.name);
  };

  return (
    <div style={styles.wrapper}>
      {/* Drop zone */}
      <div
        style={{
          ...styles.dropzone,
          borderColor: dragging ? "var(--accent)" : file ? "var(--success)" : "var(--border-active)",
          background: dragging ? "var(--accent-soft)" : file ? "rgba(92,252,140,0.05)" : "var(--bg-elevated)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />

        {file ? (
          <div style={styles.fileInfo}>
            <div style={styles.fileIcon}>🎬</div>
            <div>
              <div style={styles.fileName}>{file.name}</div>
              <div style={styles.fileMeta}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            <button style={styles.clearBtn} onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</button>
          </div>
        ) : (
          <div style={styles.dropContent}>
            <div style={styles.dropIcon}>⬆</div>
            <div style={styles.dropTitle}>Drop video here</div>
            <div style={styles.dropSub}>MP4 · MOV · MKV · AVI · WebM — max 500MB</div>
            <button style={styles.browseBtn}>Browse files</button>
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={styles.settings}>
        <div style={styles.settingsTitle}>Analysis Settings</div>
        <div style={styles.settingsGrid}>
          <SettingRow
            label="Sample every N frames"
            hint="1 = all frames, higher = faster"
            value={settings.sample_every_n}
            min={1} max={60}
            onChange={(v) => setSettings(s => ({ ...s, sample_every_n: v }))}
          />
          <SettingRow
            label="Dominant colors per frame"
            hint="K-Means clusters (3–12)"
            value={settings.n_colors}
            min={3} max={12}
            onChange={(v) => setSettings(s => ({ ...s, n_colors: v }))}
          />
          <SettingRow
            label="Scene cut threshold"
            hint="Lower = more sensitive (0.1–0.9)"
            value={settings.scene_threshold}
            min={0.1} max={0.9} step={0.05}
            onChange={(v) => setSettings(s => ({ ...s, scene_threshold: parseFloat(v) }))}
          />
        </div>
      </div>

      <button
        style={{
          ...styles.analyzeBtn,
          opacity: (!file || loading) ? 0.4 : 1,
          cursor: (!file || loading) ? "not-allowed" : "pointer",
        }}
        disabled={!file || loading}
        onClick={onSubmitClick}
      >
        {loading ? (
          <span>⟳ Processing…</span>
        ) : (
          <span>Analyze Video →</span>
        )}
      </button>
    </div>
  );
}

function SettingRow({ label, hint, value, min, max, step = 1, onChange }) {
  return (
    <div style={styles.settingRow}>
      <div>
        <div style={styles.settingLabel}>{label}</div>
        <div style={styles.settingHint}>{hint}</div>
      </div>
      <div style={styles.settingControl}>
        <input
          type="range" min={min} max={max} step={step} value={value}
          style={styles.slider}
          onChange={(e) => onChange(step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))}
        />
        <span style={styles.settingValue}>{value}</span>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", gap: 20 },
  dropzone: {
    border: "2px dashed",
    borderRadius: "var(--radius-lg)",
    padding: 32,
    cursor: "pointer",
    transition: "all 0.2s",
    minHeight: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropContent: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  dropIcon: { fontSize: 36, opacity: 0.5 },
  dropTitle: { fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" },
  dropSub: { color: "var(--text-muted)", fontSize: 11 },
  browseBtn: {
    marginTop: 6,
    padding: "6px 18px",
    background: "var(--accent-soft)",
    border: "1px solid var(--accent)",
    borderRadius: 6,
    color: "var(--accent)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
  },
  fileInfo: {
    display: "flex", alignItems: "center", gap: 14, width: "100%",
  },
  fileIcon: { fontSize: 32 },
  fileName: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--text-primary)" },
  fileMeta: { color: "var(--text-muted)", fontSize: 11, marginTop: 2 },
  clearBtn: {
    marginLeft: "auto", background: "none", border: "none",
    color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: "4px 8px",
  },
  settings: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: 16,
  },
  settingsTitle: {
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11,
    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14,
  },
  settingsGrid: { display: "flex", flexDirection: "column", gap: 12 },
  settingRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
  },
  settingLabel: { color: "var(--text-secondary)", fontSize: 12 },
  settingHint: { color: "var(--text-muted)", fontSize: 10, marginTop: 1 },
  settingControl: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  slider: { width: 100, accentColor: "var(--accent)", cursor: "pointer" },
  settingValue: { color: "var(--accent)", fontWeight: 500, width: 36, textAlign: "right", fontSize: 12 },
  analyzeBtn: {
    width: "100%",
    padding: "14px 24px",
    background: "var(--accent)",
    border: "none",
    borderRadius: "var(--radius)",
    color: "#fff",
    fontFamily: "var(--font-display)",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: "0.03em",
  },
};
