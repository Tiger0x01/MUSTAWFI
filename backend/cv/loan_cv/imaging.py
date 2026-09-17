from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps
from .layout import MARKERS, ORIENTATION_DOT, crop

class PhotoError(ValueError):
    pass

def read_image(path):
    with Image.open(Path(path)) as im:
        return cv2.cvtColor(np.array(ImageOps.exif_transpose(im).convert('RGB')), cv2.COLOR_RGB2BGR)

def gray(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim==3 else image

def small(image, limit=1400):
    scale = min(1., limit/max(image.shape[:2]))
    return cv2.resize(image, None, fx=scale, fy=scale), scale

def ink_mask(image):
    g = gray(image)
    bg = cv2.GaussianBlur(g, (0, 0), 9)
    normalized = cv2.divide(g, bg, scale=255)
    return np.uint8((normalized < 185) | (g < 85)) * 255

def ink_score(image):
    return float(np.mean(ink_mask(image) > 0))

def digit_tensor_image(image):
    mask = ink_mask(image)
    
    # تنظيف وإغلاق الفراغات الدقيقة في الحبر (لمنع الخلط بين 0 و 9)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    h_img, w_img = mask.shape
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    cleaned = np.zeros_like(mask)
    for i in range(1, count):
        x, y, w, h, area = stats[i, :5]
        if area < 4:
            continue
        if (x <= 1 or y <= 1 or (x + w) >= (w_img - 1) or (y + h) >= (h_img - 1)) and (w >= 0.6 * w_img or h >= 0.6 * h_img):
            continue
        cleaned[labels == i] = 255
    points = cv2.findNonZero(cleaned)
    if points is None:
        return np.zeros((28, 28), dtype=np.uint8)
    x, y, w, h = cv2.boundingRect(points)
    ink = cleaned[y:y+h, x:x+w]
    factor = 20 / max(w, h)
    nw, nh = max(1, round(w * factor)), max(1, round(h * factor))
    ink = cv2.resize(ink, (nw, nh), interpolation=cv2.INTER_AREA)
    out = np.zeros((28, 28), dtype=np.uint8)
    x0, y0 = (28 - nw) // 2, (28 - nh) // 2
    out[y0:y0+nh, x0:x0+nw] = ink
    return out


def align_photo(photo, reference, min_blur=15.):
    if min(photo.shape[:2]) < 200:
        raise PhotoError('Photo resolution is too small.')
    
    a, sa = small(gray(photo))
    b, sb = small(gray(reference))
    blur = float(cv2.Laplacian(a, cv2.CV_64F).var())
    
    rh, rw = reference.shape[:2]
    
    try:
        orb = cv2.ORB_create(nfeatures=6000, fastThreshold=10)
        ka, da = orb.detectAndCompute(a, None)
        kb, db = orb.detectAndCompute(b, None)
        
        if da is not None and db is not None:
            pairs = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(da, db, k=2)
            matches = [m for pair in pairs if len(pair) == 2 for m, n in [pair] if m.distance < 0.75 * n.distance]
            
            if len(matches) < 20:
                raise PhotoError(f'Alignment failed: Not enough features matched ({len(matches)} < 20).')
                
            src = np.float32([ka[m.queryIdx].pt for m in matches]) / sa
            dst = np.float32([kb[m.trainIdx].pt for m in matches]) / sb
            H, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 5.0 / sb)
            
            if H is None or not np.isfinite(H).all():
                raise PhotoError('Alignment failed: Could not compute a valid homography matrix.')
                
            inlier_count = int(inliers.sum())
            if inlier_count < 15:
                raise PhotoError(f'Alignment failed: Not enough RANSAC inliers ({inlier_count} < 15).')
                
            inlier_ratio = inlier_count / len(matches)
            if inlier_ratio < 0.45:
                raise PhotoError(f'Alignment failed: Unreliable matches (ratio {inlier_ratio:.2f} < 0.45).')
                
            aligned = cv2.warpPerspective(photo, H, (rw, rh), borderValue=(255, 255, 255))
            return aligned, {
                'mode': 'homography_matched', 
                'blur_score': blur,
                'matches': len(matches),
                'inliers': inlier_count,
                'inlier_ratio': inlier_ratio
            }
    except Exception as e:
        if isinstance(e, PhotoError):
            raise e
        raise PhotoError(f'Alignment error: {str(e)}')
    
    raise PhotoError("Could not reliably align the loan form.")