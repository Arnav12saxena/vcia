"""
main.py — Video Color Intelligence Analyzer API
================================================
Production-grade FastAPI backend.

Key production features vs. dev version:
- CORS origins loaded from env (ALLOWED_ORIGINS)
- Configurable upload size via MAX_FILE_MB env
- Job TTL cleanup (jobs auto-expire after JOB_TTL_HOURS)
- /health endpoint with dependency checks
- Static file serving for Electron builds
- Structured error responses
- Request ID header for tracing
- Graceful shutdown cleanup
"""

import asyncio
import gc
import json
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Optional

import aiofiles
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from video_processor import extract_frames, get_video_metadata
from scene_detector import detect_scenes
from exporter import to_json, to_csv, to_css, to_tailwind, to_ase

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
log = logging.getLogger("vcia")

# ─────────────────────────────────────────────
# Configuration from environment
# ─────────────────────────────────────────────
ALLOWED_ORIGINS_RAW = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173,http://localhost:3000",
)
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_RAW.split(",") if o.strip()]
# In production, also allow wildcard if explicitly set
if os.getenv("ALLOW_ALL_ORIGINS", "").lower() in ("1", "true", "yes"):
    ALLOWED_ORIGINS = ["*"]

MAX_FILE_MB = int(os.getenv("MAX_FILE_MB", "500"))
JOB_TTL_HOURS = float(os.getenv("JOB_TTL_HOURS", "2"))

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/vcia_uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".mkv", ".avi", ".webm"}

# ─────────────────────────────────────────────
# In-memory job store
# ─────────────────────────────────────────────
JOBS: Dict[str, Dict] = {}


def _cleanup_expired_jobs():
    """Remove jobs older than JOB_TTL_HOURS from memory."""
    cutoff = time.time() - JOB_TTL_HOURS * 3600
    expired = [jid for jid, j in JOBS.items() if j.get("created_at", 0) < cutoff]
    for jid in expired:
        JOBS.pop(jid, None)
    if expired:
        log.info(f"Cleaned up {len(expired)} expired jobs")
    gc.collect()


# ─────────────────────────────────────────────
# Lifespan (startup/shutdown)
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info(f"VCIA API starting — CORS: {ALLOWED_ORIGINS}")
    log.info(f"Upload dir: {UPLOAD_DIR} — Max file: {MAX_FILE_MB}MB")

    # Periodic cleanup task
    async def cleanup_loop():
        while True:
            await asyncio.sleep(1800)  # every 30 min
            _cleanup_expired_jobs()

    task = asyncio.create_task(cleanup_loop())
    yield
    task.cancel()
    log.info("VCIA API shutting down")


# ─────────────────────────────────────────────
# App
# ─────────────────────────────────────────────
app = FastAPI(
    title="Video Color Intelligence Analyzer",
    version="1.2.0",
    description="Extract, analyze, and export color palettes from video files.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Request-ID"],
)


# ── Request ID middleware ─────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# ── Global exception handler ─────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


# ─────────────────────────────────────────────
# Background analysis worker
# ─────────────────────────────────────────────
async def run_analysis(
    job_id: str,
    video_path: str,
    sample_every_n: int,
    n_colors: int,
    scene_threshold: float,
):
    log.info(f"[{job_id[:8]}] Analysis started: {video_path}")
    try:
        JOBS[job_id]["status"] = "processing"
        JOBS[job_id]["progress"] = 0
        JOBS[job_id]["stage"] = "Reading metadata"

        # 1. Metadata
        metadata = get_video_metadata(video_path)
        metadata["filename"] = JOBS[job_id].get("filename", "video")
        JOBS[job_id]["metadata"] = metadata
        log.info(f"[{job_id[:8]}] {metadata['width']}x{metadata['height']} "
                 f"@ {metadata['fps']}fps, {metadata['duration_formatted']}")

        # 2. Frame extraction
        def progress_cb(done, total):
            JOBS[job_id]["progress"] = int(done / total * 80)
            JOBS[job_id]["stage"] = f"Analyzing frames ({done}/{total})"

        loop = asyncio.get_event_loop()
        frames = await loop.run_in_executor(
            None,
            lambda: extract_frames(
                video_path,
                sample_every_n=sample_every_n,
                n_colors=n_colors,
                resize_dim=150,
                progress_callback=progress_cb,
            ),
        )
        log.info(f"[{job_id[:8]}] Extracted {len(frames)} frames")

        # 3. Scene detection
        JOBS[job_id]["progress"] = 82
        JOBS[job_id]["stage"] = "Detecting scenes"
        scenes = await loop.run_in_executor(
            None,
            lambda: detect_scenes(frames, threshold=scene_threshold),
        )
        log.info(f"[{job_id[:8]}] Detected {len(scenes)} scenes")

        # 4. Finalize
        JOBS[job_id].update({
            "result": {"metadata": metadata, "frames": frames, "scenes": scenes},
            "status": "complete",
            "progress": 100,
            "stage": "Done",
            "completed_at": time.time(),
        })

    except Exception as e:
        import traceback
        log.error(f"[{job_id[:8]}] Analysis failed: {e}", exc_info=True)
        JOBS[job_id].update({
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc(),
        })
    finally:
        try:
            os.remove(video_path)
        except Exception:
            pass


