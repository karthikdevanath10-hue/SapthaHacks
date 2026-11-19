# TruthLens — AI-Powered Multimodal Digital Forensics & Deepfake Detection System
> **College Hackathon Project | Problem Statement: PS04**  
> *"See Beyond the Image. Discover the Truth."*

---

## 🎯 Executive Summary & Core USP

TruthLens is an enterprise-grade digital forensic investigation platform designed to identify manipulated, synthetic, or misattributed digital imagery. Unlike naive binary detectors that output a single opaque probability (e.g. *"94% fake"*), TruthLens implements a **scientific multi-layer verification methodology** centered around an explainable **Evidence Scorecard**.

### Key Differentiators (USP)
1. **Multi-Layer Forensic Verification**: Combines cryptographic hash checking, EXIF metadata inspection, pixel-level mathematical diagnostics (ELA & spatial sensor noise variance), and Google Gemini Multimodal Vision reasoning.
2. **Dedicated Evidence Scorecard**: Categorizes findings with individual severity ratings, confidence levels, scientific limitations, and a dedicated **"Why was this flagged?"** forensic rationale.
3. **Image-Narrative Cross-Verification**: Leverages Gemini AI to compare user-provided captions or news claims with visual ground-truth to detect out-of-context misattribution (cheapfakes).
4. **Transparent Calibration**: Evaluates evidence as an **Aggregated Indicator Score (0–100)** rather than a fabricated probability of manipulation. Absences of indicators are never equated with proof of authenticity.
5. **Court-Ready PDF Reports**: Automatically compiles a downloadable forensic PDF report containing case metadata, SHA-256 chain-of-custody checksum, scorecards, and legal disclaimers via ReportLab.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons | Responsive glassmorphic cybersecurity investigation dashboard |
| **Backend** | Python 3.9+, FastAPI, Uvicorn, Pydantic | High-performance asynchronous forensic analysis pipeline |
| **Forensics** | OpenCV, Pillow, Piexif, NumPy | Error Level Analysis (ELA 90%), spatial noise variance, EXIF extraction |
| **Multimodal AI** | Google Gemini API (`gemini-1.5-flash`) | Visual optical coherence, lighting physics, and claim cross-verification |
| **Database & Auth** | Supabase PostgreSQL + Row Level Security (RLS) | Case registry, user authentication, and chain-of-custody history |
| **Reporting** | Python ReportLab | Cryptographic, print-ready PDF forensic dossier generator |

---

## 🏗️ Architectural Layers

```
                      ┌───────────────────────────────────────┐
                      │    SUSPECT MEDIA + OPTIONAL CLAIM    │
                      └──────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌─────────────────┐            ┌──────────────────┐             ┌──────────────────┐
│     LAYER 1     │            │     LAYER 2      │             │     LAYER 3      │
│  EXIF & SHA-256 │            │  OpenCV & ELA    │             │  Gemini Vision   │
│  File Headers,  │            │  Noise Variance, │             │  Lighting &      │
│  Camera Make,   │            │  Compression     │             │  Anatomy Physics │
│  Tool Traces    │            │  Degradation     │             │  Consistency     │
└────────┬────────┘            └────────┬─────────┘             └────────┬─────────┘
         │                              │                                │
         └──────────────────────────────┼────────────────────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │              LAYER 4              │
                      │   Caption Cross-Verification      │
                      │   Claim Semantic Discordance      │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │              LAYER 5              │
                      │     EVIDENCE SCORECARD SYNTHESIS  │
                      │     Indicator Score (0-100)       │
                      │     Traceability Rationale        │
                      └─────────────────┬─────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
              ┌─────────────────────┐       ┌─────────────────────┐
              │ Interactive UI View │       │ Cryptographic PDF   │
              │  & Supabase History │       │ Forensic Dossier    │
              └─────────────────────┘       └─────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal in `C:\Hack ps-4\backend`:
   ```powershell
   cd backend
   .\venv\Scripts\activate
   ```
2. *(Optional)* Configure your Google Gemini API key or Supabase credentials in `backend/.env`:
   ```ini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
   *(Note: If no API key is provided, TruthLens automatically activates its transparent offline heuristic fallback engine so you can demo without internet!)*
3. Launch the FastAPI server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   API interactive docs will be live at: **`http://127.0.0.1:8000/docs`**

---

### Step 2: Start the Frontend (Vite + React)

1. Open a second terminal in `C:\Hack ps-4\frontend`:
   ```powershell
   cd frontend
   npm run dev
   ```
2. Open your browser and navigate to: **`http://localhost:5173`**

---

### Step 3: Supabase Setup (Optional for Cloud Sync)

TruthLens comes with built-in **local session & file persistence** so you can demo immediately without setting up cloud credentials. To connect live Supabase cloud:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and paste the contents of `database/schema.sql`.
3. Create the two storage buckets: `truthlens-media` and `truthlens-reports` (see `database/storage_setup.md`).
4. Paste your `SUPABASE_URL` and `SUPABASE_KEY` into `backend/.env` and `frontend/.env`.

---

## 🧪 Demo Strategy for Hackathon Judges

When presenting to judges:

1. **Start on the Landing Page**: Highlight that TruthLens addresses Problem Statement **PS04** not with a naive binary *"fake-or-real"* gauge, but through **multi-layer scientific forensics**.
2. **Upload Suspect Image**:
   - Go to **Investigate**. Upload an image.
   - Enter a contradictory caption (e.g. upload a picture of a sunny day with caption: *"Major flash floods in downtown city yesterday"*).
3. **Highlight the Evidence Scorecard**:
   - Show how the **Evidence Scorecard** breaks down findings into Metadata, Technical, AI Vision, and Caption layers.
   - Click **"Forensic Traceability"** to reveal the **"Why was this flagged?"** rationale and **Scientific Limitations**.
4. **Showcase Layer 4 (Caption Verification)**:
   - Demonstrate that the system flagged the semantic mismatch without erroneously declaring the photograph's pixels fake.
5. **Download the PDF Forensic Dossier**:
   - Click **Download PDF Report** to show the professional ReportLab-generated document complete with SHA-256 file checksum and case ID.
6. **Open Dashboard**:
   - Switch to the **Dashboard** to show past case registries, KPI statistics, and Supabase chain-of-custody records.

---

## 🛡️ License & Ethical Standards
Developed exclusively for educational and investigative research in digital forensics. All automated evaluations require certified analyst corroboration.
