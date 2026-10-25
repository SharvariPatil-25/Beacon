"""
pipeline package
----------------
Speech processing, diarization, and fact extraction for BEACON.
"""

from pipeline.audio import extract_audio
from pipeline.transcription import transcribe_audio
from pipeline.diarization import diarize_audio
from pipeline.speaker_transcript import merge_transcript
from pipeline.fact_extraction import extract_facts
from pipeline.pipeline_runner import run_pipeline
from pipeline.facial_emotion import FacialEmotionAnalyzer
from pipeline.google_meet import GoogleMeetProcessor, extract_meet_code

__all__ = [
    "extract_audio",
    "transcribe_audio",
    "diarize_audio",
    "merge_transcript",
    "extract_facts",
    "run_pipeline",
    "FacialEmotionAnalyzer",
    "GoogleMeetProcessor",
    "extract_meet_code"
]
