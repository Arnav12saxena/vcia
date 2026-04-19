"""
video_processor.py
------------------
Handles video reading, frame extraction, and parallel frame processing.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Generator, Tuple, Optional
from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing
import base64
import io

from color_extractor import extract_colors_from_frame


def get_video_metadata(video_path: str) -> Dict:
    """Read basic video metadata without decoding frames."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_sec = total_frames / fps if fps > 0 else 0
    cap.release()

    return {
        "fps": round(fps, 3),
        "total_frames": total_frames,
        "width": width,
        "height": height,
        "duration_seconds": round(duration_sec, 2),
        "duration_formatted": _format_time(duration_sec),
    }


def _format_time(seconds: float) -> str:
    """Convert float seconds to HH:MM:SS.mmm string."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def frame_to_thumbnail_b64(frame_bgr: np.ndarray, max_dim: int = 320) -> str:
    """Encode a frame as a base64 JPEG thumbnail string."""
    h, w = frame_bgr.shape[:2]
    scale = max_dim / max(h, w)
    if scale < 1.0:
        frame_bgr = cv2.resize(
            frame_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
        )
    _, buf = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 75])
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def _process_single_frame(args: Tuple) -> Dict:
    """
    Worker function for multiprocessing.
    Args are (frame_index, frame_number, timestamp, frame_bytes, n_colors, resize_dim).
    """
    frame_index, frame_number, timestamp, frame_bytes, n_colors, resize_dim = args
    frame_bgr = cv2.imdecode(np.frombuffer(frame_bytes, np.uint8), cv2.IMREAD_COLOR)
    color_data = extract_colors_from_frame(frame_bgr, n_colors=n_colors, resize_dim=resize_dim)
    thumb = frame_to_thumbnail_b64(frame_bgr, max_dim=240)
    return {
        "frame_index": frame_index,
        "frame_number": frame_number,
        "timestamp": round(timestamp, 3),
        "timestamp_formatted": _format_time(timestamp),
        "thumbnail": thumb,
        **color_data,
    }


def extract_frames(
    video_path: str,
    sample_every_n: int = 1,
    n_colors: int = 8,
    resize_dim: int = 150,
    max_workers: Optional[int] = None,
    progress_callback=None,
) -> List[Dict]:
    """
    Extract and analyze frames from a video file.

    Args:
        video_path: Path to the video file.
        sample_every_n: Process every nth frame (1 = all frames).
        n_colors: Number of dominant colors per frame.
        resize_dim: Internal analysis resolution.
        max_workers: Number of parallel workers (None = auto).
        progress_callback: Optional callable(current, total) for progress.

    Returns:
        List of per-frame color dicts.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Collect frames to process
    frame_jobs = []
    frame_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_number = int(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1
        if frame_number % sample_every_n == 0:
            timestamp = frame_number / fps
            # Encode frame to bytes for process-safe passing
            _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            frame_jobs.append((
                frame_index,
                frame_number,
                timestamp,
                buf.tobytes(),
                n_colors,
                resize_dim,
            ))
            frame_index += 1

    cap.release()

    if not frame_jobs:
        return []

    # Parallel processing
    workers = max_workers or max(1, multiprocessing.cpu_count() - 1)
    results = []

    # Use threads instead of processes for compatibility in containerized envs
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(_process_single_frame, job): i for i, job in enumerate(frame_jobs)}
        completed = 0
        for future in as_completed(futures):
            results.append(future.result())
            completed += 1
            if progress_callback:
                progress_callback(completed, len(frame_jobs))

    # Sort by frame_index
    results.sort(key=lambda x: x["frame_index"])
    return results
