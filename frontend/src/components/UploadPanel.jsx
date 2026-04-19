import { useState, useRef, useCallback } from "react";

const ACCEPTED = ".mp4,.mov,.mkv,.avi,.webm";
const VALID_EXTS = new Set(["mp4","mov","mkv","avi","webm"]);

export default function UploadPanel({ onSubmit, loading }) {
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [settings, setSettings] = useState({
    sample_every_n:   10,
    n_colors:         8,
    scene_threshold:  0.35,
  });
  const inputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!VALID_EXTS.has(ext)) {
      alert(`Unsupported format ".${ext}". Please use: MP4, MOV, MKV, AVI, or WebM.`);
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
    if (!file || loading) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("sample_every_n",   settings.sample_every_n);
    fd.append("n_colors",         settings.n_colors);
    fd.append("scene_threshold",  settings.scene_threshold);
    onSubmit(fd, file.name);
  };

  const isReady = file && !loading;

  return (
    <div style={S.wrapper}>

      {/* Drop zone / file picker */}
      <div
        style={{
          ...S.dropzone,
          borderColor: dragging
            ? "var(--accent)"
            : file
              ? "var(--success)"
              : "var(--border-active)",
          background: dragging
            ? "var(--accent-soft)"
            : file
              ? "rgba(92,252,140,0.05)"
              : "var(--bg-elevated)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        aria-label={file ? `Selected: ${file.name}` : "Click or drag to select a video file"}
        tabIndex={file ? -1 : 0}
        onKeyDown={(e) => e.key === "Enter" && !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
          aria-hidden
        />

        {file ? (
          /* File selected state */
          <div style={S.fileInfo}>
            <span style={S.fileIcon} aria-hidden>🎬</span>
            <div style={S.fileMeta}>
              <div style={S.fileName} className="truncate">{file.name}</div>
              <div style={S.fileSize}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
            <button
              style={S.clearBtn}
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              aria-label="Remove selected file"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Empty state */
          <div style={S.dropContent}>
            <div style={S.dropIcon} aria-hidden>⬆</div>
            <div style={S.dropTitle}>
              {window.matchMedia("(hover: none)").matches
                ? "Tap to select video"
                : "Drop video here"}
            </div>
            <div style={S.dropSub}>MP4 · MOV · MKV · AVI · WebM</div>
            <div style={S.dropSub}>Max 500 MB</div>
            <button
              style={S.browseBtn}
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              Browse files
            </button>
          </div>
        )}
      </div>

      {/* Settings accordion */}
      <details style={S.details}>
        <summary style={S.summary}>
          <span className="section-eyebrow">Analysis Settings</span>
          <span style={S.summaryChevron}>▾</span>
        </summary>

        <div style={S.settingsBody}>
          <SettingRow
            label="Sample every N frames"
            hint="Higher = faster, less detail"
            value={settings.sample_every_n}
            min={1} max={60}
            onChange={(v) => setSettings(s => ({ ...s, sample_every_n: v }))}
          />
          <SettingRow
            label="Colors per frame"
            hint="K-Means clusters (3–12)"
            value={settings.n_colors}
            min={3} max={12}
            onChange={(v) => setSettings(s => ({ ...s, n_colors: v }))}
          />
          <SettingRow
            label="Scene threshold"
            hint="Lower = more sensitive"
            value={settings.scene_threshold}
            min={0.1} max={0.9} step={0.05}
            onChange={(v) => setSettings(s => ({ ...s, scene_threshold: parseFloat(v) }))}
          />
        </div>
      </details>

      {/* Submit button */}
      <button
        style={{
          ...S.analyzeBtn,
          opacity: isReady ? 1 : 0.45,
          cursor:  isReady ? "pointer" : "not-allowed",
        }}
        disabled={!isReady}
        onClick={onSubmitClick}
        aria-label={loading ? "Analysis in progress" : "Start video analysis"}
      >
        {loading ? "⟳ Processing…" : "Analyze Video →"}
      </button>
    </div>
  );
}

function SettingRow({ label, hint, value, min, max, step = 1, onChange }) {
  const id = `setting-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={S.settingRow}>
      <div style={S.settingLabelWrap}>
        <label htmlFor={id} style={S.settingLabel}>{label}</label>
        <div style={S.settingHint}>{hint}</div>
      </div>
      <div style={S.settingControl}>
        <input
          id={id}
          type="range"
          min={min} max={max} step={step}
          value={value}
          style={S.slider}
          onChange={(e) =>
            onChange(step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))
          }
          aria-label={`${label}: ${value}`}
        />
        <span style={S.settingValue} aria-live="polite">{value}</span>
      </div>
    </div>
  );
}

const S = {
  wrapper: { display: "flex", flexDirection: "column", gap: 14 },

  /* Drop zone */
  dropzone: {
    border: "2px dashed",
    borderRadius: "var(--radius-lg)",
    padding: "20px 16px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    minHeight: 140,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropContent: {
    textAlign: "center", display: "flex",
    flexDirection: "column", alignItems: "center", gap: 8,
  },
  dropIcon:  { fontSize: 28, opacity: 0.5, lineHeight: 1 },
  dropTitle: {
    fontFamily: "var(--font-display)", fontSize: 16,
    fontWeight: 700, color: "var(--text-primary)",
  },
  dropSub:   { color: "var(--text-muted)", fontSize: 11 },
  browseBtn: {
    marginTop: 4, padding: "7px 18px",
    background: "var(--accent-soft)", border: "1px solid var(--accent)",
    borderRadius: 6, color: "var(--accent)", cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: 12, minHeight: 36,
  },

  /* File selected */
  fileInfo: {
    display: "flex", alignItems: "center",
    gap: 12, width: "100%", minWidth: 0,
  },
  fileIcon: { fontSize: 28, flexShrink: 0 },
  fileMeta: { flex: 1, minWidth: 0 },
  fileName: {
    fontFamily: "var(--font-display)", fontWeight: 600,
    fontSize: 14, color: "var(--text-primary)",
  },
  fileSize:  { color: "var(--text-muted)", fontSize: 11, marginTop: 2 },
  clearBtn:  {
    marginLeft: "auto", flexShrink: 0,
    background: "none", border: "none",
    color: "var(--text-muted)", cursor: "pointer",
    fontSize: 18, padding: "8px",
    minWidth: 40, minHeight: 40,
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 6,
  },

  /* Settings */
  details: {
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", overflow: "hidden",
  },
  summary: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 14px", cursor: "pointer", listStyle: "none",
    userSelect: "none", minHeight: 44,
  },
  summaryChevron: { color: "var(--text-muted)", fontSize: 12 },
  settingsBody:   { padding: "4px 14px 14px", display: "flex", flexDirection: "column", gap: 14 },
  settingRow:     {
    display: "flex", flexDirection: "column", gap: 6,
  },
  settingLabelWrap: {},
  settingLabel:   { color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" },
  settingHint:    { color: "var(--text-muted)", fontSize: 10, marginTop: 2 },
  settingControl: { display: "flex", alignItems: "center", gap: 10 },
  slider:         { flex: 1, accentColor: "var(--accent)", cursor: "pointer" },
  settingValue:   {
    color: "var(--accent)", fontWeight: 500,
    width: 34, textAlign: "right", fontSize: 12, flexShrink: 0,
  },

  /* Submit */
  analyzeBtn: {
    width: "100%", padding: "13px 24px",
    background: "var(--accent)", border: "none",
    borderRadius: "var(--radius)", color: "#fff",
    fontFamily: "var(--font-display)", fontSize: 15,
    fontWeight: 700, cursor: "pointer",
    transition: "opacity 0.2s", letterSpacing: "0.03em",
    minHeight: 48,
  },
};
