/**
 * useAnalysis.js — Production hook for video analysis
 * Supports web (fetch) + Electron IPC + upload progress + retry
 */
import { useState, useRef, useCallback, useEffect } from 'react'

function getApiBase() {
  if (typeof window !== 'undefined' && window.electronAPI) return '__electron__'
  return import.meta.env.VITE_API_URL || ''
}
const API_BASE = getApiBase()

async function fetchRetry(url, opts = {}, retries = 3) {
  const { timeout = 20000, ...rest } = opts
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeout)
    try {
      const res = await fetch(url, { ...rest, signal: ctrl.signal })
      clearTimeout(t)
      return res
    } catch (e) {
      clearTimeout(t)
      if (i === retries || e.name === 'AbortError') throw e
      await new Promise(r => setTimeout(r, 600 * Math.pow(2, i)))
    }
  }
}

function xhrUpload(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.timeout = 300000
    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) }
        catch { reject(new Error('Invalid server response')) }
      } else {
        let msg = `Server error (${xhr.status})`
        try { msg = JSON.parse(xhr.responseText).detail || msg } catch {}
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Network error — check your connection'))
    xhr.ontimeout = () => reject(new Error('Upload timed out (5 min limit)'))
    xhr.send(formData)
  })
}

export function useAnalysis() {
  const [jobId,      setJobId]      = useState(null)
  const [status,     setStatus]     = useState('idle')
  const [progress,   setProgress]   = useState(0)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [stage,      setStage]      = useState('')
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [filename,   setFilename]   = useState('')
  const pollRef    = useRef(null)
  const errCount   = useRef(0)
  const mounted    = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; clearInterval(pollRef.current) }
  }, [])

  const set = useCallback((fn) => { if (mounted.current) fn() }, [])

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const poll = useCallback(async (id) => {
    try {
      let data
      if (API_BASE === '__electron__') {
        data = await window.electronAPI.getJob(id)
      } else {
        const res = await fetchRetry(`${API_BASE}/api/job/${id}`, { timeout: 15000 }, 2)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        data = await res.json()
      }
      errCount.current = 0
      set(() => { setProgress(data.progress || 0); setStage(data.stage || '') })
      if (data.status === 'complete') {
        stopPoll()
        set(() => { setStatus('complete'); setResult(data) })
      } else if (data.status === 'error') {
        stopPoll()
        set(() => { setStatus('error'); setError(data.error || 'Analysis failed') })
      }
    } catch (e) {
      if (++errCount.current >= 5) {
        stopPoll()
        set(() => { setStatus('error'); setError('Lost connection to server. Please retry.') })
      }
    }
  }, [set, stopPoll])

  const submit = useCallback(async (formData, fname) => {
    stopPoll()
    errCount.current = 0
    set(() => {
      setStatus('uploading'); setProgress(0); setUploadPct(0)
      setStage('Uploading…'); setResult(null); setError(null)
      setFilename(fname || '')
    })
    try {
      let jobData
      if (API_BASE === '__electron__') {
        jobData = await window.electronAPI.analyzeVideo(formData)
      } else {
        jobData = await xhrUpload(
          `${API_BASE}/api/analyze`, formData,
          pct => set(() => { setUploadPct(pct); setStage(`Uploading… ${pct}%`) })
        )
      }
      set(() => { setJobId(jobData.job_id); setStatus('processing'); setStage('Queued…') })
      pollRef.current = setInterval(() => poll(jobData.job_id), 800)
    } catch (e) {
      set(() => { setStatus('error'); setError(e.message) })
    }
  }, [poll, set, stopPoll])

  const reset = useCallback(() => {
    stopPoll()
    set(() => {
      setJobId(null); setStatus('idle'); setProgress(0); setUploadPct(0)
      setStage(''); setResult(null); setError(null); setFilename('')
    })
  }, [set, stopPoll])

  return {
    jobId, status, progress, uploadPct, stage, result, error, filename,
    submit, reset,
    isProcessing: status === 'uploading' || status === 'processing',
    isComplete:   status === 'complete',
    isError:      status === 'error',
    isIdle:       status === 'idle',
  }
}
