"""
scene_detector.py
-----------------
Detects scene cuts using histogram difference between consecutive frames.
Groups frames into scenes and aggregates their color palettes.
"""

import numpy as np
import cv2
from typing import List, Dict, Optional
from color_extractor import merge_palettes


def compute_histogram_diff(hist1: Dict, hist2: Dict) -> float:
    """
    Compute chi-squared distance between two histogram dicts.
    Each dict has keys 'r', 'g', 'b' with 8-bin arrays.
    """
    total_diff = 0.0
    for ch in ["r", "g", "b"]:
        h1 = np.array(hist1[ch], dtype=np.float32)
        h2 = np.array(hist2[ch], dtype=np.float32)
        # Chi-squared distance
        denom = h1 + h2 + 1e-10
        diff = np.sum((h1 - h2) ** 2 / denom)
        total_diff += diff
    return float(total_diff)


def detect_scenes(
    frame_results: List[Dict],
    threshold: float = 0.35,
    min_scene_frames: int = 2,
) -> List[Dict]:
    """
    Detect scene boundaries from analyzed frame results.

    Args:
        frame_results: Sorted list of per-frame color dicts.
        threshold: Histogram diff threshold to declare a scene cut (0–1 range).
        min_scene_frames: Minimum frames to count as a scene.

    Returns:
        List of scene dicts with frames, palette, timestamps.
    """
    if not frame_results:
        return []

    # Find cut points
    cut_indices = [0]
    for i in range(1, len(frame_results)):
        prev = frame_results[i - 1]
        curr = frame_results[i]
        diff = compute_histogram_diff(prev["histogram"], curr["histogram"])
        if diff > threshold:
            cut_indices.append(i)

    cut_indices.append(len(frame_results))  # sentinel

    scenes = []
    scene_num = 0
    for i in range(len(cut_indices) - 1):
        start_idx = cut_indices[i]
        end_idx = cut_indices[i + 1]
        scene_frames = frame_results[start_idx:end_idx]

        if len(scene_frames) < min_scene_frames:
            # Merge tiny scenes into previous
            if scenes:
                scenes[-1]["frame_indices"].extend(f["frame_index"] for f in scene_frames)
                scenes[-1]["frame_count"] += len(scene_frames)
                scenes[-1]["end_timestamp"] = scene_frames[-1]["timestamp"]
                scenes[-1]["end_formatted"] = scene_frames[-1]["timestamp_formatted"]
                scenes[-1]["duration_seconds"] = round(
                    scenes[-1]["end_timestamp"] - scenes[-1]["start_timestamp"], 3
                )
            continue

        palette = merge_palettes(scene_frames, top_n=8)

        # Collect moods and pick most common
        moods = [f.get("mood", "neutral") for f in scene_frames]
        mood = max(set(moods), key=moods.count)

        start_ts = scene_frames[0]["timestamp"]
        end_ts = scene_frames[-1]["timestamp"]
        duration = end_ts - start_ts

        scenes.append({
            "scene_number": scene_num + 1,
            "start_timestamp": round(start_ts, 3),
            "end_timestamp": round(end_ts, 3),
            "start_formatted": scene_frames[0]["timestamp_formatted"],
            "end_formatted": scene_frames[-1]["timestamp_formatted"],
            "duration_seconds": round(duration, 3),
            "frame_count": len(scene_frames),
            "palette": palette,
            "mood": mood,
            "average_color": _scene_average_color(scene_frames),
            # Only store frame indices for reference, not full data
            "frame_indices": [f["frame_index"] for f in scene_frames],
        })
        scene_num += 1

    return scenes


def _scene_average_color(frames: List[Dict]) -> Dict:
    """Compute the mean average color across all frames in a scene."""
    r_vals = [f["average_color"]["rgb"]["r"] for f in frames]
    g_vals = [f["average_color"]["rgb"]["g"] for f in frames]
    b_vals = [f["average_color"]["rgb"]["b"] for f in frames]
    r, g, b = int(np.mean(r_vals)), int(np.mean(g_vals)), int(np.mean(b_vals))
    return {
        "hex": "#{:02X}{:02X}{:02X}".format(r, g, b),
        "rgb": {"r": r, "g": g, "b": b},
    }
