"""
pipeline_runner.py
------------------
Unified pipeline orchestrator that executes the complete BEACON processing chain:
1. Audio extraction (WAV 16kHz mono)
2. Speech-to-Text transcription (Faster-Whisper)
3. Speaker diarization (pyannote.audio)
4. Temporal alignment (Speaker-labelled transcript)
5. Fact extraction (FLAN-T5 + LoRA adapter)
6. Optional compliance evaluation
"""

from pathlib import Path
from typing import Dict, Any, Optional

try:
    from config import OUTPUT_DIR
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"

try:
    from pipeline.audio import extract_audio
    from pipeline.transcription import transcribe_audio
    from pipeline.diarization import diarize_audio
    from pipeline.speaker_transcript import merge_transcript
    from pipeline.fact_extraction import extract_facts
    from compliance.compliance_engine import ComplianceEngine
except ImportError:
    from audio import extract_audio
    from transcription import transcribe_audio
    from diarization import diarize_audio
    from speaker_transcript import merge_transcript
    from fact_extraction import extract_facts
    import sys
    sys.path.append(str(Path(__file__).resolve().parent.parent / "compliance"))
    from compliance_engine import ComplianceEngine


def run_pipeline(
    video_path: Optional[str] = None,
    audio_path: Optional[str] = None,
    transcript_text: Optional[str] = None,
    output_dir: Optional[str] = None,
    run_compliance: bool = True,
    progress_callback=None
) -> Dict[str, Any]:
    """
    Executes the BEACON processing pipeline.
    Supports starting from video, audio, or pre-existing transcript text.
    """
    out_dir = Path(output_dir or OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not video_path and not audio_path and not transcript_text:
        raise ValueError("Provide transcript_text, audio_path, or video_path to run the meeting pipeline.")

    status = {"stages_completed": []}
    report_progress = progress_callback or (lambda stage, message: None)

    # Step 1: Video to Audio
    if video_path and not audio_path:
        report_progress("audio", "Stage 1 of 6: extracting meeting audio.")
        print("\n--- STAGE 1: AUDIO EXTRACTION ---")
        audio_path = extract_audio(video_path, str(out_dir))
        status["stages_completed"].append("audio_extraction")
        status["audio_path"] = audio_path

    # Step 2: Transcription
    transcript_file = out_dir / "transcript.txt"
    if transcript_text:
        with open(transcript_file, "w", encoding="utf-8") as f:
            f.write(transcript_text.strip() + "\n")
        status["stages_completed"].append("transcription")
        status["transcript_path"] = str(transcript_file)
    elif audio_path:
        report_progress("transcription", "Stage 2 of 6: transcribing the meeting.")
        print("\n--- STAGE 2: TRANSCRIPTION ---")
        t_path = transcribe_audio(audio_path, str(out_dir))
        status["stages_completed"].append("transcription")
        status["transcript_path"] = t_path

    # Step 3: Diarization
    diarization_file = out_dir / "diarization.txt"
    if audio_path:
        report_progress("diarization", "Stage 3 of 6: identifying speakers.")
        print("\n--- STAGE 3: SPEAKER DIARIZATION ---")
        d_path = diarize_audio(audio_path, str(out_dir))
        status["stages_completed"].append("diarization")
        status["diarization_path"] = d_path
    elif not diarization_file.exists():
        # Fallback dummy diarization for text-only runs
        with open(diarization_file, "w", encoding="utf-8") as f:
            f.write("[0.00 - 100.00] SPEAKER_01\n")
        status["diarization_path"] = str(diarization_file)

    # Step 4: Speaker Transcript Merging
    report_progress("speaker_transcript", "Stage 4 of 6: merging speakers with the transcript.")
    print("\n--- STAGE 4: SPEAKER TRANSCRIPT MERGE ---")
    speaker_transcript_path, turns = merge_transcript(
        str(transcript_file), str(diarization_file), str(out_dir / "speaker_transcript.txt")
    )
    status["stages_completed"].append("speaker_transcript")
    status["speaker_transcript_path"] = speaker_transcript_path
    status["turns"] = turns

    # Step 5: Fact Extraction
    report_progress("facts", "Stage 5 of 6: extracting decisions, actions, and key facts.")
    print("\n--- STAGE 5: FACT EXTRACTION ---")
    facts = extract_facts(speaker_transcript_path, str(out_dir / "facts.json"))
    status["stages_completed"].append("fact_extraction")
    status["facts"] = facts

    # Step 6: Legal Compliance Analysis
    if run_compliance and facts:
        report_progress("compliance", "Stage 6 of 6: checking legal compliance.")
        print("\n--- STAGE 6: LEGAL COMPLIANCE ANALYSIS ---")
        engine = ComplianceEngine()
        compliance_results = []
        for fact_item in facts:
            statement = fact_item.get("fact", "")
            if statement:
                res = engine.analyze(statement)
                compliance_results.append({
                    "fact_id": fact_item.get("id"),
                    "fact": statement,
                    "analysis": res
                })
        status["stages_completed"].append("compliance_analysis")
        status["compliance_results"] = compliance_results

    return status
