"""
config.py
---------
Unified configuration and path management for the BEACON Legal Meeting Intelligence Platform.
Supports automatic device detection (CUDA, Apple Silicon MPS, CPU) and cross-platform paths.
"""

import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env")
    load_dotenv(BASE_DIR / "pipeline" / ".env")
except ImportError:
    pass

# -----------------------------------------------------------------------------
# DIRECTORIES
# -----------------------------------------------------------------------------
DATA_DIR = Path(os.getenv("BEACON_DATA_DIR", BASE_DIR / "data"))
MODELS_DIR = Path(os.getenv("BEACON_MODELS_DIR", BASE_DIR / "models"))
OUTPUT_DIR = Path(os.getenv("BEACON_OUTPUT_DIR", DATA_DIR / "output"))
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
STANDALONE_HTML_PATH = BASE_DIR / "dist" / "beacon-standalone.html"

# Model paths
CUAD_ARTIFACT_DIR = Path(os.getenv("BEACON_CUAD_DIR", MODELS_DIR / "cuad"))
INDIAN_ARTIFACT_DIR = Path(os.getenv("BEACON_INDIAN_DIR", MODELS_DIR / "indian_corpus"))
LORA_ADAPTER_DIR = Path(os.getenv("BEACON_LORA_DIR", MODELS_DIR / "beacon_flan_t5_v2_1_refined_lora"))

# Base HF models
BASE_FACT_MODEL = os.getenv("BEACON_BASE_FACT_MODEL", "google/flan-t5-base")
DIARIZATION_MODEL = os.getenv("BEACON_DIARIZATION_MODEL", "pyannote/speaker-diarization-community-1")
WHISPER_MODEL_SIZE = os.getenv("BEACON_WHISPER_SIZE", "small")

# Ensure critical data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "sample_meetings").mkdir(parents=True, exist_ok=True)
CUAD_ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# HARDWARE / DEVICE DETECTION
# -----------------------------------------------------------------------------
def get_device():
    """Auto-detect optimal compute device: CUDA -> MPS (Apple Silicon) -> CPU."""
    forced = os.getenv("BEACON_DEVICE")
    if forced:
        return forced

    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        # Apple Silicon support (MPS)
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"

DEVICE = get_device()

# Hugging Face token
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Server configuration
SERVER_HOST = os.getenv("BEACON_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("BEACON_PORT", "8000"))
