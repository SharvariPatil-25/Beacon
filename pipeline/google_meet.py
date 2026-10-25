"""
google_meet.py
--------------
Google Meet ingestion, live capture bridge, and multi-modal analysis engine.
Integrates:
- Google Meet URL / session parsing
- Screen & camera audio/video processing
- Real-time facial emotion recognition (happy / agitated / serious / disappointed)
- Speech-to-text transcript alignment
- FLAN-T5 fact extraction & legal compliance evaluation
- Meeting Executive Summarization
"""

import re
import time
from typing import Dict, Any, Optional, List
from pathlib import Path

try:
    from config import OUTPUT_DIR
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"

from pipeline.facial_emotion import FacialEmotionAnalyzer
from compliance.compliance_engine import ComplianceEngine
from pipeline.pipeline_runner import run_pipeline

MEET_URL_REGEX = re.compile(r"(?:https?://)?meet\.google\.com/([a-z]{3}-[a-z]{4}-[a-z]{3})", re.I)

def extract_meet_code(url_or_code: str) -> Optional[str]:
    """Extracts the 10-character Google Meet code (xxx-yyyy-zzz) from a URL or raw string."""
    m = MEET_URL_REGEX.search(url_or_code.strip())
    if m:
        return m.group(1).lower()

    clean = url_or_code.strip().lower()
    if re.match(r"^[a-z]{3}-[a-z]{4}-[a-z]{3}$", clean):
        return clean
    return None


class GoogleMeetProcessor:
    def __init__(self):
        self.emotion_analyzer = FacialEmotionAnalyzer()
        self.compliance_engine = ComplianceEngine()

    def process_meet(
        self,
        meet_input: str,
        title: str = "Google Meet Session",
        transcript_turns: Optional[List[Dict[str, Any]]] = None,
        emotion_observations: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Processes a Google Meet session:
        - Extracts meeting code
        - Runs facial emotion analysis across every dialogue turn
        - Extracts facts and legal compliance checks
        - Generates multi-modal summary
        """
        meet_code = extract_meet_code(meet_input) or "gmt-live-sync"
        turns = transcript_turns or []
        if not turns:
            raise ValueError("The meeting contains no captured transcript turns.")

        print(f"\n[Google Meet Processor] Ingesting Google Meet: {meet_code}")

        # 1. Run Facial Emotion Analysis
        if emotion_observations:
            turns = [
                {**turn, "emotion_data": emotion_observations[index % len(emotion_observations)]}
                for index, turn in enumerate(turns)
            ]
        emotion_timeline = self.emotion_analyzer.analyze_timeline(turns)
        sentiment_summary = self.emotion_analyzer.compute_summary(emotion_timeline)

        # 2. Run Compliance & Legal Checks on key statements
        compliance_evaluations = []
        for t in turns:
            text = t["text"]
            if any(w in text.lower() for w in ["terminate", "contract", "notice", "thirty-day", "exposure", "regulations"]):
                analysis = self.compliance_engine.analyze(text)
                compliance_evaluations.append({
                    "speaker": t["speaker"],
                    "statement": text,
                    "overall_compliance": analysis["overall_compliance"],
                    "reason": analysis["overall_reason"],
                    "flags": analysis.get("rule_flags", [])
                })

        # 3. Generate Executive Multi-Modal Summary
        decisions = [t["text"] for t in turns if any(
            word in t["text"].lower() for word in ["decide", "agreed", "will ", "should ", "terminate"]
        )][:5]
        action_items = [
            {"task": t["text"], "owner": t.get("speaker", "Unassigned"), "due": "Review required"}
            for t in turns if any(word in t["text"].lower() for word in ["will ", "please ", "schedule", "review"])
        ][:8]
        summary_points = []
        for text in decisions + [item["task"] for item in action_items]:
            cleaned = " ".join(text.split())
            if cleaned and cleaned not in summary_points:
                summary_points.append(cleaned)
        if summary_points:
            executive_summary = "Key discussion points: " + " ".join(summary_points[:4])
        else:
            overview = [
                " ".join(turn.get("text", "").split())
                for turn in turns
                if turn.get("text", "").strip()
            ]
            executive_summary = " ".join(overview[:3]) or "No spoken content was captured."
        executive_summary = executive_summary[:1200].rstrip()
        participant_names = []
        for turn in turns:
            name = turn.get("speaker", "Unknown speaker")
            if name not in participant_names:
                participant_names.append(name)
        participants = [
            {
                "name": name,
                "role": "Captured speaker",
                "initials": "".join(part[0] for part in name.split()[:2]).upper(),
                "emotion": sentiment_summary["participant_profiles"].get(name, {}).get("dominant_emotion", "neutral")
            }
            for name in participant_names
        ]

        return {
            "meet_code": meet_code,
            "meet_url": f"https://meet.google.com/{meet_code}",
            "title": title,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "duration": f"{max((t.get('end', 0) for t in turns), default=0):.0f} seconds",
            "participants": participants,
            "transcript": emotion_timeline,
            "sentiment_summary": sentiment_summary,
            "compliance_evaluations": compliance_evaluations,
            "summary": {
                "purpose": "Conversation captured from the meeting.",
                "executive": executive_summary,
                "decisions": decisions,
                "action_items": action_items,
                "behavioral_observations": f"Meeting was predominantly {sentiment_summary['dominant_emotion'].upper()} based on {len(emotion_timeline)} captured utterances."
            }
        }
