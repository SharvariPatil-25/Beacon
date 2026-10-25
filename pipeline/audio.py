"""
audio.py
--------
Cross-platform audio extraction from meeting video using FFmpeg.
Produces 16 kHz Mono PCM WAV audio.
"""

import argparse
import os
import shutil
import subprocess
import wave
from pathlib import Path

try:
    from config import OUTPUT_DIR
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"


def extract_audio(video_path: str, output_dir: str = None) -> str:
    """Extract 16 kHz mono WAV audio from a video file."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        try:
            from imageio_ffmpeg import get_ffmpeg_exe
            ffmpeg = get_ffmpeg_exe()
        except ImportError as exc:
            raise RuntimeError(
                "FFmpeg is required to extract audio from captured meeting video. "
                "Install imageio-ffmpeg or add FFmpeg to PATH."
            ) from exc

    video = Path(video_path)
    if not video.exists():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    out_dir = Path(output_dir or OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    audio_path = out_dir / f"{video.stem}.wav"

    command = [
        ffmpeg,
        "-y",
        "-i", str(video),
        "-map", "0:a:0",
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-c:a", "pcm_s16le",
        str(audio_path),
    ]

    completed = subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if completed.returncode:
        detail = completed.stderr.decode("utf-8", errors="replace").strip().splitlines()
        reason = detail[-1] if detail else "FFmpeg did not provide an error message."
        raise RuntimeError(
            "The captured media does not contain a decodable audio track. "
            f"FFmpeg reported: {reason}"
        )

    try:
        with wave.open(str(audio_path), "rb") as wav:
            frame_count = wav.getnframes()
            sample_rate = wav.getframerate()
    except (OSError, wave.Error) as exc:
        raise RuntimeError("FFmpeg produced an invalid audio file from the captured media.") from exc
    if frame_count == 0:
        raise RuntimeError("The captured audio track contains no samples.")
    if sample_rate != 16000:
        raise RuntimeError(f"Captured audio was decoded at {sample_rate} Hz instead of 16000 Hz.")

    return str(audio_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract 16 kHz mono WAV audio from video.")
    parser.add_argument("--video", type=str, required=True, help="Path to meeting video file")
    parser.add_argument("--output-dir", type=str, default=str(OUTPUT_DIR), help="Output directory")
    args = parser.parse_args()

    audio = extract_audio(args.video, args.output_dir)
    print("\nAudio extracted successfully:")
    print(audio)