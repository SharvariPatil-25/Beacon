"""
speaker_transcript.py
---------------------
Combines Whisper speech transcript segments with Pyannote speaker diarization turns
using maximum temporal overlap matching.
"""

import argparse
import re
from pathlib import Path

try:
    from config import OUTPUT_DIR
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"


def load_transcript(transcript_file: Path):
    pattern = re.compile(r"\[(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\]\s*(.*)")
    segments = []
    with open(transcript_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            m = pattern.match(line)
            if m:
                segments.append({
                    "start": float(m.group(1)),
                    "end": float(m.group(2)),
                    "text": m.group(3).strip()
                })
    return segments


def load_diarization(diarization_file: Path):
    pattern = re.compile(r"\[(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\]\s*(\S+)")
    turns = []
    with open(diarization_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            m = pattern.match(line)
            if m:
                turns.append({
                    "start": float(m.group(1)),
                    "end": float(m.group(2)),
                    "speaker": m.group(3)
                })
    return turns


def find_speaker(segment, diarization):
    best_speaker = "SPEAKER_UNKNOWN"
    best_overlap = 0.0
    for turn in diarization:
        overlap_start = max(segment["start"], turn["start"])
        overlap_end = min(segment["end"], turn["end"])
        overlap = max(0.0, overlap_end - overlap_start)
        if overlap > best_overlap:
            best_overlap = overlap
            best_speaker = turn["speaker"]
    return best_speaker


def merge_transcript(transcript_path: str = None, diarization_path: str = None, output_path: str = None):
    t_file = Path(transcript_path or (OUTPUT_DIR / "transcript.txt"))
    d_file = Path(diarization_path or (OUTPUT_DIR / "diarization.txt"))
    out_file = Path(output_path or (OUTPUT_DIR / "speaker_transcript.txt"))

    out_file.parent.mkdir(parents=True, exist_ok=True)

    if not t_file.exists():
        raise FileNotFoundError(f"Transcript not found: {t_file}")
    if not d_file.exists():
        raise FileNotFoundError(f"Diarization file not found: {d_file}")

    transcript = load_transcript(t_file)
    diarization = load_diarization(d_file)

    merged = []
    for segment in transcript:
        spk = find_speaker(segment, diarization)
        merged.append({
            "start": segment["start"],
            "end": segment["end"],
            "speaker": spk,
            "text": segment["text"]
        })

    with open(out_file, "w", encoding="utf-8") as f:
        for item in merged:
            f.write(f"[{item['start']:.2f} - {item['end']:.2f}] {item['speaker']}: {item['text']}\n")

    print(f"Speaker-labelled transcript created: {len(merged)} turns -> {out_file}")
    return str(out_file), merged


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge transcript and diarization turns.")
    parser.add_argument("--transcript", type=str, default=None, help="Path to transcript.txt")
    parser.add_argument("--diarization", type=str, default=None, help="Path to diarization.txt")
    parser.add_argument("--output", type=str, default=None, help="Path to output speaker_transcript.txt")
    args = parser.parse_args()

    merge_transcript(args.transcript, args.diarization, args.output)