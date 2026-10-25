# BEACON — AI Legal Meeting Intelligence Platform

> **Illuminate every decision.**  
> BEACON is an end-to-end AI legal intelligence platform that processes meeting video and speech, extracts structured factual decisions and commitments, checks them against legal contracts and statutory rules, and cross-references organizational memory to prevent contradictions.

---

## 1. Unified Project Architecture

This repository unifies the previously separate BEACON components into a single, seamless, production-ready project:

```text
beacon-unified/
├── README.md                      # Comprehensive project guide and reference
├── package.json                   # Root package management and build scripts
├── requirements.txt               # Unified Python dependencies
├── config.py                      # Centralized configuration & cross-platform path resolution
├── run.sh                         # Unified launch and build script (Linux/macOS)
├── start.py                       # Cross-platform Python launcher with auto-browser opening
├── .gitignore                     # Repository exclusion rules
│
├── frontend/                      # React 19 Frontend application
│   ├── package.json               # Frontend dependencies & esbuild config
│   ├── build.mjs                  # esbuild bundler + inlined single-file HTML generator
│   ├── dist/
│   │   └── index.html             # Compiled web application
│   └── src/
│       ├── main.jsx               # Application entry point
│       ├── App.jsx                # Router & page dispatcher
│       ├── Shell.jsx              # Navigation shell with real-time engine status
│       ├── api.js                 # API client bridging React to backend with offline fallback
│       ├── styles.css             # Design system & responsive layout
│       ├── components.jsx         # Context check, compliance cards, meeting cards
│       ├── ui.jsx / icons.jsx     # UI primitives & SVG icon set
│       ├── data/mock.js           # Seed data and offline demo fixtures
│       └── pages/
│           ├── Landing.jsx        # Platform overview
│           ├── Dashboard.jsx      # Metrics, charts, and meeting activity
│           ├── Live.jsx           # Live meeting recording & speaker view
│           ├── KeyPoints.jsx      # Extracted decisions, commitments, deadlines
│           ├── Compliance.jsx     # Meeting compliance intelligence overview
│           ├── PipelineStudio.jsx # [NEW] Interactive Compliance & Pipeline Studio
│           ├── Memory.jsx         # Cross-meeting decision memory & timeline
│           ├── Meetings.jsx       # Historical meeting repository
│           ├── Alerts.jsx         # Actionable compliance & contradiction alerts
│           └── Reports.jsx        # Compliance reports & settings
│
├── dist/
│   └── beacon-standalone.html     # Fully self-contained, single-file HTML distribution
│                                  # (zero install — double click to run in any browser)
│
├── backend/                       # REST API & Application Backend
│   ├── __init__.py
│   └── app.py                     # Multi-threaded REST API server & static host
│
├── pipeline/                      # Speech Processing & Fact Extraction
│   ├── __init__.py
│   ├── audio.py                   # FFmpeg audio extraction (16 kHz mono WAV)
│   ├── transcription.py           # Faster-Whisper ASR with timestamp segments
│   ├── diarization.py             # pyannote.audio speaker diarization
│   ├── speaker_transcript.py      # Overlap alignment (Speaker-labelled transcript)
│   ├── fact_extraction.py         # FLAN-T5-base + BEACON V2.1 LoRA fact extraction
│   ├── evaluate_model.py          # Metric evaluation (Precision, Recall, F1, exact match)
│   ├── pipeline_runner.py         # Unified pipeline orchestrator
│   └── README.md                  # Speech pipeline detailed documentation
│
├── compliance/                    # Legal Compliance Engine
│   ├── __init__.py
│   ├── compliance_engine.py       # Orchestrator combining CUAD, Indian law, & signals
│   ├── cuad_module.py             # CUAD contract classifier, BGE dense retrieval, DeBERTa NLI
│   ├── indian_module.py           # Companies Act 2013 & SEBI (LODR) statutory compliance
│   ├── legal_signals.py           # spaCy NER + POS modality + legal regex rule flags
│   └── save_artifacts_to_drive.py # Model export utility
│
├── models/                        # Checkpoints & weights directory
│   ├── README.md                  # Model download instructions
│   └── cuad/                      # CUAD index and classifier directory
│
└── data/                          # Persistent data store & sample datasets
    ├── memory_store.json          # Sanitized seed history for dashboard and comparisons
    ├── output/                    # Pipeline outputs (transcripts, audio, facts)
    └── sample_meetings/           # Reference sample meetings
        └── operations_review.json
```

---

