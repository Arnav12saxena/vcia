# Video Color Intelligence Analyzer
### Production-Ready Web + Desktop Application

Extract dominant color palettes, detect scenes, and export in JSON, CSS, Tailwind, or Adobe ASE from any video file.

---

## Live Demo
| | URL |
|---|---|
| **Web App** | `https://vcia.vercel.app` *(after deployment)* |
| **API Docs** | `https://vcia-api.onrender.com/api/docs` |

---

## Quick Start

### Web (local dev)
```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)  
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Desktop (dev)
```bash
cd frontend && npm install
npm run electron:dev
```

---

## Deploy

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for full step-by-step instructions.

**Quick deploy:**
```bash
# Backend → Render
# Frontend → Vercel
# CI/CD → GitHub Actions (.github/workflows/deploy.yml)
```

---

## Project Structure

```
vcia-production/
├── backend/                  Python FastAPI backend
│   ├── main.py               API server (production-grade)
│   ├── color_extractor.py    K-Means color analysis
│   ├── video_processor.py    Frame extraction
│   ├── scene_detector.py     Histogram scene detection
│   ├── exporter.py           JSON/CSV/CSS/Tailwind/ASE
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml           Render.com config
│   ├── railway.toml          Railway config
│   └── vcia_server.spec      PyInstaller spec
│
├── frontend/                 React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/useAnalysis.js    Upload + polling
│   │   └── components/
│   │       ├── UploadPanel.jsx
│   │       ├── ColorTimeline.jsx
│   │       ├── FrameInspector.jsx
│   │       ├── SceneList.jsx
│   │       ├── StatsSummary.jsx
│   │       ├── ExportPanel.jsx
│   │       ├── ProgressBar.jsx
│   │       └── Palette.jsx
│   ├── vercel.json
│   ├── netlify.toml
│   └── package.json          Includes electron-builder config
│
├── electron/                 Desktop app
│   ├── main.js               Electron main process
│   ├── preload.js            Secure IPC bridge
│   └── package.json
│
├── .github/
│   └── workflows/deploy.yml  CI/CD pipeline
│
└── docs/
    └── DEPLOYMENT.md         Full deployment guide
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, Gunicorn, Uvicorn |
| CV / ML | OpenCV, scikit-learn (K-Means), NumPy |
| Frontend | React 18, Vite 5 |
| Desktop | Electron 31, electron-builder |
| Backend bundling | PyInstaller |
| Web hosting | Render (API) + Vercel (frontend) |
| CI/CD | GitHub Actions |
