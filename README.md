# 🎬 VCIA — Video Content Intelligence & Analysis Platform

## 🧠 AI-Powered Video Scene Analysis, Segmentation & Export Workflow

VCIA is a full-stack AI-powered video analysis platform built for automated scene detection, frame-level analysis, and intelligent export workflows.

It allows users to upload videos, detect scene transitions, analyze video structure, and export meaningful segments for content understanding, editing workflows, and research applications.

This project integrates:

- FastAPI (Backend API + Processing Engine)
- OpenCV (Frame Analysis + Scene Detection)
- FFmpeg-based video handling
- Vite (Frontend UI)
- Render (Backend Deployment)
- Vercel (Frontend Deployment)

The system is fully deployed and publicly accessible.

---

# 📌 Introduction

Video content analysis is important for:

- Content summarization
- Automated editing workflows
- Scene segmentation
- Educational content indexing
- Media intelligence systems

Manual video segmentation is slow, repetitive, and difficult to scale.

VCIA solves this by providing an automated AI-powered workflow for video scene analysis.

---

# 🎯 Project Objective

The goal was to build a complete end-to-end platform that can:

- Upload videos through a web interface
- Read metadata automatically
- Detect scene transitions intelligently
- Analyze frames using OpenCV
- Track progress in real time
- Export useful video segments

The focus was not just model development, but full deployment as a usable product.

---

# 🔧 Core Features

## 🎥 Video Upload System

Users can upload video files directly from the frontend for automatic analysis.

Supports real-world video files including MP4 and common formats.

---

## 🧠 Scene Detection Engine

The backend performs:

- Frame extraction
- Scene transition detection
- Frame difference analysis
- Content segmentation

using OpenCV-powered processing.

---

## 📊 Real-Time Progress Tracking

Users can monitor:

- Metadata reading
- Analysis progress
- Frame processing
- Export workflow

Example:

```text
Analyzing
HOW TO MAKE TRIANGLE FLEXAGON.mp4
43%
Analyzing frames (612/1410)
```

☁️ Deployment
Backend → Render
Live Backend URL

https://vcia-backend.onrender.com

Configured with:

Python 3.11
FastAPI
Gunicorn
OpenCV
Frontend → Vercel

Frontend deployed on Vercel and connected using:

VITE_API_URL=https://vcia-backend.onrender.com

This enables frontend → backend communication.

🧪 Deployment Validation

The complete workflow was successfully tested:

Backend deployment successful
Frontend deployment successful
Public cloud access working
Video upload successful
Metadata reading successful
Frame analysis successful
Scene detection completed successfully

This confirms full end-to-end production readiness.

⚙️ Tech Stack
Category	Technology
Backend	FastAPI
Video Processing	OpenCV
Server	Gunicorn + Uvicorn
Frontend	Vite
Deployment	Render
Hosting	Vercel
Environment	Python 3.11
Version Control	Git + GitHub
🖼 Screenshots
🖼 Main Upload Interface

(Add Screenshot Here)

🖼 Analysis Progress Dashboard

(Add Screenshot Here)

⚠️ Challenges Faced

Major deployment issues included:

Missing requirements.txt
Wrong repo structure
Root directory issues
Pillow build failures
Python 3.14 incompatibility

Resolved by:

Proper GitHub repo restructuring
Root directory correction
Python version pinning (3.11)
Render deployment optimization
🚀 Future Scope

Possible future upgrades:

AI-powered semantic scene understanding
Transcript generation
Subtitle-aware segmentation
Highlight detection
Educational video indexing
Multi-user production scaling
Docker + VPS production deployment
🏁 Conclusion

VCIA successfully delivers a fully deployed AI-powered video analysis system using:

FastAPI for backend services
OpenCV for scene analysis
Vite for frontend interaction
Render + Vercel for cloud deployment

Unlike academic-only projects, this system was deployed, tested, and validated in real production conditions.

This is not just a model.

It is a working product.

📁 Project Structure
vcia/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .python-version
│   └── render.yaml
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── docs/
├── electron/
├── README.md
└── .gitignore
📬 Contact
Arnav Saxena
🔗 LinkedIn

https://www.linkedin.com/in/arnav-saxena-a9a217367

📧 Email

arnav12saxena@gmail.com
