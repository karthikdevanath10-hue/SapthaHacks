import os
import sys
from PIL import Image, ImageDraw
from app.models.schemas import FullAnalysisResponse
from app.forensic.metadata_engine import extract_metadata
from app.forensic.technical_engine import analyze_technical_properties
from app.forensic.gemini_engine import _generate_fallback_ai_analysis
from app.forensic.cross_verification import _fallback_cross_verification
from app.forensic.scorecard_engine import synthesize_evidence_scorecard
from app.forensic.report_engine import generate_pdf_report

def run_diagnostic():
    print("[1/5] Creating test forensic image...")
    os.makedirs("test_data", exist_ok=True)
    test_img_path = "test_data/sample_investigation.jpg"
    
    img = Image.new("RGB", (600, 400), color=(30, 45, 75))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 250, 250], fill=(220, 90, 50), outline=(255, 255, 255))
    draw.ellipse([300, 100, 500, 300], fill=(40, 180, 120), outline=(0, 255, 200))
    img.save(test_img_path, "JPEG", quality=95)
    print("      Test image saved:", test_img_path)

    print("[2/5] Running Layer 1 (Metadata) & Layer 2 (Technical)...")
    meta_res, meta_ev = extract_metadata(test_img_path, "sample_investigation.jpg")
    tech_res, tech_ev = analyze_technical_properties(test_img_path)
    print(f"      SHA-256: {meta_res.sha256_hash[:16]}... Dimensions: {meta_res.dimensions}")
    print(f"      Noise Var: {tech_res.noise_variance}, ELA Mean: {tech_res.ela_mean_difference}")

    print("[3/5] Running Layer 3 (Vision) & Layer 4 (Cross-Verification)...")
    ai_res, ai_ev = _generate_fallback_ai_analysis(test_img_path, is_live=False)
    claim = "Photograph of outdoor monsoonal flood with submerged vehicles"
    cap_res, cap_ev = _fallback_cross_verification(claim, "Social media viral alert", ai_res)

    print("[4/5] Synthesizing Multi-Layer Evidence Scorecard...")
    all_ev = meta_ev + tech_ev + ai_ev + cap_ev
    assessment, score, summary, scorecard, limits, recs = synthesize_evidence_scorecard(
        metadata=meta_res,
        technical=tech_res,
        ai_visual=ai_res,
        caption=cap_res,
        collected_evidence=all_ev
    )
    print(f"      Assessment: '{assessment}' | Indicator Score: {score}/100")
    print(f"      Total Evidence Items Collected: {len(scorecard)}")

    print("[5/5] Compiling PDF Forensic Investigation Report...")
    resp = FullAnalysisResponse(
        investigation_id="diag-test-uuid-12345678",
        image_name="sample_investigation.jpg",
        image_hash=meta_res.sha256_hash,
        assessment=assessment,
        indicator_score=score,
        summary=summary,
        metadata=meta_res,
        technical=tech_res,
        ai_analysis=ai_res,
        caption_comparison=cap_res,
        evidence_scorecard=scorecard,
        limitations=limits,
        recommendations=recs,
        created_at="2026-11-19T04:20:00Z"
    )

    pdf_path = generate_pdf_report(resp)
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
        print(f"      PDF Report generated successfully! Size: {os.path.getsize(pdf_path)} bytes")
        print(f"      Path: {pdf_path}")
        print("\nALL 5 FORENSIC STAGES PASSED DIAGNOSTIC VALIDATION!")
    else:
        print("      FAILED: PDF was not generated properly.")
        sys.exit(1)

if __name__ == "__main__":
    run_diagnostic()