# ─────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────

@app.get("/api/health", tags=["system"])
async def health():
    """Health check — used by Render/Railway health probes."""
    return {
        "status": "ok",
        "version": "1.2.0",
        "active_jobs": sum(1 for j in JOBS.values() if j["status"] == "processing"),
        "total_jobs": len(JOBS),
        "upload_dir": str(UPLOAD_DIR),
    }


@app.post("/api/analyze", tags=["analysis"])
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Video file to analyze"),
    sample_every_n: int = Form(default=5, ge=1, le=120, description="Process every Nth frame"),
    n_colors: int = Form(default=8, ge=3, le=12, description="K-Means clusters"),
    scene_threshold: float = Form(default=0.35, ge=0.05, le=0.95, description="Scene cut sensitivity"),
):
    """Upload a video and start async color analysis."""
    # Validate extension
    suffix = Path(file.filename or "video.mp4").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported format '{suffix}'. Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read and validate size
    content = await file.read()
    size_mb = len(content) / 1024 / 1024
    if size_mb > MAX_FILE_MB:
        raise HTTPException(413, f"File too large ({size_mb:.1f}MB). Maximum: {MAX_FILE_MB}MB")

    # Persist to disk
    job_id = str(uuid.uuid4())
    video_path = str(UPLOAD_DIR / f"{job_id}{suffix}")
    async with aiofiles.open(video_path, "wb") as f:
        await f.write(content)

    log.info(f"[{job_id[:8]}] Queued: {file.filename} ({size_mb:.1f}MB)")

    JOBS[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "stage": "Queued",
        "filename": file.filename,
        "file_size_mb": round(size_mb, 2),
        "created_at": time.time(),
        "result": None,
        "error": None,
    }

    background_tasks.add_task(
        run_analysis,
        job_id,
        video_path,
        sample_every_n,
        n_colors,
        round(scene_threshold, 2),
    )

    return {"job_id": job_id, "status": "queued"}


@app.get("/api/job/{job_id}", tags=["analysis"])
async def get_job(job_id: str, include_frames: bool = True):
    """Poll job status and retrieve results when complete."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, f"Job '{job_id}' not found")

    response = {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "stage": job.get("stage", ""),
        "filename": job.get("filename", ""),
        "file_size_mb": job.get("file_size_mb"),
        "metadata": job.get("metadata"),
        "error": job.get("error"),
        "created_at": job.get("created_at"),
        "completed_at": job.get("completed_at"),
    }

    if job["status"] == "complete" and job.get("result"):
        result = job["result"]
        response["scenes"] = result.get("scenes", [])
        if include_frames:
            response["frames"] = result.get("frames", [])
        else:
            response["frame_count"] = len(result.get("frames", []))

    return response


@app.get("/api/export/{job_id}", tags=["export"])
async def export_results(job_id: str, format: str = "json"):
    """Download analysis results in the requested format."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, f"Job '{job_id}' not found")
    if job["status"] != "complete":
        raise HTTPException(409, "Analysis not complete yet")

    analysis = job["result"]
    fmt = format.lower()
    base = f"vcia_{job_id[:8]}"

    EXPORT_MAP = {
        "json":     (lambda: to_json(analysis),     "application/json",         f"{base}.json"),
        "csv":      (lambda: to_csv(analysis),      "text/csv",                 f"{base}.csv"),
        "css":      (lambda: to_css(analysis),      "text/css",                 f"{base}.css"),
        "tailwind": (lambda: to_tailwind(analysis), "text/javascript",          f"{base}.tailwind.js"),
        "ase":      (lambda: to_ase(analysis),      "application/octet-stream", f"{base}.ase"),
    }

    if fmt not in EXPORT_MAP:
        raise HTTPException(
            400,
            f"Unknown format '{fmt}'. Options: {', '.join(EXPORT_MAP.keys())}"
        )

    generator, mime, filename = EXPORT_MAP[fmt]
    content = generator()
    return Response(
        content,
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@app.get("/api/jobs", tags=["system"])
async def list_jobs():
    """List recent 20 jobs (for debugging / admin)."""
    jobs = sorted(JOBS.values(), key=lambda j: j.get("created_at", 0), reverse=True)[:20]
    return [
        {
            "job_id": j["job_id"],
            "status": j["status"],
            "progress": j["progress"],
            "filename": j.get("filename", ""),
            "file_size_mb": j.get("file_size_mb"),
            "created_at": j.get("created_at"),
            "completed_at": j.get("completed_at"),
        }
        for j in jobs
    ]


@app.delete("/api/job/{job_id}", tags=["system"])
async def delete_job(job_id: str):
    """Delete a completed job and free memory."""
    if job_id not in JOBS:
        raise HTTPException(404, f"Job '{job_id}' not found")
    JOBS.pop(job_id, None)
    gc.collect()
    return {"deleted": job_id}


# ─────────────────────────────────────────────
# Static files (for Electron / self-hosted)
# ─────────────────────────────────────────────
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    # Serve React build at root — API routes take priority
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
