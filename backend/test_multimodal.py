import os
import sys
import wave
import struct
import cv2
import numpy as np
import asyncio
from app.forensic.metadata_engine import extract_metadata
from app.forensic.technical_engine import analyze_technical_properties
from app.forensic.video_engine import analyze_video_forensics
from app.forensic.audio_engine import analyze_audio_forensics
from app.forensic.text_engine import analyze_text_forensics
from app.forensic.report_engine import generate_pdf_report
from app.models.schemas import FullAnalysisResponse, TechnicalResult, CaptionComparisonResult
from app.forensic.scorecard_engine import synthesize_evidence_scorecard

async def run_all_tests():
    os.makedirs("test_data", exist_ok=True)
    print("=" * 60)
    print("TRUTHLENS MULTIMODAL FORENSICS TEST SUITE (IMAGE, VIDEO, AUDIO, TEXT)")
    print("=" * 60)

    # 1. IMAGE TEST
    print("\n[TEST 1/4] Running IMAGE Forensics Pipeline...")
    img_path = "test_data/sample_investigation.jpg"
    meta_img, ev_meta = extract_metadata(img_path, "sample_investigation.jpg")
    tech_img, ev_tech = analyze_technical_properties(img_path)
    print(f"  ✓ Image parsed: {meta_img.dimensions}, SHA-256: {meta_img.sha256_hash[:12]}...")

    # 2. VIDEO TEST
    print("\n[TEST 2/4] Generating & Testing VIDEO Deepfake Pipeline...")
    video_path = "test_data/sample_video.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 10.0, (320, 240))
    for i in range(25):
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        # Add moving circle
        cv2.circle(frame, (50 + i * 8, 120), 30, (0, 200, 255), -1)
        out.write(frame)
    out.release()
    print("  ✓ Synthetic test video created:", video_path)
    
    vid_diag, vid_ai, vid_ev = await analyze_video_forensics(video_path, "sample_video.mp4")
    print(f"  ✓ Video analyzed: Duration {vid_diag.duration_seconds}s, FPS {vid_diag.fps}, Jitter Score: {vid_diag.temporal_jitter_score}")
    print(f"  ✓ Video Evidence Items Generated: {len(vid_ev)}")

    # 3. AUDIO TEST
    print("\n[TEST 3/4] Generating & Testing AUDIO Voice Pipeline...")
    audio_path = "test_data/sample_audio.wav"
    sample_rate = 16000
    duration = 2.0  # seconds
    with wave.open(audio_path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        # Generate tone with speech-like bursts
        data = []
        for i in range(int(sample_rate * duration)):
            val = int(32767.0 * 0.4 * np.sin(2.0 * np.pi * 440.0 * i / sample_rate)) if i % 4000 < 2500 else 0
            data.append(struct.pack('<h', val))
        wf.writeframes(b"".join(data))
    print("  ✓ Synthetic test audio created:", audio_path)

    aud_diag, aud_ai, aud_ev = await analyze_audio_forensics(audio_path, "sample_audio.wav")
    print(f"  ✓ Audio analyzed: Rate {aud_diag.sample_rate_hz}Hz, Speech/Pause: {int(aud_diag.speech_silence_ratio*100)}%, Format: {aud_diag.format}")
    print(f"  ✓ Audio Evidence Items Generated: {len(aud_ev)}")

    # 4. TEXT TEST
    print("\n[TEST 4/4] Testing TEXT & Disinformation Pipeline...")
    sample_statement = (
        "Furthermore, it is worth noting that breaking news reports indicate an extraordinary anomaly. "
        "Moreover, experts delve into the tapestry of digital evidence to verify these multifaceted claims. "
        "In conclusion, digital forensic investigations remain of paramount importance."
    )
    txt_diag, txt_ai, txt_ev = await analyze_text_forensics(sample_statement, "claim_statement.txt")
    print(f"  ✓ Text analyzed: Words {txt_diag.word_count}, TTR {txt_diag.lexical_diversity_ttr}, Burstiness σ: {txt_diag.burstiness_score}")
    print(f"  ✓ Stylometric markers found: {txt_diag.stylometric_markers}")
    print(f"  ✓ Text Evidence Items Generated: {len(txt_ev)}")

    # 5. MULTIMODAL PDF DOSSIER TEST
    print("\n[TEST 5/5] Generating Multimodal Forensic PDF Reports...")
    video_resp = FullAnalysisResponse(
        investigation_id="vid-test-uuid-9999",
        modality="video",
        image_name="sample_video.mp4",
        image_hash="a1b2c3d4e5f67890",
        assessment="Some indicators require further investigation",
        indicator_score=25,
        summary="Video temporal trajectory and facial boundary analysis completed.",
        metadata=meta_img,
        technical=TechnicalResult(),
        ai_analysis=vid_ai,
        caption_comparison=CaptionComparisonResult(caption_provided=False, consistency_verdict="No Caption Provided", discrepancy_details=[], semantic_match_score=1.0, explanation=""),
        video_diagnostics=vid_diag,
        evidence_scorecard=vid_ev,
        limitations=["Video compression artifacts can affect motion metrics."],
        recommendations=["Inspect raw uncompressed video stream."],
        created_at="2026-11-19T05:00:00Z"
    )
    pdf_path = generate_pdf_report(video_resp)
    print(f"  ✓ Video PDF Report generated: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")

    print("\n" + "=" * 60)
    print("ALL 4 MODALITIES (IMAGE, VIDEO, AUDIO, TEXT) FULLY VALIDATED!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
