/**
 * electron/preload.js
 * ─────────────────────────────────────────────────────────────────
 * Secure bridge between the renderer (React) and main process (Node).
 * Only explicitly whitelisted APIs are exposed — no raw Node access.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Platform info ─────────────────────────────────────────
  platform: process.platform,
  isElectron: true,

  // ── Video file dialog ──────────────────────────────────────
  openVideoDialog: () =>
    ipcRenderer.invoke('dialog:openVideo'),

  // ── Backend API proxy ─────────────────────────────────────
  checkHealth: () =>
    ipcRenderer.invoke('api:health'),

  analyzeVideo: (opts) =>
    ipcRenderer.invoke('api:analyze', opts),

  getJob: (jobId) =>
    ipcRenderer.invoke('api:getJob', jobId),

  exportResults: (jobId, format, defaultExt) =>
    ipcRenderer.invoke('api:export', { jobId, format, defaultExt }),

  // ── Shell ─────────────────────────────────────────────────
  showInFolder: (filePath) =>
    ipcRenderer.invoke('shell:showInFolder', filePath),
})
