# Video Color Intelligence Analyzer
## Production Deployment Guide

---

## Architecture Overview

```
                 ┌─────────────────────────────────┐
                 │         User's Browser           │
                 └────────────┬────────────────────┘
                              │ HTTPS
                 ┌────────────▼────────────────────┐
                 │   Vercel / Netlify (Frontend)    │
                 │   React + Vite static build      │
                 └────────────┬────────────────────┘
                              │ HTTPS API calls
                 ┌────────────▼────────────────────┐
                 │   Render / Railway (Backend)     │
                 │   Python FastAPI + Gunicorn      │
                 └─────────────────────────────────┘

        Desktop:
                 ┌─────────────────────────────────┐
                 │      Electron Shell (Win/Mac)    │
                 │  ┌──────────┐  ┌─────────────┐  │
                 │  │  React   │  │  PyInstaller │  │
                 │  │  (dist/) │  │  vcia_server│  │
                 │  └────┬─────┘  └──────┬──────┘  │
                 │       │  IPC          │ HTTP     │
                 │       └──────────────▶│          │
                 └─────────────────────────────────┘
```

---

## Phase 1 — Web Deployment

### Step 1: Deploy Backend to Render

**Prerequisites:** GitHub account, Render account (free tier works)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial production build"
   git remote add origin https://github.com/YOUR_USERNAME/vcia.git
   git push -u origin main
   ```

2. **Create Render Web Service**
   - Go to https://render.com → New → Web Service
   - Connect your GitHub repository
   - Set **Root Directory** to `backend`
   - Render auto-detects `render.yaml` — click **Apply**

3. **Set Environment Variables** in Render Dashboard:
   ```
   ALLOWED_ORIGINS = https://your-app.vercel.app
   MAX_FILE_MB     = 200
   JOB_TTL_HOURS   = 1
   ```

4. **Note your backend URL**: `https://vcia-api.onrender.com`

5. **Verify health endpoint**:
   ```
   curl https://vcia-api.onrender.com/api/health
   # → {"status":"ok","version":"1.2.0",...}
   ```

> ⚠️ **Render Free Tier**: Services spin down after 15 min of inactivity.
> Upgrade to Starter ($7/mo) for always-on. Use Railway for free always-on.

---

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (optional but recommended)
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend directory**
   ```bash
   cd frontend
   vercel
   # Follow prompts, link to your account
   ```

3. **Set environment variable** in Vercel dashboard:
   - Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://vcia-api.onrender.com`
   - Select: Production + Preview + Development

4. **Redeploy** for env vars to take effect:
   ```bash
   vercel --prod
   ```

5. **Your app is live at**: `https://vcia.vercel.app`

---

### Step 2 Alt: Deploy Frontend to Netlify

```bash
cd frontend
npm run build

# Option A: Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist

# Option B: Netlify UI
# Drag and drop the dist/ folder to app.netlify.com
```

**Set env var in Netlify:**
- Site Settings → Build & Deploy → Environment Variables
- `VITE_API_URL` = `https://vcia-api.onrender.com`

---

### Step 3: Configure CORS

After frontend is deployed, update backend ALLOWED_ORIGINS:

**Render dashboard** → vcia-api → Environment:
```
ALLOWED_ORIGINS = https://vcia.vercel.app,https://vcia.netlify.app
```

Redeploy the backend for changes to take effect.

---

### Step 4: Verify Production

```bash
# 1. Health check
curl https://vcia-api.onrender.com/api/health

# 2. Upload a test video
curl -X POST https://vcia-api.onrender.com/api/analyze \
  -F "file=@test_video.mp4" \
  -F "sample_every_n=15" \
  -F "n_colors=6"
# → {"job_id":"...","status":"queued"}

# 3. Poll result
curl https://vcia-api.onrender.com/api/job/YOUR_JOB_ID

# 4. Export
curl "https://vcia-api.onrender.com/api/export/YOUR_JOB_ID?format=json" -o result.json
```

---

### Step 5: Set Up CI/CD (optional but recommended)

