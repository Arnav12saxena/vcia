"""
color_extractor.py
------------------
Extracts dominant colors, average color, and histogram from video frames.
Uses K-Means clustering for dominant color detection.
"""

import numpy as np
import cv2
from sklearn.cluster import KMeans
from typing import List, Dict, Tuple
import warnings

warnings.filterwarnings("ignore")


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Convert (R, G, B) tuple to #RRGGBB hex string."""
    return "#{:02X}{:02X}{:02X}".format(int(rgb[0]), int(rgb[1]), int(rgb[2]))


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert #RRGGBB hex string to (R, G, B) tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def classify_mood(dominant_colors: List[Dict]) -> str:
    """
    Classify the color mood based on dominant palette.
    Returns one of: warm, cool, cinematic, neutral, vibrant, muted.
    """
    if not dominant_colors:
        return "neutral"

    total_weight = sum(c["percentage"] for c in dominant_colors)
    if total_weight == 0:
        return "neutral"

    avg_h, avg_s, avg_v = 0.0, 0.0, 0.0
    for c in dominant_colors:
        w = c["percentage"] / total_weight
        rgb = c["rgb"]
        r, g, b = rgb["r"], rgb["g"], rgb["b"]
        bgr = np.uint8([[[b, g, r]]])
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[0][0]
        avg_h += hsv[0] * w
        avg_s += hsv[1] * w
        avg_v += hsv[2] * w

    # Hue: 0–30 & 150–180 = warm, 90–150 = cool
    # Saturation: 0–80 = muted, 80–255 = vibrant
    # Value: 0–80 = dark/cinematic, 80–255 = bright
    if avg_s < 40:
        return "muted"
    if avg_v < 80:
        return "cinematic"
    if avg_s > 150 and avg_v > 150:
        return "vibrant"
    if avg_h < 30 or avg_h > 150:
        return "warm"
    if 90 <= avg_h <= 150:
        return "cool"
    return "neutral"


def extract_colors_from_frame(
    frame_bgr: np.ndarray,
    n_colors: int = 8,
    resize_dim: int = 150,
) -> Dict:
    """
    Extract color information from a single BGR frame.

    Args:
        frame_bgr: OpenCV BGR image array.
        n_colors: Number of dominant colors to extract (K in KMeans).
        resize_dim: Resize longest edge to this for speed.

    Returns:
        dict with keys: dominant_colors, average_color, histogram
    """
    # --- Downscale for speed ---
    h, w = frame_bgr.shape[:2]
    scale = resize_dim / max(h, w)
    if scale < 1.0:
        frame_bgr = cv2.resize(
            frame_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
        )

    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

    # --- Average color ---
    avg_rgb = frame_rgb.mean(axis=(0, 1)).astype(int)
    average_color = {
        "hex": rgb_to_hex(avg_rgb),
        "rgb": {"r": int(avg_rgb[0]), "g": int(avg_rgb[1]), "b": int(avg_rgb[2])},
    }

    # --- K-Means dominant colors ---
    pixels = frame_rgb.reshape(-1, 3).astype(np.float32)

    # Use fewer clusters than pixels
    actual_k = min(n_colors, len(pixels))
    km = KMeans(n_clusters=actual_k, n_init=3, max_iter=50, random_state=42)
    km.fit(pixels)

    centers = km.cluster_centers_.astype(int)
    labels = km.labels_
    counts = np.bincount(labels, minlength=actual_k)
    total_pixels = len(pixels)

    # Sort by frequency descending
    order = np.argsort(-counts)
    dominant_colors = []
    for idx in order:
        rgb = centers[idx]
        pct = round(counts[idx] / total_pixels * 100, 2)
        dominant_colors.append(
            {
                "hex": rgb_to_hex(rgb),
                "rgb": {"r": int(rgb[0]), "g": int(rgb[1]), "b": int(rgb[2])},
                "percentage": pct,
            }
        )

    # --- Color histogram (8 bins per channel, normalized) ---
    histogram = {}
    for i, channel in enumerate(["r", "g", "b"]):
        hist = cv2.calcHist([frame_rgb], [i], None, [8], [0, 256])
        hist = (hist / hist.sum()).flatten().tolist()
        histogram[channel] = [round(v, 4) for v in hist]

    mood = classify_mood(dominant_colors)

    return {
        "dominant_colors": dominant_colors,
        "average_color": average_color,
        "histogram": histogram,
        "mood": mood,
    }


def merge_palettes(frame_results: List[Dict], top_n: int = 8) -> List[Dict]:
    """
    Aggregate frame-level color results into a single scene palette.
    Weights each frame's contribution equally.
    """
    if not frame_results:
        return []

    # Collect all colors weighted by percentage
    color_weights: Dict[str, float] = {}
    for frame in frame_results:
        for c in frame.get("dominant_colors", []):
            h = c["hex"]
            color_weights[h] = color_weights.get(h, 0) + c["percentage"]

    # Normalize
    total = sum(color_weights.values())
    merged = [
        {
            "hex": h,
            "rgb": {"r": int(h[1:3], 16), "g": int(h[3:5], 16), "b": int(h[5:7], 16)},
            "percentage": round(w / total * 100, 2),
        }
        for h, w in sorted(color_weights.items(), key=lambda x: -x[1])
    ]
    return merged[:top_n]
