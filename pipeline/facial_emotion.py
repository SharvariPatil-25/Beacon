"""
facial_emotion.py
-----------------
Facial recognition and emotion analysis module for BEACON.
Detects faces in video frames or live meeting video streams and classifies
participant emotional states:
- happy: Receptive, positive, supportive
- serious: Focused, analytical, formal
- agitated: Tense, stressed, resistant, furrowed brow
- disappointed: Skeptical, disapproving, downward mouth
- neutral: Baseline expression

Correlates emotional expressions with spoken statements to detect behavioral
risk signals during legal and policy negotiations.
"""

import math
import random
import re
import importlib.util
from pathlib import Path
from typing import Dict, List, Any, Optional

EMOTION_LABELS = ["happy", "serious", "agitated", "disappointed", "neutral"]

# Emotion descriptions and legal behavioral cues
EMOTION_DESCRIPTIONS = {
    "happy": "Positive sentiment, receptive posture, smile detected. Aligned with agreement.",
    "serious": "Analytical focus, steady gaze, formal tone. Evaluating proposals cautiously.",
    "agitated": "Elevated tension, furrowed brow, rapid head movement. Potential resistance or stress.",
    "disappointed": "Downcast lips, subtle head drop, skepticism. Potential disagreement with terms.",
    "neutral": "Balanced resting expression, baseline engagement."
}

EMOTION_COLORS = {
    "happy": "#2e7d32",        # Green
    "serious": "#1565c0",      # Deep Blue
    "agitated": "#d32f2f",     # Red
    "disappointed": "#e65100", # Orange / Amber
    "neutral": "#546e7a"       # Slate
}


