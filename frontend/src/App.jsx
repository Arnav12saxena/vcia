import { useState } from "react";
import { useAnalysis } from "./hooks/useAnalysis";
import UploadPanel from "./components/UploadPanel";
import ProgressBar from "./components/ProgressBar";
import ColorTimeline from "./components/ColorTimeline";
import FrameInspector from "./components/FrameInspector";
import SceneList from "./components/SceneList";
import ExportPanel from "./components/ExportPanel";
import StatsSummary from "./components/StatsSummary";

const API_DOCS = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/docs`
  : "http://localhost:8000/api/docs";

// Result tabs used on mobile to navigate between panels
const RESULT_TABS = [
  { id: "timeline",  label: "Timeline"  },
  { id: "scenes",    label: "Scenes"    },
  { id: "inspector", label: "Inspector" },
  { id: "export",    label: "Export"    },
];

export default function App() {
  const {
    jobId, status, progress, uploadPct,
    stage, result, error, filename, submit, reset,
    isProcessing, isComplete, isIdle, isError,
  } = useAnalysis();

  const [selectedFrame, setSelectedFrame] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────── */}
      <header className="app-header">
        <div style={S.logo}>
          <span style={S.logoIcon}>◈</span>
          <div style={S.logoText}>
            <div style={S.logoTitle}>Color Intelligence</div>
            <div style={S.logoSub}>Analyzer</div>
          </div>
        </div>

        <div style={S.headerRight}>
          {isComplete && (
            <button style={S.resetBtn} onClick={reset} aria-label="Start new analysis">
              ← New
            </button>
          )}
          <a
            href={API_DOCS}
            target="_blank"
            rel="noreferrer"
            style={S.apiLink}
            aria-label="API documentation"
          >
            API ↗
          </a>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────── */}
      <main className="app-main">

        {/* ── Sidebar ──────────────────────────────── */}
        <aside className="app-sidebar">
          {/* Upload — shown when idle or processing */}
          {!isComplete && (
            <div className="card">
              <UploadPanel onSubmit={submit} loading={isProcessing} />
            </div>
          )}

          {/* Progress bar */}
          {isProcessing && (
            <div className="fade-up">
              <ProgressBar
                progress={progress}
                uploadPct={uploadPct}
                stage={stage}
                filename={filename}
              />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div style={S.errorCard} className="fade-up" role="alert">
              <div style={S.errorTitle}>Analysis failed</div>
              <div style={S.errorMsg}>{error}</div>
              <button style={S.retryBtn} onClick={reset}>Try again</button>
            </div>
          )}

          {/* On desktop: frame inspector + export live in sidebar when complete */}
          {isComplete && (
            <>
              <div className="card desktop-only">
                <FrameInspector frame={selectedFrame} />
              </div>
              <div className="desktop-only">
                {jobId && <ExportPanel jobId={jobId} />}
              </div>
            </>
          )}
        </aside>

        {/* ── Mobile result tabs (shown only when complete on small screens) ── */}
        {isComplete && (
          <nav className="mobile-tabs" role="tablist" aria-label="Results sections">
            {RESULT_TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`mobile-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* ── Content ──────────────────────────────── */}
        <section className="app-content" aria-live="polite">

          {/* Welcome / idle state */}
          {isIdle && (
            <div style={S.welcome} className="fade-up">
              <div style={S.welcomeGlow} aria-hidden />
              <div style={S.welcomeIcon} aria-hidden>◈</div>
              <h1 style={S.welcomeTitle}>
                Color Intelligence<br />for Video
              </h1>
              <p style={S.welcomeDesc}>
                Upload a video to extract dominant colors, detect scene
                changes, visualize color progressions, and export palettes.
              </p>
              <ul style={S.featureList} aria-label="Features">
                {[
                  "K-Means color clustering",
                  "Scene boundary detection",
                  "Timeline visualization",
                  "5 export formats",
                  "Mood classification",
                ].map((f, i) => (
                  <li key={i} style={S.featureItem}>
                    <span style={S.featureDot} aria-hidden>·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div style={S.processingState} className="fade-up" aria-busy="true">
              <div style={S.processingAnim} aria-hidden>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      ...S.processingBar,
                      height: `${20 + (i % 5) * 16}%`,
                      animationDelay: `${i * 0.12}s`,
                      background: `hsl(${i * 36}, 70%, 60%)`,
                    }}
                  />
                ))}
              </div>
              <div style={S.processingLabel}>Extracting color intelligence…</div>
              <div style={S.processingStage}>{stage}</div>
            </div>
          )}

          {/* Results — desktop shows all, mobile shows active tab */}
          {isComplete && result && (
            <div style={S.results} className="fade-up">
              {/* Stats always visible on all sizes */}
              <StatsSummary
                metadata={result.metadata}
                frames={result.frames}
                scenes={result.scenes}
              />

              {/* Timeline — always visible on desktop; tab on mobile */}
              <div className={activeTab === "timeline" ? "" : "mobile-hidden"}>
                <ColorTimeline
                  frames={result.frames}
                  scenes={result.scenes}
                  selectedFrame={selectedFrame}
                  onSelectFrame={(f) => { setSelectedFrame(f); setActiveTab("inspector"); }}
                />
              </div>

              {/* Scenes — always on desktop; tab on mobile */}
              <div className={activeTab === "scenes" ? "" : "mobile-hidden"}>
                <SceneList
                  scenes={result.scenes}
                  frames={result.frames}
                  onSelectScene={() => {}}
                />
              </div>

              {/* Inspector — mobile tab only (desktop is in sidebar) */}
              <div className={`mobile-only ${activeTab === "inspector" ? "" : "mobile-hidden"}`}>
                <div className="card">
                  <FrameInspector frame={selectedFrame} />
                </div>
              </div>

              {/* Export — mobile tab only (desktop is in sidebar) */}
              <div className={`mobile-only ${activeTab === "export" ? "" : "mobile-hidden"}`}>
                {jobId && <ExportPanel jobId={jobId} />}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Responsive show/hide helpers via <style> */}
      <style>{`
        .desktop-only { display: none; }
        .mobile-only  { display: block; }
        .mobile-hidden { display: none !important; }
        @media (min-width: 900px) {
          .desktop-only { display: block; }
          .mobile-only  { display: none; }
          .mobile-hidden { display: block !important; }
        }
      `}</style>
    </div>
  );
}

