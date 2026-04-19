import { useState } from "react";
import { useAnalysis } from "./hooks/useAnalysis";
import UploadPanel from "./components/UploadPanel";
import ProgressBar from "./components/ProgressBar";
import ColorTimeline from "./components/ColorTimeline";
import FrameInspector from "./components/FrameInspector";
import SceneList from "./components/SceneList";
import ExportPanel from "./components/ExportPanel";
import StatsSummary from "./components/StatsSummary";

export default function App() {
  const { jobId, status, progress, stage, result, error, filename, submit, reset } = useAnalysis();
  const [selectedFrame, setSelectedFrame] = useState(null);

  const isProcessing = status === "uploading" || status === "processing";
  const isComplete = status === "complete";

  return (
    <div style={styles.app}>
      <div style={styles.scanline} />
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <div>
            <div style={styles.logoTitle}>Video Color Intelligence</div>
            <div style={styles.logoSub}>Analyzer</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {isComplete && (
            <button style={styles.resetBtn} onClick={reset}>← New Analysis</button>
          )}
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={styles.apiLink}>API Docs ↗</a>
        </div>
      </header>

      <main style={styles.main}>
        <aside style={styles.sidebar}>
          {!isComplete && (
            <div style={styles.card}>
              <UploadPanel onSubmit={submit} loading={isProcessing} />
            </div>
          )}
          {isProcessing && (
            <div className="fade-up">
              <ProgressBar progress={progress} stage={stage} filename={filename} />
            </div>
          )}
          {status === "error" && (
            <div style={styles.errorCard} className="fade-up">
              <div style={styles.errorTitle}>Analysis failed</div>
              <div style={styles.errorMsg}>{error}</div>
              <button style={styles.retryBtn} onClick={reset}>Try again</button>
            </div>
          )}
          {isComplete && (
            <div style={styles.card}>
              <FrameInspector frame={selectedFrame} />
            </div>
          )}
          {isComplete && jobId && <ExportPanel jobId={jobId} />}
        </aside>

        <section style={styles.content}>
          {status === "idle" && (
            <div style={styles.welcome} className="fade-up">
              <div style={styles.welcomeGlow} />
              <div style={styles.welcomeIcon}>◈</div>
              <h1 style={styles.welcomeTitle}>Color Intelligence<br />for Video</h1>
              <p style={styles.welcomeDesc}>
                Upload a video to extract dominant colors, detect scene changes,
                visualize color progressions, and export palettes in any format.
              </p>
              <div style={styles.featureList}>
                {["K-Means color clustering", "Scene boundary detection", "Timeline visualization", "5 export formats", "Mood classification"].map((f, i) => (
                  <div key={i} style={styles.featureItem}><span style={styles.featureDot}>·</span><span>{f}</span></div>
                ))}
              </div>
            </div>
          )}

          {isProcessing && (
            <div style={styles.processingState} className="fade-up">
              <div style={styles.processingAnim}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ ...styles.processingBar, height: `${25 + (i % 4) * 20}%`, animationDelay: `${i * 0.1}s`, background: `hsl(${i * 30}, 70%, 60%)` }} />
                ))}
              </div>
              <div style={styles.processingLabel}>Extracting color intelligence…</div>
            </div>
          )}

          {isComplete && result && (
            <div style={styles.results} className="fade-up">
              <StatsSummary metadata={result.metadata} frames={result.frames} scenes={result.scenes} />
              <ColorTimeline frames={result.frames} scenes={result.scenes} selectedFrame={selectedFrame} onSelectFrame={setSelectedFrame} />
              <SceneList scenes={result.scenes} frames={result.frames} onSelectScene={() => {}} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  scanline: { position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.3, pointerEvents: "none", zIndex: 100 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", position: "sticky", top: 0, zIndex: 50 },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 28, color: "var(--accent)", lineHeight: 1 },
  logoTitle: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--text-primary)", lineHeight: 1.1 },
  logoSub: { fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  resetBtn: { padding: "6px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border-active)", borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 },
  apiLink: { color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 10, textDecoration: "none", padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)" },
  main: { display: "grid", gridTemplateColumns: "340px 1fr", gap: 0, flex: 1, minHeight: 0 },
  sidebar: { borderRight: "1px solid var(--border)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", background: "var(--bg-surface)", maxHeight: "calc(100vh - 57px)" },
  content: { padding: "20px 24px", overflowY: "auto", maxHeight: "calc(100vh - 57px)" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px" },
  errorCard: { background: "rgba(252,92,124,0.08)", border: "1px solid rgba(252,92,124,0.25)", borderRadius: "var(--radius)", padding: "16px", display: "flex", flexDirection: "column", gap: 8 },
  errorTitle: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--error)" },
  errorMsg: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", wordBreak: "break-all" },
  retryBtn: { padding: "6px 14px", background: "none", border: "1px solid var(--error)", borderRadius: 6, color: "var(--error)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, alignSelf: "flex-start" },
  welcome: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", position: "relative", gap: 20 },
  welcomeGlow: { position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)", pointerEvents: "none" },
  welcomeIcon: { fontSize: 56, color: "var(--accent)", opacity: 0.8 },
  welcomeTitle: { fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, lineHeight: 1.15, color: "var(--text-primary)", letterSpacing: "-0.02em" },
  welcomeDesc: { fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)", maxWidth: 440, lineHeight: 1.7 },
  featureList: { display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", marginTop: 4 },
  featureItem: { display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" },
  featureDot: { color: "var(--accent)", fontSize: 18 },
  processingState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 24 },
  processingAnim: { display: "flex", alignItems: "flex-end", gap: 4, height: 100 },
  processingBar: { width: 12, borderRadius: 4, animation: "pulse 1.2s ease-in-out infinite alternate" },
  processingLabel: { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", animation: "pulse 2s ease-in-out infinite" },
  results: { display: "flex", flexDirection: "column", gap: 20 },
};
