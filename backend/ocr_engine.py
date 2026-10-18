import io
import time
import re
import asyncio
from typing import Dict, Any, Tuple, List
import numpy as np
import cv2
from PIL import Image

try:
    import winocr
    HAS_WINOCR = True
except ImportError:
    HAS_WINOCR = False

from backend.parser import parse_bank_details

def preprocess_image_for_ocr(image_bytes: bytes) -> Tuple[Image.Image, np.ndarray]:
    """
    Optimizes passbook photo/scan for OCR:
    1. Decode image into OpenCV numpy array
    2. Resize to optimal OCR resolution if too small/large
    3. Auto-deskew angle detection
    4. Contrast stretching & noise reduction
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Invalid or corrupted image format")

    h, w = img_bgr.shape[:2]

    # Resize if image is too small (low res scan) or abnormally large (> 3000px)
    target_w = 1600
    if w < 1000:
        scale = 1200 / w
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
    elif w > 2600:
        scale = 2000 / w
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Detect deskew angle using Hough Lines / minAreaRect on text contours
    try:
        coords = np.column_stack(np.where(gray < 200))
        if len(coords) > 100:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            if abs(angle) > 0.5 and abs(angle) < 25:
                (h_curr, w_curr) = gray.shape
                center = (w_curr // 2, h_curr // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                img_bgr = cv2.warpAffine(img_bgr, M, (w_curr, h_curr), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    except Exception:
        pass  # Skip deskew if complex or failed

    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(gray)

    # Convert back to RGB PIL Image for winocr
    rgb_img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb_img)

    return pil_img, enhanced_gray

def reconstruct_spatial_lines(ocr_result) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Reconstruct lines spatially by grouping words with similar Y coordinates."""
    words = []
    for line in ocr_result.lines:
        for w in line.words:
            words.append({
                'text': w.text,
                'x': float(w.bounding_rect.x),
                'y': float(w.bounding_rect.y),
                'w': float(w.bounding_rect.width),
                'h': float(w.bounding_rect.height)
            })

    # Sort words primarily by y, then x
    words.sort(key=lambda item: (item['y'], item['x']))

    rows = []
    for w in words:
        placed = False
        for row in rows:
            if abs(row['y_avg'] - w['y']) < 14:
                row['words'].append(w)
                row['y_avg'] = sum(x['y'] for x in row['words']) / len(row['words'])
                placed = True
                break
        if not placed:
            rows.append({'y_avg': w['y'], 'words': [w]})

    rows.sort(key=lambda r: r['y_avg'])
    text_lines = []
    for r in rows:
        r['words'].sort(key=lambda w: w['x'])
        text_lines.append(' '.join(w['text'] for w in r['words']))

    return text_lines, words

async def process_passbook_image(image_bytes: bytes) -> Dict[str, Any]:
    start_time = time.time()

    pil_img, _ = preprocess_image_for_ocr(image_bytes)

    if not HAS_WINOCR:
        return {
            "success": False,
            "error": "Windows Media OCR engine not available on this server",
            "fallback_needed": True
        }

    try:
        ocr_res = await winocr.recognize_pil(pil_img)
        lines, words = reconstruct_spatial_lines(ocr_res)
        parsed = parse_bank_details(ocr_res.text, lines)
        duration_ms = round((time.time() - start_time) * 1000, 1)

        return {
            "success": True,
            "data": parsed,
            "lines": lines,
            "words_count": len(words),
            "words_sample": words[:40],  # for frontend bounding box inspection
            "processing_time_ms": duration_ms
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