const S = {
  /* Header */
  logo: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  logoIcon: { fontSize: 24, color: "var(--accent)", lineHeight: 1, flexShrink: 0 },
  logoText: { minWidth: 0, overflow: "hidden" },
  logoTitle: {
    fontFamily: "var(--font-display)", fontWeight: 800,
    fontSize: "clamp(13px, 3vw, 16px)", color: "var(--text-primary)",
    lineHeight: 1.1, whiteSpace: "nowrap",
  },
  logoSub: {
    fontFamily: "var(--font-mono)", fontSize: 9,
    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  resetBtn: {
    padding: "7px 12px", background: "var(--bg-elevated)",
    border: "1px solid var(--border-active)", borderRadius: 6,
    color: "var(--text-secondary)", cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: 12,
    minHeight: 36, whiteSpace: "nowrap",
  },
  apiLink: {
    color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 11,
    textDecoration: "none", padding: "6px 10px", borderRadius: 4,
    border: "1px solid var(--border)", minHeight: 36,
    display: "flex", alignItems: "center",
  },

  /* Error */
  errorCard: {
    background: "rgba(252,92,124,0.08)", border: "1px solid rgba(252,92,124,0.25)",
    borderRadius: "var(--radius)", padding: 16,
    display: "flex", flexDirection: "column", gap: 10,
  },
  errorTitle: {
    fontFamily: "var(--font-display)", fontWeight: 700,
    fontSize: 13, color: "var(--error)",
  },
  errorMsg: {
    fontFamily: "var(--font-mono)", fontSize: 11,
    color: "var(--text-secondary)", wordBreak: "break-word",
  },
  retryBtn: {
    padding: "8px 16px", background: "none",
    border: "1px solid var(--error)", borderRadius: 6,
    color: "var(--error)", cursor: "pointer",
    fontFamily: "var(--font-mono)", fontSize: 12, alignSelf: "flex-start",
    minHeight: 36,
  },

  /* Welcome */
  welcome: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "60vh", textAlign: "center",
    position: "relative", gap: 16, padding: "24px 0",
  },
  welcomeGlow: {
    position: "absolute", width: "min(400px, 80vw)", height: "min(400px, 80vw)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,92,252,0.10) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  welcomeIcon: { fontSize: "clamp(36px, 10vw, 56px)", color: "var(--accent)", opacity: 0.8 },
  welcomeTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(24px, 7vw, 36px)",
    fontWeight: 800, lineHeight: 1.2, color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  welcomeDesc: {
    fontFamily: "var(--font-mono)", fontSize: "clamp(12px, 3vw, 13px)",
    color: "var(--text-secondary)", maxWidth: 400, lineHeight: 1.7,
    padding: "0 8px",
  },
  featureList: {
    listStyle: "none", display: "flex", flexDirection: "column",
    gap: 6, alignItems: "flex-start",
  },
  featureItem: {
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)",
  },
  featureDot: { color: "var(--accent)", fontSize: 18, lineHeight: 1 },

  /* Processing */
  processingState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "50vh", gap: 20, padding: "20px 0",
  },
  processingAnim: {
    display: "flex", alignItems: "flex-end", gap: 5,
    height: "clamp(60px, 12vw, 90px)",
  },
  processingBar: {
    width: "clamp(8px, 2vw, 12px)", borderRadius: 4,
    animation: "pulse 1.2s ease-in-out infinite alternate",
  },
  processingLabel: {
    fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)",
    animation: "pulse 2s ease-in-out infinite",
  },
  processingStage: {
    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)",
  },

  /* Results */
  results: { display: "flex", flexDirection: "column", gap: 16 },
};
