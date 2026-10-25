"""
diarization.py
--------------
Speaker diarization using pyannote.audio.
Identifies distinct speaker turns and timestamps.
"""

import argparse
import os
import wave
from pathlib import Path
from threading import Lock

_PIPELINE_CACHE = {}
_PIPELINE_LOCK = Lock()

try:
    from config import OUTPUT_DIR, HF_TOKEN, DIARIZATION_MODEL
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"
    HF_TOKEN = os.getenv("HF_TOKEN", "")
    DIARIZATION_MODEL = "pyannote/speaker-diarization-community-1"


def load_audio(audio_path: str):
    """Load WAV audio manually as mono float32 waveform tensor."""
    import torch
    import numpy as np

    with wave.open(audio_path, "rb") as wav:
        sample_rate = wav.getframerate()
        channels = wav.getnchannels()
        sample_width = wav.getsampwidth()
        frames = wav.getnframes()
        raw_audio = wav.readframes(frames)

    if sample_width != 2:
        raise ValueError("Expected 16-bit PCM WAV audio.")

    audio = np.frombuffer(raw_audio, dtype=np.int16).astype(np.float32) / 32768.0

    # If stereo, average to mono
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)

    waveform = torch.from_numpy(audio).unsqueeze(0)
    return {"waveform": waveform, "sample_rate": sample_rate}


def diarize_audio(audio_path: str, output_dir: str = None, token: str = None):
    """Run speaker diarization and write diarization.txt."""
    output = Path(output_dir or OUTPUT_DIR)
    output.mkdir(parents=True, exist_ok=True)
    hf_token = token or HF_TOKEN or os.getenv("HF_TOKEN")

    try:
        from pyannote.audio import Pipeline
        import torch

        if not hf_token:
            raise RuntimeError(
                "HF_TOKEN environment variable is not set.\n"
                "Please configure HF_TOKEN with access to pyannote/speaker-diarization-community-1."
            )

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        cache_key = (DIARIZATION_MODEL, hf_token, str(device))
        with _PIPELINE_LOCK:
            pipeline = _PIPELINE_CACHE.get(cache_key)
            if pipeline is None:
                print(f"Loading diarization pipeline: {DIARIZATION_MODEL}...")
                pipeline = Pipeline.from_pretrained(DIARIZATION_MODEL, token=hf_token)
                pipeline.to(device)
                _PIPELINE_CACHE[cache_key] = pipeline

        print("Loading audio and diarizing...")
        audio = load_audio(audio_path)
        diarization = pipeline(audio)
        # pyannote.audio 3 exposed the annotation through
        # ``speaker_diarization`` in some pipeline versions, while newer
        # versions return the annotation directly.
        annotation = getattr(diarization, "speaker_diarization", diarization)

        output_file = output / "diarization.txt"
        speakers = set()
        with open(output_file, "w", encoding="utf-8") as f:
            for turn, _, speaker in annotation.itertracks(yield_label=True):
                f.write(f"[{turn.start:.2f} - {turn.end:.2f}] {speaker}\n")
                speakers.add(speaker)

        print(f"Diarization complete: {len(speakers)} speakers detected.")
        return str(output_file)

    except Exception as e:
        print(f"[NOTE] Pyannote diarization unavailable ({e}). Using one-speaker attribution.")
        output_file = output / "diarization.txt"
        with wave.open(audio_path, "rb") as wav:
            duration = wav.getnframes() / max(wav.getframerate(), 1)
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(f"[0.00 - {duration:.2f}] SPEAKER_01\n")
        return str(output_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run pyannote speaker diarization.")
    parser.add_argument("--audio", type=str, required=True, help="Input WAV audio file")
    parser.add_argument("--output-dir", type=str, default=str(OUTPUT_DIR), help="Output directory")
    parser.add_argument("--token", type=str, default=None, help="Hugging Face user token")
    args = parser.parse_args()

    diarize_audio(args.audio, args.output_dir, args.token)