## 2. Integration of Original Documents

| Original Source | Unified Destination | Enhancements Made |
|---|---|---|
| **`beacon-project.zip`** | `frontend/` | Connected to backend via `api.js`, added live **Engine Studio** (`/app/studio`), live engine status indicator in sidebar, synchronized build script. |
| **`beacon-standalone.html`** | `dist/beacon-standalone.html` | Updated in lockstep with the latest features; functions 100% self-contained offline without requiring any server. |
| **`Beacon-compliance-module.zip`** | `compliance/` | Added cross-platform resilience; added intelligent heuristic knowledge-base fallback for CUAD; added full Companies Act 2013 and SEBI rules to `indian_module.py`. |
| **`Beacon-fact-extraction-module.zip`** | `pipeline/` | Removed hardcoded Windows `D:\` paths; added CLI arguments; auto-device detection (CUDA/MPS/CPU); created `pipeline_runner.py` orchestrator. |

---

## 3. How to Run

### Option 1: Full-Stack Mode (Recommended)

Clone the project, open a terminal in its root directory, and run one command:

```bash
python start.py
```

The launcher automatically installs the Python requirements, installs the frontend dependencies, builds the frontend bundle, starts the backend, and opens the application.

On Linux/macOS, use:

```bash
python3 start.py
```

Then visit: **`http://localhost:8000`** in your browser.

- API Health Status: `http://localhost:8000/api/status`
- Interactive Engine Studio: `http://localhost:8000/#/app/studio`

### Hugging Face speaker diarization

The application runs without a Hugging Face token using the available fallback analysis. The repository includes sanitized seed meeting history so the dashboard, meetings, memory, key-points, and compliance pages are populated immediately after cloning. To enable pyannote speaker diarization, copy `.env.example` to `.env`, set your own `HF_TOKEN`, and restart the application. Never commit `.env` or expose the token publicly.

### Option 2: Standalone Browser Mode (Zero Install)

Simply double-click or open:
```text
dist/beacon-standalone.html
```
in Google Chrome, Safari, Firefox, or Edge. The entire application runs client-side with rich built-in demonstration data, requiring zero installation.

### Option 3: Frontend Development Mode

For live UI development with esbuild hot rebuilds:

```bash
./run.sh dev
# or
cd frontend && npm run dev
```
Serves the development UI at **`http://localhost:5173`**.

---

## 4. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Returns system health, compute device, and model status. |
| `POST` | `/api/compliance/analyze` | Evaluates a decision or statement against CUAD, Indian Law, and linguistic rules. |
| `POST` | `/api/compliance/batch` | Evaluates a list of sentences in batch. |
| `POST` | `/api/pipeline/run` | Executes the end-to-end processing pipeline on meeting transcript/audio/video. |
| `GET` | `/api/meetings` | Lists all meetings with summaries and compliance issue counts. |
| `POST` | `/api/memory/check-conflict` | Compares a proposed decision against Meeting Memory for contradictions. |
| `GET` | `/api/memory/timeline` | Retrieves the historical timeline of organizational decisions. |
| `GET` | `/api/alerts` | Lists open compliance and contradiction alerts. |
| `GET` | `/api/export/standalone` | Downloads the compiled `beacon-standalone.html`. |

---

## 5. Testing & Verification

Run the built-in test suite:

```bash
./run.sh test
```

This verifies:
1. Legal Compliance Engine evaluation (`COMPLIANT`, `NON-COMPLIANT`, `NEEDS REVIEW`).
2. Indian corporate law and SEBI rule triggers.
3. End-to-end pipeline execution (transcription → diarization → FLAN-T5 fact extraction).

---

## 6. Model Weights & Configuration

- **Hardware Acceleration:** Auto-selects NVIDIA CUDA (`cuda`), Apple Silicon (`mps`), or CPU (`cpu`).
- **Hugging Face Token:** For Pyannote speaker diarization, set `HF_TOKEN` in `.env`:
  ```bash
  HF_TOKEN=hf_your_token_here
  ```
- **Custom Trained Weights:** Place fine-tuned checkpoints in `models/cuad/` and `models/beacon_flan_t5_v2_1_refined_lora/`. When weights are absent, BEACON operates seamlessly in **Heuristic Knowledge Base Mode**.

---

## 7. Legal Disclaimer

BEACON is an AI-powered meeting intelligence and compliance assistance tool designed to highlight discussions requiring review. It **does not constitute legal advice** and is not a substitute for qualified legal counsel.