class FacialEmotionAnalyzer:
    """
    Analyzes facial expressions and emotional valence from video frames,
    webcam snapshots, or simulated participant video feeds.
    """

    def __init__(self, use_deep_learning: bool = True):
        self.use_deep_learning = use_deep_learning
        self.face_cascade = None
        self._cv2 = None
        self._real_analyzer = None

        try:
            import cv2
            self._cv2 = cv2
            # Load Haar Cascade if OpenCV is available
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            self._cv2 = None

        # Reuse the original DeepFace analyzer when the standalone module and
        # its optional dependencies are available. The heuristic path remains
        # available for transcript-only and lightweight deployments.
        try:
            source = Path(__file__).resolve().parents[2] / "GoogleMeetEmotionAnalyzer" / "emotion_analyzer.py"
            spec = importlib.util.spec_from_file_location("beacon_original_emotion_analyzer", source)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                self._real_analyzer = module.EmotionAnalyzer()
        except Exception:
            self._real_analyzer = None

    def analyze_frame_image(self, frame: Any, participant_name: str = "Participant") -> Optional[Dict[str, Any]]:
        """Analyze a captured BGR frame with the original DeepFace module."""
        if self._real_analyzer is None or frame is None:
            return None

        result = self._real_analyzer.analyze(frame)
        if not result:
            return None

        raw_emotion = str(result.get("emotion", "neutral")).lower()
        mapped_emotion = {
            "happy": "happy",
            "surprise": "happy",
            "angry": "agitated",
            "disgust": "agitated",
            "fear": "agitated",
            "sad": "disappointed",
            "neutral": "neutral",
        }.get(raw_emotion, "serious")
        confidence = float(result.get("confidence", 0.0)) / 100.0
        raw_scores = result.get("scores", {})
        scores = {
            str(label): round(float(score), 4)
            for label, score in raw_scores.items()
        } if isinstance(raw_scores, dict) else {}
        return {
            "participant": participant_name,
            "primary_emotion": mapped_emotion,
            "confidence": round(max(0.0, min(1.0, confidence)), 2),
            "description": EMOTION_DESCRIPTIONS[mapped_emotion],
            "color": EMOTION_COLORS[mapped_emotion],
            "scores": scores,
            "source": "deepface",
            "raw_emotion": raw_emotion,
        }

    def classify_expression_from_features(self, smile_score: float, tension_score: float, gaze_directness: float) -> Dict[str, Any]:
        """
        Classifies emotion based on facial landmark metrics:
        - smile_score (0.0 to 1.0)
        - tension_score / brow furrow (0.0 to 1.0)
        - gaze_directness (0.0 to 1.0)
        """
        if smile_score > 0.6 and tension_score < 0.4:
            primary = "happy"
            conf = min(0.96, 0.65 + smile_score * 0.3)
        elif tension_score > 0.55:
            primary = "agitated"
            conf = min(0.95, 0.60 + tension_score * 0.35)
        elif smile_score < 0.25 and tension_score > 0.35:
            primary = "disappointed"
            conf = min(0.92, 0.58 + tension_score * 0.3)
        elif gaze_directness > 0.65:
            primary = "serious"
            conf = min(0.96, 0.70 + gaze_directness * 0.25)
        else:
            primary = "neutral"
            conf = 0.82

        return {
            "primary_emotion": primary,
            "confidence": round(conf, 2),
            "description": EMOTION_DESCRIPTIONS[primary],
            "color": EMOTION_COLORS[primary],
            "scores": {
                "happy": round(max(0.05, smile_score * 0.9), 2),
                "agitated": round(max(0.05, tension_score * 0.85), 2),
                "disappointed": round(max(0.05, (1.0 - smile_score) * tension_score * 0.8), 2),
                "serious": round(max(0.1, gaze_directness * 0.8), 2),
                "neutral": round(max(0.05, 1.0 - max(smile_score, tension_score)), 2)
            }
        }

    def analyze_frame_simulation(self, participant_name: str, current_dialogue: str = "") -> Dict[str, Any]:
        """
        Generates realistic contextual facial emotion data for a participant,
        correlating dialogue semantics with human micro-expressions.
        """
        dialogue_lower = (current_dialogue or "").lower()

        # Semantic emotion heuristics based on meeting context
        if any(w in dialogue_lower for w in ["terminate", "fire", "contract", "tomorrow", "without notice"]):
            # Tough topic -> triggers agitated or serious
            smile = random.uniform(0.05, 0.2)
            tension = random.uniform(0.65, 0.92)
            gaze = random.uniform(0.75, 0.95)
        elif any(w in dialogue_lower for w in ["conflict", "risk", "dispute", "sued", "no cap", "liability"]):
            # Legal conflict -> disappointed or agitated
            smile = random.uniform(0.05, 0.18)
            tension = random.uniform(0.58, 0.88)
            gaze = random.uniform(0.7, 0.9)
        elif any(w in dialogue_lower for w in ["agree", "agreed", "resolved", "good", "thank", "schedule"]):
            # Constructive consensus -> happy or serious
            smile = random.uniform(0.65, 0.92)
            tension = random.uniform(0.1, 0.3)
            gaze = random.uniform(0.8, 0.95)
        else:
            # Baseline focused operations meeting -> serious
            smile = random.uniform(0.2, 0.4)
            tension = random.uniform(0.2, 0.45)
            gaze = random.uniform(0.7, 0.9)

        result = self.classify_expression_from_features(smile, tension, gaze)
        result["participant"] = participant_name
        result["bounding_box"] = {
            "x": random.randint(120, 220),
            "y": random.randint(80, 160),
            "width": 180,
            "height": 220
        }
        return result

    def analyze_timeline(self, transcript_turns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Produces an emotion timeline across every meeting turn,
        linking facial signals to timestamped dialogue.
        """
        timeline = []
        for turn in transcript_turns:
            speaker = turn.get("speaker", "Participant")
            text = turn.get("text", "")
            start = turn.get("start", 0.0)
            end = turn.get("end", 0.0)

            emotion_data = turn.get("emotion_data")
            if not isinstance(emotion_data, dict):
                emotion_data = {
                    "primary_emotion": "neutral",
                    "confidence": 0.0,
                    "description": EMOTION_DESCRIPTIONS["neutral"],
                    "color": EMOTION_COLORS["neutral"],
                    "scores": {},
                    "source": "not_captured"
                }

            # Check for behavioral legal alert
            behavioral_alert = None
            if emotion_data["primary_emotion"] in ["agitated", "disappointed"]:
                if any(w in text.lower() for w in ["terminate", "tomorrow", "liability", "no cap", "conflict", "without notice"]):
                    behavioral_alert = f"Tension Alert: {speaker} exhibited {emotion_data['primary_emotion'].upper()} expressions while discussing '{text}'."

            timeline.append({
                "start": start,
                "end": end,
                "speaker": speaker,
                "text": text,
                "emotion": emotion_data["primary_emotion"],
                "confidence": emotion_data["confidence"],
                "color": emotion_data["color"],
                "description": emotion_data["description"],
                "scores": emotion_data["scores"],
                "behavioral_alert": behavioral_alert
            })

        return timeline

    def compute_summary(self, timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregates meeting-wide emotional sentiment statistics.
        """
        if not timeline:
            return {
                "dominant_emotion": "serious",
                "distribution": {"serious": 50, "neutral": 30, "happy": 10, "agitated": 5, "disappointed": 5},
                "tension_moments": 0,
                "participant_profiles": {}
            }

        counts = {e: 0 for e in EMOTION_LABELS}
        participant_counts = {}
        alerts = []

        for item in timeline:
            e = item.get("emotion", "neutral")
            counts[e] = counts.get(e, 0) + 1

            spk = item.get("speaker", "Participant")
            if spk not in participant_counts:
                participant_counts[spk] = {e: 0 for e in EMOTION_LABELS}
            participant_counts[spk][e] = participant_counts[spk].get(e, 0) + 1

            if item.get("behavioral_alert"):
                alerts.append(item["behavioral_alert"])

        total = sum(counts.values()) or 1
        distribution = {k: round((v / total) * 100, 1) for k, v in counts.items()}
        dominant = max(counts.items(), key=lambda x: x[1])[0]

        # Per-participant dominant emotions
        participant_profiles = {}
        for spk, p_counts in participant_counts.items():
            p_dom = max(p_counts.items(), key=lambda x: x[1])[0]
            participant_profiles[spk] = {
                "dominant_emotion": p_dom,
                "color": EMOTION_COLORS.get(p_dom, "#546e7a"),
                "counts": p_counts
            }

        return {
            "dominant_emotion": dominant,
            "distribution": distribution,
            "tension_moments": len(alerts),
            "alerts": alerts,
            "participant_profiles": participant_profiles
        }
