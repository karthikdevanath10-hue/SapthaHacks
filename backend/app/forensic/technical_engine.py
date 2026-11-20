import os
import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Tuple, List, Dict, Any
from app.models.schemas import TechnicalResult, EvidenceItem

def perform_error_level_analysis(filepath: str, quality: int = 90) -> Tuple[float, bool, str]:
    """
    Performs Error Level Analysis (ELA) by resaving the image at a known quality
    and computing difference scale against the original.
    """
    try:
        original = Image.open(filepath).convert("RGB")
        
        # Save to buffer at designated quality
        buffer = io.BytesIO()
        original.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        
        resaved = Image.open(buffer)
        
        # Calculate absolute difference and enhance
        diff = ImageChops.difference(original, resaved)
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 0
        
        # Scale difference
        scale = 255.0 / max(max_diff, 1)
        enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale)
        
        diff_np = np.array(diff, dtype=np.float32)
        mean_diff = float(np.mean(diff_np))
        std_diff = float(np.std(diff_np))
        
        # Spliced or composited images often exhibit high standard deviation of error rates across regions
        anomaly_detected = (std_diff > 18.0 and mean_diff > 12.0)
        observation = (
            f"Mean ELA difference: {mean_diff:.2f}, Std Dev: {std_diff:.2f}. "
            + ("Compression error gradient displays localized variance, suggesting possible multi-source compression or editing." 
               if anomaly_detected else "Compression error distribution appears relatively uniform across examined blocks.")
        )
        return mean_diff, anomaly_detected, observation
    except Exception as e:
        return 0.0, False, f"ELA calculation skipped due to processing error: {str(e)}"