Add these secrets to your GitHub repository:
- Settings → Secrets and variables → Actions

| Secret | Where to find it |
|--------|-----------------|
| `RENDER_API_KEY` | Render → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Render → your service URL (srv-xxxx) |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |
| `VITE_API_URL` | Your Render service URL |

Now every push to `main` auto-deploys both frontend and backend.

---

## Phase 2 — Desktop App (Windows)

### Prerequisites

- Windows 10/11 build machine (or GitHub Actions)
- Node.js 20+
- Python 3.11
- Git

---

### Step 1: Bundle Python Backend with PyInstaller

```bash
cd backend
pip install -r requirements.txt
pip install pyinstaller

# Build the executable
pyinstaller vcia_server.spec --clean

# Output: backend/dist/vcia_server/ (whole folder)
```

### Step 2: Copy Backend to Electron

```bash
# Copy entire bundled backend
xcopy /E /I backend\dist\vcia_server electron\backend\vcia_server

# Final structure:
# electron/
#   main.js
#   preload.js
#   backend/
#     vcia_server/
#       vcia_server.exe   ← main executable
#       (DLLs, .pyd files, etc.)
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install

# Install electron builder
npm install --save-dev electron electron-builder electron-builder-squirrel-windows
```

### Step 4: Build React App for Electron

```bash
cd frontend
# Build with empty VITE_API_URL (Electron uses local backend)
VITE_API_URL="" npm run build
```

### Step 5: Build the Windows Installer

```bash
cd frontend
npm run electron:build:win

# Output: dist-electron/
#   Video Color Intelligence Analyzer Setup 1.2.0.exe
```

The installer is a standard NSIS installer that:
- Installs to `%LOCALAPPDATA%\Programs\VCIA`
- Creates Start Menu shortcut
- Creates Desktop shortcut
- Includes uninstaller

---

### Desktop App Flow

```
User double-clicks VCIA.exe
        │
        ▼
Electron main.js starts
        │
        ├── Finds Python backend:
        │     1. electron/backend/vcia_server.exe (bundled)
        │     2. Falls back to system Python + main.py
        │
        ├── Spawns backend on port 48290
        │     env: ALLOW_ALL_ORIGINS=1
        │
        ├── Polls http://127.0.0.1:48290/api/health
        │     (up to 30 seconds)
        │
        └── Opens BrowserWindow → loads dist/index.html
              │
              React app detects window.electronAPI
              Uses IPC bridge instead of fetch()
```

---

### Signing the Windows Installer (for distribution)

Without code signing, Windows SmartScreen will warn users.
To sign (requires an EV Code Signing Certificate, ~$200/yr):

```bash
# In electron-builder config (package.json build section):
"win": {
  "certificateFile": "cert.pfx",
  "certificatePassword": "PASSWORD",
  "signingHashAlgorithms": ["sha256"]
}
```

For testing, users can bypass SmartScreen by clicking "More info → Run anyway".

---

## Environment Variables Reference

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `ALLOW_ALL_ORIGINS` | `""` | Set to `1` to allow all origins (Electron) |
| `MAX_FILE_MB` | `500` | Maximum upload size |
| `JOB_TTL_HOURS` | `2` | Hours before jobs expire from memory |
| `UPLOAD_DIR` | `/tmp/vcia_uploads` | Temp directory for uploaded videos |
| `PORT` | `8000` | Server port (auto-set by Render/Railway) |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `""` (same origin) | Backend URL for web deployment |
| `VITE_APP_ENV` | `development` | `production` in Vercel/Netlify |

---

## Quick Reference

### Fastest web deployment (5 minutes)

```bash
# 1. Backend → Railway
cd backend
railway login
railway init
railway up
railway variables set ALLOW_ALL_ORIGINS=1

# 2. Frontend → Vercel  
cd ../frontend
npm run build
vercel --prod
# Set VITE_API_URL to your Railway URL in Vercel dashboard
```

### Local development

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

### Desktop dev mode

```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --port 48290

# Terminal 2 — Frontend + Electron
cd frontend
npm run electron:dev
```
