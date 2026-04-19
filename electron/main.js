/**
 * electron/main.js
 * ─────────────────────────────────────────────────────────────────
 * Electron main process for Video Color Intelligence Analyzer.
 *
 * Architecture:
 *  - Spawns the Python FastAPI backend as a child process
 *  - Serves the React build from dist/
 *  - Provides IPC bridge (contextBridge) for renderer ↔ backend
 *  - Handles file dialogs for video open + export save
 *  - Auto-detects Python (bundled via PyInstaller or system Python)
 *  - Graceful shutdown on window close
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path   = require('path')
const fs     = require('fs')
const http   = require('http')
const { spawn, execSync } = require('child_process')
const FormData = require('form-data')
const fetch  = require('node-fetch')

// ── Config ──────────────────────────────────────────────────────
const IS_DEV      = process.env.NODE_ENV === 'development' || !app.isPackaged
const API_PORT    = 48290          // Fixed local port — unlikely to conflict
const API_BASE    = `http://127.0.0.1:${API_PORT}`
const PRELOAD     = path.join(__dirname, 'preload.js')
const DIST_DIR    = path.join(__dirname, '..', 'frontend', 'dist')
const BACKEND_DIR = path.join(__dirname, 'backend')   // Python files
const ICON        = path.join(__dirname, 'assets', 'icon.png')

let mainWindow = null
let backendProcess = null

// ─────────────────────────────────────────────────────────────────
// Backend management
// ─────────────────────────────────────────────────────────────────

function findPython() {
  // 1. Bundled PyInstaller executable (production)
  const bundledExe = path.join(
    process.resourcesPath || BACKEND_DIR,
    'backend',
    process.platform === 'win32' ? 'vcia_server.exe' : 'vcia_server'
  )
  if (fs.existsSync(bundledExe)) return { exe: bundledExe, args: [], bundled: true }

  // 2. System Python with venv (dev fallback)
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py']
    : ['python3', 'python']

  for (const py of candidates) {
    try {
      execSync(`${py} --version`, { stdio: 'pipe' })
      return { exe: py, args: [path.join(BACKEND_DIR, 'main.py')], bundled: false }
    } catch {}
  }
  throw new Error('Python not found. Please install Python 3.10+ or reinstall the application.')
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const { exe, args, bundled } = findPython()
    console.log('[backend] Starting:', exe, args.join(' '), `bundled=${bundled}`)

    const env = {
      ...process.env,
      PORT:            String(API_PORT),
      ALLOWED_ORIGINS: 'file://',
      ALLOW_ALL_ORIGINS: '1',    // Electron uses file:// origin
      UPLOAD_DIR:      path.join(app.getPath('temp'), 'vcia_uploads'),
      MAX_FILE_MB:     '500',
      JOB_TTL_HOURS:   '4',
    }

    const cmd = bundled ? exe : exe
    const cmdArgs = bundled ? [] : args

    // For dev Python, pass uvicorn args
    const fullArgs = bundled ? cmdArgs : [
      '-m', 'uvicorn', 'main:app',
      '--host', '127.0.0.1',
      '--port', String(API_PORT),
      '--log-level', 'warning',
    ]

    backendProcess = spawn(
      bundled ? exe : exe,
      bundled ? [] : fullArgs,
      {
        cwd:   bundled ? path.dirname(exe) : BACKEND_DIR,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }
    )

    backendProcess.stdout.on('data', d => console.log('[backend]', d.toString().trim()))
    backendProcess.stderr.on('data', d => {
      const msg = d.toString().trim()
      if (msg) console.warn('[backend]', msg)
    })

    backendProcess.on('error', err => reject(new Error(`Backend failed to start: ${err.message}`)))
    backendProcess.on('exit', (code, signal) => {
      console.log(`[backend] Exited code=${code} signal=${signal}`)
    })

    // Poll until /api/health responds
    const timeout = 30000
    const start   = Date.now()
    const check   = setInterval(() => {
      http.get(`${API_BASE}/api/health`, res => {
        if (res.statusCode === 200) {
          clearInterval(check)
          console.log('[backend] Ready')
          resolve()
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          clearInterval(check)
          reject(new Error('Backend startup timed out after 30s'))
        }
      })
    }, 500)
  })
}

function stopBackend() {
  if (!backendProcess) return
  console.log('[backend] Stopping…')
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'])
    } else {
      backendProcess.kill('SIGTERM')
    }
  } catch (e) {
    console.error('[backend] Stop error:', e)
  }
  backendProcess = null
}

// ─────────────────────────────────────────────────────────────────
// Window management
// ─────────────────────────────────────────────────────────────────

async function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1400,
    height:          900,
    minWidth:        900,
    minHeight:       600,
    show:            false,
    backgroundColor: '#0a0a0f',
    icon:            fs.existsSync(ICON) ? ICON : undefined,
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload:              PRELOAD,
      contextIsolation:     true,
      nodeIntegration:      false,
      sandbox:              false,
      webSecurity:          true,
      allowRunningInsecureContent: false,
    },
  })

  // Load app
  if (IS_DEV) {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(path.join(DIST_DIR, 'index.html'))
  }

  // Show when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ─────────────────────────────────────────────────────────────────
// IPC handlers — bridge between renderer and backend HTTP API
// ─────────────────────────────────────────────────────────────────

// Health check
ipcMain.handle('api:health', async () => {
  const res = await fetch(`${API_BASE}/api/health`)
  return res.json()
})

// Analyze video — renderer sends file path, we POST it to backend
ipcMain.handle('api:analyze', async (_, { filePath, sampleEveryN, nColors, sceneThreshold }) => {
  const form = new FormData()
  form.append('file', fs.createReadStream(filePath), path.basename(filePath))
  form.append('sample_every_n', String(sampleEveryN || 5))
  form.append('n_colors',       String(nColors || 8))
  form.append('scene_threshold',String(sceneThreshold || 0.35))

  const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
})

// Poll job status
ipcMain.handle('api:getJob', async (_, jobId) => {
  const res = await fetch(`${API_BASE}/api/job/${jobId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
})

// Export and save to file
ipcMain.handle('api:export', async (_, { jobId, format, defaultExt }) => {
  // Ask user where to save
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title:       `Export ${format.toUpperCase()}`,
    defaultPath: `vcia_palette${defaultExt}`,
    filters:     [{ name: format.toUpperCase(), extensions: [defaultExt.replace('.', '')] }],
  })
  if (canceled || !filePath) return { canceled: true }

  const res = await fetch(`${API_BASE}/api/export/${jobId}?format=${format}`)
  if (!res.ok) throw new Error(`Export HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(filePath, buffer)
  return { filePath }
})

// Open video file dialog
ipcMain.handle('dialog:openVideo', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title:       'Select Video File',
    properties:  ['openFile'],
    filters:     [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm'] },
      { name: 'All Files',   extensions: ['*'] },
    ],
  })
  return canceled ? null : filePaths[0]
})

// Open file in OS file manager
ipcMain.handle('shell:showInFolder', (_, filePath) => {
  shell.showItemInFolder(filePath)
})

// ─────────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────────

app.on('ready', async () => {
  console.log('[app] Electron ready, starting backend…')
  try {
    await startBackend()
    await createWindow()
  } catch (err) {
    console.error('[app] Startup error:', err)
    dialog.showErrorBox(
      'VCIA — Startup Error',
      `${err.message}\n\nPlease reinstall the application or contact support.`
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', async () => {
  if (!mainWindow) await createWindow()
})

app.on('before-quit', stopBackend)

// Security: prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.on('new-window', (e) => e.preventDefault())
})
