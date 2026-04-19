import { useState } from 'react'

const API_BASE = (typeof window !== 'undefined' && window.electronAPI)
  ? '__electron__'
  : (import.meta.env.VITE_API_URL || '')

const FORMATS = [
  { id: 'json',     label: 'JSON',     icon: '{ }', desc: 'Full color data',   ext: '.json' },
  { id: 'csv',      label: 'CSV',      icon: '⊞',   desc: 'Frame spreadsheet', ext: '.csv'  },
  { id: 'css',      label: 'CSS Vars', icon: '#',   desc: 'Custom properties', ext: '.css'  },
  { id: 'tailwind', label: 'Tailwind', icon: '⬡',   desc: 'Colors config',     ext: '.js'   },
  { id: 'ase',      label: 'ASE',      icon: '◈',   desc: 'Adobe swatches',    ext: '.ase'  },
]

export default function ExportPanel({ jobId }) {
  const [loading, setLoading] = useState({})
  const [done,    setDone]    = useState({})
  const [error,   setError]   = useState(null)

  if (!jobId) return null

  const download = async (fmt) => {
    setLoading(l => ({ ...l, [fmt.id]: true }))
    setError(null)
    try {
      if (API_BASE === '__electron__') {
        await window.electronAPI.exportResults(jobId, fmt.id, fmt.ext)
      } else {
        const res = await fetch(`${API_BASE}/api/export/${jobId}?format=${fmt.id}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || `HTTP ${res.status}`)
        }
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url
        a.download = `vcia_${jobId.slice(0,8)}${fmt.ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      setDone(d => ({ ...d, [fmt.id]: true }))
      setTimeout(() => setDone(d => ({ ...d, [fmt.id]: false })), 2000)
    } catch (e) {
      setError(`Export failed: ${e.message}`)
    } finally {
      setLoading(l => ({ ...l, [fmt.id]: false }))
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>Export</div>
      {error && <div style={S.err}>{error}</div>}
      <div style={S.grid}>
        {FORMATS.map(fmt => (
          <button key={fmt.id}
            style={{ ...S.btn, ...(done[fmt.id] ? S.done : {}), ...(loading[fmt.id] ? S.spin : {}) }}
            disabled={loading[fmt.id]}
            onClick={() => download(fmt)}
          >
            <span style={S.icon}>{loading[fmt.id] ? '…' : fmt.icon}</span>
            <div style={S.text}>
              <span style={S.lbl}>{done[fmt.id] ? '✓ Saved' : fmt.label}</span>
              <span style={S.sub}>{fmt.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const S = {
  wrap:  { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 20px' },
  title: { fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:12 },
  err:   { padding:'8px 12px', background:'rgba(252,92,124,0.1)', border:'1px solid rgba(252,92,124,0.3)', borderRadius:6, color:'var(--error)', fontSize:11, marginBottom:10 },
  grid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:8 },
  btn:   { display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius)', cursor:'pointer', textAlign:'left', color:'var(--text-primary)', fontFamily:'var(--font-mono)' },
  done:  { background:'rgba(92,252,140,0.08)', borderColor:'rgba(92,252,140,0.3)' },
  spin:  { opacity:0.5, cursor:'not-allowed' },
  icon:  { width:28, height:28, background:'var(--bg-card)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--accent)', flexShrink:0, border:'1px solid var(--border)' },
  text:  { display:'flex', flexDirection:'column', gap:1, minWidth:0 },
  lbl:   { fontSize:12, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap' },
  sub:   { fontSize:9, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
}
