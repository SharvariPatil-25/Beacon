"""
transcription.py
----------------
Speech-to-text transcription using Faster-Whisper.
Automatically configures device (CUDA, CPU) and supports custom models.
"""

import argparse
import os
import site
import sys
from pathlib import Path
from threading import Lock

_MODEL_CACHE = {}
_MODEL_LOCK = Lock()

# Safe Windows CUDA DLL handling
if os.name == "nt" and hasattr(os, "add_dll_directory"):
    site_packages = [Path(path) for path in site.getsitepackages()]
    CUDA_DLL_DIRS = [
        path
        for root in site_packages
        for path in (
            root / "nvidia" / "cublas" / "bin",
            root / "nvidia" / "cuda_runtime" / "bin",
            root / "nvidia" / "cudnn" / "bin",
            root / "torch" / "lib",
        )
    ]
    for dll_dir in CUDA_DLL_DIRS:
        if dll_dir.is_dir():
            try:
                os.add_dll_directory(str(dll_dir))
                os.environ["PATH"] = str(dll_dir) + os.pathsep + os.environ["PATH"]
            except Exception:
                pass

try:
    from config import OUTPUT_DIR, WHISPER_MODEL_SIZE
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"
    WHISPER_MODEL_SIZE = "small"


def transcribe_audio(
    audio_path: str,
    output_dir: str = None,
    model_size: str = None,
    device: str = None,
    fast: bool = False,
):
    """Transcribe audio to timestamped transcript segments using Faster-Whisper."""
    output = Path(output_dir or OUTPUT_DIR)
    output.mkdir(parents=True, exist_ok=True)

    model_size = model_size or WHISPER_MODEL_SIZE

    try:
        from faster_whisper import WhisperModel

        device = device or "cpu"
        compute_type = "float16" if device == "cuda" else "int8"

        cache_key = (model_size, device, compute_type)
        with _MODEL_LOCK:
            model = _MODEL_CACHE.get(cache_key)
            if model is None:
                print(f"Loading Whisper model ({model_size}) on {device}...")
                model = WhisperModel(model_size, device=device, compute_type=compute_type)
                _MODEL_CACHE[cache_key] = model

        print(f"Transcribing {audio_path}...")
        segments, info = model.transcribe(
            audio_path,
            beam_size=1 if fast else 5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 250 if fast else 500},
            condition_on_previous_text=False,
        )
        segments = list(segments)

        # Shared-tab audio can be quiet enough for the VAD pass to remove all
        # speech. Retry without VAD before declaring the capture unusable.
        if not segments and not fast:
            print("Whisper VAD found no speech; retrying without VAD...")
            segments, info = model.transcribe(
                audio_path,
                beam_size=5,
                vad_filter=False,
                condition_on_previous_text=False,
            )
            segments = list(segments)

        if not segments:
            raise RuntimeError(
                "The captured audio was decoded successfully, but Faster-Whisper "
                "found no speech. Confirm that the shared Meet tab was playing audio "
                "and that 'Share tab audio' was enabled."
            )

        transcript_path = output / "transcript.txt"
        with open(transcript_path, "w", encoding="utf-8") as f:
            for s in segments:
                f.write(f"[{s.start:.2f} - {s.end:.2f}] {s.text.strip()}\n")

        print(f"Transcription completed ({len(segments)} segments, lang: {info.language}).")
        return str(transcript_path)

    except ImportError as exc:
        raise RuntimeError(
            "Faster-Whisper could not be imported in the backend Python environment. "
            "Install faster-whisper and its runtime dependencies, then restart the backend. "
            f"Import detail: {exc}"
        ) from exc


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe audio using Faster-Whisper.")
    parser.add_argument("--audio", type=str, required=True, help="Path to input audio file")
    parser.add_argument("--output-dir", type=str, default=str(OUTPUT_DIR), help="Output directory")
    parser.add_argument("--model-size", type=str, default="small", help="Whisper model size")
    args = parser.parse_args()

    transcribe_audio(args.audio, args.output_dir, args.model_size)