def analyze_technical_properties(filepath: str) -> Tuple[TechnicalResult, List[EvidenceItem]]:
    evidence_items: List[EvidenceItem] = []
    observations: List[str] = []
    suspicious_indicators: List[str] = []

    # Read image using OpenCV
    cv_img = cv2.imread(filepath)
    if cv_img is None:
        # Fallback reading via PIL and convert to numpy
        pil_img = Image.open(filepath).convert("RGB")
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    height, width, channels = cv_img.shape
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

    # 1. Laplacian Variance for Blur / Edge Sharpness
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    # 2. High-Frequency Noise Residual Variance
    # Estimate noise by subtracting a mild Gaussian blurred version from the gray image
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    noise_residual = cv2.absdiff(gray, blurred)
    noise_var = float(np.var(noise_residual))

    # Quadrant noise variance check (to spot spliced regions with discordant noise levels)
    h_mid, w_mid = height // 2, width // 2
    quadrants = [
        noise_residual[0:h_mid, 0:w_mid],
        noise_residual[0:h_mid, w_mid:width],
        noise_residual[h_mid:height, 0:w_mid],
        noise_residual[h_mid:height, w_mid:width]
    ]
    quad_vars = [float(np.var(q)) for q in quadrants if q.size > 0]
    max_quad_ratio = (max(quad_vars) / (min(quad_vars) + 1e-5)) if quad_vars else 1.0

    # 3. Color channel balance
    b_mean, g_mean, r_mean = [float(np.mean(cv_img[:, :, i])) for i in range(3)]
    brightness_mean = float(np.mean(gray))
    contrast_std = float(np.std(gray))

    color_channel_balance = {
        "red_mean": round(r_mean, 2),
        "green_mean": round(g_mean, 2),
        "blue_mean": round(b_mean, 2)
    }

    # 4. Error Level Analysis
    ela_mean, ela_anomaly, ela_obs = perform_error_level_analysis(filepath)
    observations.append(ela_obs)

    # Forensic heuristics evaluation
    # A. Noise Inconsistency Check
    if max_quad_ratio > 3.8 and noise_var > 15.0:
        suspicious_indicators.append(f"Significant noise variance ratio across image segments ({max_quad_ratio:.2f}x difference)")
        evidence_items.append(EvidenceItem(
            id="TECH-01",
            title="Localized Sensor Noise Discontinuity",
            layer="Technical Forensics",
            severity="medium",
            confidence="Moderate Confidence",
            explanation=f"High-frequency sensor noise across image sectors diverges by a factor of {max_quad_ratio:.2f}x.",
            why_flagged="Authentic photos from a single sensor show relatively homogeneous noise profiles; composited or spliced regions introduce discordant noise.",
            limitations="Different lighting zones (e.g. deep shadow vs. bright sky) naturally exhibit differing noise levels without manipulation.",
            evidence_source="High-Pass Spatial Residual Analysis",
            score_impact=15
        ))
    elif noise_var < 2.5 and laplacian_var > 100:
        # Unusually ultra-smooth skin/textures typical of AI denoisers or diffusion models
        observations.append(f"Unusually low sensor noise residual ({noise_var:.2f}) despite high edge definition.")
        evidence_items.append(EvidenceItem(
            id="TECH-02",
            title="Atypical Noise Suppression Profile",
            layer="Technical Forensics",
            severity="low",
            confidence="Preliminary Observation",
            explanation=f"Measured noise residual is exceptionally low ({noise_var:.2f}) while edge transitions remain sharp ({laplacian_var:.1f}).",
            why_flagged="Generative diffusion architectures synthesize imagery via iterative denoising, often resulting in plastic or untextured gradients.",
            limitations="Aggressive smartphone computational photography (e.g. night mode, HDR) also strips sensor noise aggressively.",
            evidence_source="High-Frequency Signal Extraction",
            score_impact=8
        ))
    else:
        observations.append(f"Global noise variance measured at {noise_var:.2f}; spatial noise distribution within typical camera tolerances.")

    # B. ELA findings
    if ela_anomaly:
        evidence_items.append(EvidenceItem(
            id="TECH-03",
            title="Elevated Error Level Compression Variance",
            layer="Technical Forensics",
            severity="medium",
            confidence="Moderate Confidence",
            explanation="Different sections of the image display differing compression degradation rates when resaved.",
            why_flagged="Indicates elements inside the frame may have been subjected to re-compression cycles at different JPEG quality factors.",
            limitations="High-contrast textures and hard edge transitions naturally produce higher compression error residues in standard JPEG algorithms.",
            evidence_source="Error Level Analysis (ELA 90% Matrix)",
            score_impact=12
        ))
    else:
        evidence_items.append(EvidenceItem(
            id="TECH-04",
            title="Consistent Compression Decay Profile",
            layer="Technical Forensics",
            severity="informational",
            confidence="High Confidence",
            explanation="Compression error artifacts degrade uniformly across the image canvas.",
            why_flagged="Uniform compression is standard for unedited single-generation exports.",
            limitations="Full-frame AI-generated images also recompress uniformly when saved for the first time.",
            evidence_source="Error Level Analysis (ELA 90% Matrix)",
            score_impact=0
        ))

    # C. Color Saturation & Chromatic Dynamism Check
    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    saturation_mean = float(np.mean(hsv[:, :, 1]))
    if saturation_mean > 115.0:
        suspicious_indicators.append(f"Atypical hyper-saturation measured ({saturation_mean:.1f}/255), characteristic of generative AI fantasy rendering.")
        evidence_items.append(EvidenceItem(
            id="TECH-05",
            title="Atypical Hyper-Saturation & Synthetic Chromatic Dynamics",
            layer="Technical Forensics",
            severity="medium",
            confidence="Moderate Confidence",
            explanation=f"Mean color saturation ({saturation_mean:.1f}/255) dramatically exceeds standard optical camera sensor color gamut profiles (typically 35–70).",
            why_flagged="Text-to-image diffusion models frequently generate extreme chromatic dynamism, glowing fantasy hues, and hyper-saturated plasma palettes rarely produced by natural camera glass.",
            limitations="Vibrant stage lighting, neon signage, or manual saturation boosting can also elevate color saturation.",
            evidence_source="HSV Color Gamut Spatial Profiler",
            score_impact=15
        ))

    tech_result = TechnicalResult(
        noise_variance=round(noise_var, 2),
        laplacian_variance_blur=round(laplacian_var, 2),
        ela_mean_difference=round(ela_mean, 2),
        ela_anomaly_detected=ela_anomaly,
        color_channel_balance=color_channel_balance,
        brightness_mean=round(brightness_mean, 2),
        contrast_std=round(contrast_std, 2),
        compression_observation=ela_obs,
        observations=observations,
        suspicious_indicators=suspicious_indicators
    )

    return tech_result, evidence_items
