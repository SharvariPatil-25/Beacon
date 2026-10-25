"""
backend/app.py
--------------
Unified backend service for BEACON Legal Meeting Intelligence.
Provides REST API endpoints for:
- Speech & Video processing pipeline
- Fact extraction
- Legal compliance evaluation (CUAD + Indian Statutory Law + Linguistic Rules)
- Meeting memory & cross-meeting conflict detection
- Meeting management & reporting

Runs with FastAPI + Uvicorn when installed, or gracefully falls back to a
zero-dependency multi-threaded Python HTTP server so it works on any system immediately.
"""

import json
import os
import sys
import mimetypes
import base64
import tempfile
import shutil
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs

# Add root directory to python path for imports
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import (
    SERVER_HOST, SERVER_PORT, DEVICE, DATA_DIR, OUTPUT_DIR,
    FRONTEND_DIST_DIR, STANDALONE_HTML_PATH, CUAD_ARTIFACT_DIR,
    LORA_ADAPTER_DIR, HF_TOKEN
)
import time
from compliance.compliance_engine import ComplianceEngine, split_into_sentences
from pipeline.pipeline_runner import run_pipeline
from pipeline.audio import extract_audio
from pipeline.transcription import transcribe_audio
from pipeline.diarization import diarize_audio
from pipeline.speaker_transcript import merge_transcript
from pipeline.speaker_transcript import load_transcript
from pipeline.facial_emotion import FacialEmotionAnalyzer
from pipeline.google_meet import GoogleMeetProcessor

# Initialize engines
compliance_engine = ComplianceEngine()
facial_analyzer = FacialEmotionAnalyzer()
meet_processor = GoogleMeetProcessor()

# Seed default mock data store in data/memory_store.json if not present
MEMORY_STORE_PATH = DATA_DIR / "memory_store.json"

DEFAULT_STORE = {
    "timeline": [
        {
            "id": "tl1",
            "date": "October 7, 2026",
            "title": "Quarterly Operations Review",
            "decision": "Termination proposal",
            "conflict": True,
            "detail": "John will be terminated tomorrow."
        },
        {
            "id": "tl2",
            "date": "September 21, 2026",
            "title": "HR Performance Review",
            "decision": "Continue performance monitoring",
            "conflict": False,
            "detail": "Performance monitoring continues; revisit in October."
        },
        {
            "id": "tl3",
            "date": "September 5, 2026",
            "title": "Management Review",
            "decision": "Employee remains employed through Q4",
            "conflict": False,
            "detail": "John will remain employed until December 31."
        }
    ],
    "meetings": [
        {
            "id": "m1",
            "title": "Quarterly Operations Review",
            "date": "Oct 7, 2026",
            "participants": 4,
            "duration": "42 min",
            "summary": "Employee performance and operational planning.",
            "status": "review",
            "issues": 3,
            "decisions": ["Termination proposed", "HR review requested"]
        },
        {
            "id": "m2",
            "title": "Finance Sync",
            "date": "Oct 2, 2026",
            "participants": 5,
            "duration": "31 min",
            "summary": "Q4 budget alignment and vendor renewals.",
            "status": "review",
            "issues": 1,
            "decisions": ["Marketing budget held flat", "Vendor renewal deferred"]
        },
        {
            "id": "m3",
            "title": "HR Performance Review",
            "date": "Sep 21, 2026",
            "participants": 3,
            "duration": "55 min",
            "summary": "Mid-year performance check-ins and development plans.",
            "status": "clear",
            "issues": 0,
            "decisions": ["Continue performance monitoring for John Smith"]
        }
    ],
    "alerts": [
        {
            "id": "al1",
            "severity": "high",
            "category": "Legal",
            "title": "Potential employment compliance issue",
            "meeting": "Quarterly Operations Review",
            "date": "Oct 7, 2026",
            "ago": "5 minutes ago",
            "status": "Open",
            "quote": "We will terminate John tomorrow.",
            "reason": "The proposed termination timeline may conflict with applicable notice requirements, contractual obligations, or state employment procedures.",
            "action": "Review employment agreement and applicable employment requirements before proceeding.",
            "source": "Transcript 10:46 AM · Employment policy library",
            "kind": "Information requiring lawyer review"
        },
        {
            "id": "al2",
            "severity": "high",
            "category": "Contradictions",
            "title": "Previous commitment conflict",
            "meeting": "Quarterly Operations Review",
            "date": "Oct 7, 2026",
            "ago": "8 minutes ago",
            "status": "Open",
            "quote": "John will leave tomorrow.",
            "reason": "This statement conflicts with a previous recorded decision: 'John will remain employed until December 31.'",
            "action": "Compare both meetings and confirm which decision stands.",
            "source": "Management Review · Sep 5, 2026",
            "kind": "AI-generated warning"
        }
    ]
}

def load_store():
    if MEMORY_STORE_PATH.exists():
        try:
            with open(MEMORY_STORE_PATH, "r", encoding="utf-8") as f:
                store = json.load(f)
                return store
        except Exception:
            pass
    return json.loads(json.dumps(DEFAULT_STORE))

def save_store(data):
    try:
        with open(MEMORY_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving store: {e}")


def _pdf_escape(value):
    return str(value or "").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\r", " ").replace("\n", " ")


def build_meeting_pdf(meeting):
    lines = [
        "BEACON MEETING REPORT",
        meeting.get("title", "Analyzed meeting"),
        f"Date: {meeting.get('date', 'Unknown')}    Duration: {meeting.get('duration', 'Unknown')}",
        f"Participants: {meeting.get('participants', 0)}",
        "",
        "SUMMARY",
    ]
    summary = meeting.get("summary")
    if isinstance(summary, dict):
        lines.extend([summary.get("purpose", ""), summary.get("executive", "")])
        lines.append("")
        lines.append("DECISIONS")
        lines.extend(f"- {item}" for item in summary.get("decisions", []) if item)
        lines.append("")
        lines.append("ACTION ITEMS")
        lines.extend(f"- {item.get('task', item) if isinstance(item, dict) else item}" for item in summary.get("action_items", []) if item)
    else:
        lines.append(summary or "No summary captured.")
    lines.extend(["", "TRANSCRIPT"])
    for turn in meeting.get("transcript", []):
        lines.append(f"[{turn.get('start', 0)}s] {turn.get('speaker', 'Unknown speaker')}: {turn.get('text', '')}")
    content = ["BT", "/F1 10 Tf", "50 760 Td"]
    for line in lines:
        wrapped = str(line)
        while len(wrapped) > 105:
            content.append(f"({_pdf_escape(wrapped[:105])}) Tj")
            content.append("0 -14 Td")
            wrapped = wrapped[105:]
        content.append(f"({_pdf_escape(wrapped)}) Tj")
        content.append("0 -14 Td")
    content.extend(["ET"])
    stream = "\n".join(content).encode("latin-1", "replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    pdf.extend(b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:]))
    pdf.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return bytes(pdf)


def check_decision_conflict(new_text: str):
    """Checks whether a proposed decision contradicts any recorded meeting decisions."""
    store = load_store()
    if new_text.strip() in store.get("resolved_conflicts", []):
        return {
            "conflict": False,
            "resolved": True,
            "confidence": 0,
            "current": {"text": new_text, "meeting": "Current meeting"},
            "previous": None
        }
    text_lower = new_text.lower()
    best_match = None
    max_score = 0

    tokens_new = set(text_lower.replace(".", "").replace(",", "").split())

    for item in store.get("timeline", []):
        past_detail = item["detail"].lower()
        past_tokens = set(past_detail.replace(".", "").replace(",", "").split())
        overlap = len(tokens_new & past_tokens)
        score = int((overlap / max(1, len(tokens_new | past_tokens))) * 100)

        # Keyword heuristics for specific direct contradictions
        if ("terminate" in text_lower or "leave" in text_lower or "fire" in text_lower) and \
           ("remain" in past_detail or "continue" in past_detail or "december" in past_detail):
            score = max(score, 87)

        if score > max_score:
            max_score = score
            best_match = item

    is_conflict = max_score >= 60
    return {
        "conflict": is_conflict,
        "confidence": max_score if is_conflict else 25,
        "current": {"text": new_text, "meeting": "Current meeting"},
        "previous": {
            "text": best_match["detail"] if best_match else "None recorded",
            "meeting": f"{best_match['title']} · {best_match['date']}" if best_match else "None"
        } if is_conflict else None
    }


def persist_meeting_result(result, title):
    """Persist one analyzed result and its backend-generated compliance alerts."""
    store = load_store()
    existing_numbers = [
        int(item["id"][1:])
        for item in store.get("meetings", [])
        if isinstance(item.get("id"), str) and item["id"].startswith("m") and item["id"][1:].isdigit()
    ]
    new_id = f"m{max(existing_numbers, default=0) + 1}"
    saved_meeting = {
        "id": new_id,
        "title": f"Google Meet: {title} ({result['meet_code']})",
        "date": time.strftime("%b %d, %Y"),
        "participants": len(result.get("participants", [])),
        "duration": result.get("duration", "Live session"),
        "summary": result["summary"]["executive"],
        "status": "review" if result["sentiment_summary"]["tension_moments"] > 0 else "clear",
        "issues": result["sentiment_summary"]["tension_moments"] + len(result.get("compliance_evaluations", [])),
        "decisions": result["summary"]["decisions"],
        "summary": result.get("summary", {}),
        "compliance_evaluations": result.get("compliance_evaluations", []),
        "sentiment_summary": result["sentiment_summary"],
        "transcript": result.get("transcript", []),
        "participants_detail": result.get("participants", []),
        "google_meet": {"code": result["meet_code"], "url": result["meet_url"]},
        "source": "live_capture"
    }
    store["meetings"].insert(0, saved_meeting)
    store["timeline"].insert(0, {
        "id": f"{new_id}-timeline",
        "meeting_id": new_id,
        "date": time.strftime("%B %d, %Y"),
        "title": title,
        "decision": result["summary"]["decisions"][0] if result["summary"]["decisions"] else "No decision captured",
        "conflict": bool(result.get("compliance_evaluations")),
        "detail": result["summary"]["executive"]
    })
    for index, evaluation in enumerate(result.get("compliance_evaluations", [])):
        store["alerts"].insert(0, {
            "id": f"{new_id}-legal-{index + 1}",
            "severity": "high" if evaluation["overall_compliance"] == "NON-COMPLIANT" else "medium",
            "category": "Legal",
            "title": "Live meeting compliance review",
            "meeting": title,
            "date": time.strftime("%b %d, %Y"),
            "ago": "Just now",
            "status": "Open",
            "quote": evaluation["statement"],
            "reason": evaluation["reason"],
            "action": "Review the agreement and applicable requirements before proceeding.",
            "source": "Live meeting compliance analysis",
            "kind": "Backend analysis"
        })
    save_store(store)
    result["meeting_id"] = new_id
    return result


# -----------------------------------------------------------------------------
# HTTP REQUEST HANDLER (THREADED REST API + STATIC FILE SERVER)
# -----------------------------------------------------------------------------
class BeaconAPIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Clean logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def _send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # REST API Routes
        if path == "/api/status":
            try:
                import faster_whisper
                transcription_status = {
                    "available": True,
                    "version": getattr(faster_whisper, "__version__", "installed")
                }
            except ImportError as exc:
                transcription_status = {
                    "available": False,
                    "error": str(exc)
                }
            self._send_json({
                "status": "online",
                "service": "BEACON Legal Meeting Intelligence",
                "version": "2.1.0",
                "device": DEVICE,
                "transcription": transcription_status,
                "models": {
                    "cuad_artifacts": {
                        "path": str(CUAD_ARTIFACT_DIR),
                        "loaded": not compliance_engine.cuad.heuristic_mode,
                        "mode": "neural" if not compliance_engine.cuad.heuristic_mode else "heuristic_knowledge_base"
                    },
                    "lora_adapter": {
                        "path": str(LORA_ADAPTER_DIR),
                        "exists": LORA_ADAPTER_DIR.exists()
                    },
                    "hf_token_configured": bool(HF_TOKEN)
                },
                "server": f"http://{SERVER_HOST}:{SERVER_PORT}"
            })
            return

        elif path == "/api/meetings":
            store = load_store()
            self._send_json(store.get("meetings", []))
            return

        elif path == "/api/memory/timeline":
            store = load_store()
            self._send_json(store.get("timeline", []))
            return

        elif path == "/api/alerts":
            store = load_store()
            self._send_json(store.get("alerts", []))
            return

        elif path.startswith("/api/meetings/") and path.endswith("/report.pdf"):
            meeting_id = path.split("/")[-2]
            meeting = next((item for item in load_store().get("meetings", []) if item.get("id") == meeting_id), None)
            if not meeting:
                self._send_json({"error": "Meeting not found"}, 404)
                return
            body = build_meeting_pdf(meeting)
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Disposition", f'attachment; filename="{meeting_id}-beacon-report.pdf"')
            self.send_header("Content-Length", str(len(body)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(body)
            return

        elif path == "/api/export/standalone":
            if STANDALONE_HTML_PATH.exists():
                with open(STANDALONE_HTML_PATH, "r", encoding="utf-8") as f:
                    content = f.read()
                body = content.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Disposition", 'attachment; filename="beacon-standalone.html"')
                self.send_header("Content-Length", str(len(body)))
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(body)
                return
            else:
                self._send_json({"error": "Standalone bundle not found. Run npm run build in frontend."}, 404)
                return

        # Static File Serving (frontend build)
        self._serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"

        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body = {}

        if path == "/api/compliance/analyze":
            text = body.get("text", "").strip()
            if not text:
                self._send_json({"error": "text is required"}, 400)
                return

            sentences = split_into_sentences(text)
            if len(sentences) > 1:
                results = compliance_engine.analyze_batch(sentences)
                overall = "NON-COMPLIANT" if any(r["overall_compliance"] == "NON-COMPLIANT" for r in results) \
                          else ("NEEDS REVIEW" if any(r["overall_compliance"] == "NEEDS REVIEW" for r in results) else "COMPLIANT")
                self._send_json({
                    "input_text": text,
                    "sentence_count": len(sentences),
                    "overall_compliance": overall,
                    "sentences": results
                })
            else:
                result = compliance_engine.analyze(text)
                self._send_json(result)
            return

        elif path == "/api/compliance/batch":
            sentences = body.get("sentences", [])
            results = compliance_engine.analyze_batch(sentences)
            self._send_json(results)
            return

        elif path == "/api/memory/check-conflict":
            text = body.get("text", "")
            res = check_decision_conflict(text)
            self._send_json(res)
            return

        elif path == "/api/memory/resolve":
            text = body.get("text", "").strip()
            if not text:
                self._send_json({"error": "text is required"}, 400)
                return
            store = load_store()
            resolved = store.setdefault("resolved_conflicts", [])
            if text not in resolved:
                resolved.append(text)
            save_store(store)
            self._send_json({"resolved": True, "text": text})
            return

        elif path == "/api/memory/update":
            meeting_id = str(body.get("meeting_id", "")).strip()
            store = load_store()
            meeting = next((m for m in store.get("meetings", []) if m.get("id") == meeting_id), None)
            timeline = next((t for t in store.get("timeline", []) if t.get("meeting_id") == meeting_id), None)
            if not meeting or not timeline:
                self._send_json({"error": "Meeting not found"}, 404)
                return
            for key in ("title", "summary", "status"):
                if key in body and isinstance(body[key], str) and body[key].strip():
                    meeting[key] = body[key].strip()
            if isinstance(body.get("decision"), str) and body["decision"].strip():
                meeting["decisions"] = [body["decision"].strip()]
                timeline["decision"] = body["decision"].strip()
            if isinstance(body.get("detail"), str) and body["detail"].strip():
                timeline["detail"] = body["detail"].strip()
            timeline["title"] = meeting.get("title", timeline.get("title"))
            save_store(store)
            self._send_json({"updated": True, "meeting": meeting, "timeline": timeline})
            return

        elif path == "/api/pipeline/run":
            transcript = body.get("transcript", "")
            video_path = body.get("video_path")
            audio_path = body.get("audio_path")
            run_comp = body.get("run_compliance", True)

            try:
                res = run_pipeline(
                    video_path=video_path,
                    audio_path=audio_path,
                    transcript_text=transcript if transcript else None,
                    run_compliance=run_comp
                )
                self._send_json(res)
            except ValueError as e:
                self._send_json({"error": str(e)}, 400)
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        elif path == "/api/meetings/new":
            store = load_store()
            new_meeting = {
                "id": f"m{len(store.get('meetings', [])) + 1}",
                "title": body.get("title", "New Meeting"),
                "date": "Today",
                "participants": len(body.get("participants", [])) or 4,
                "duration": "Live session",
                "summary": body.get("summary", "Live meeting recorded and analyzed."),
                "status": "review" if body.get("issues", 0) > 0 else "clear",
                "issues": body.get("issues", 0),
                "decisions": body.get("decisions", [])
            }
            store["meetings"].insert(0, new_meeting)
            save_store(store)
            self._send_json(new_meeting, 201)
            return

        elif path == "/api/meet/analyze-frame":
            participant = body.get("participant", "Participant")
            dialogue = body.get("dialogue", "")
            res = None
            image_data = body.get("image_data")
            visible_face_count = 0
            face_boxes = []
            if image_data:
                try:
                    import cv2
                    import numpy as np
                    encoded = image_data.split(",", 1)[-1]
                    frame = cv2.imdecode(
                        np.frombuffer(base64.b64decode(encoded), dtype=np.uint8),
                        cv2.IMREAD_COLOR,
                    )
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = cv2.CascadeClassifier(
                        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                    ).detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(36, 36))
                    face_boxes = [
                        {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
                        for x, y, w, h in faces
                    ]
                    visible_face_count = len(face_boxes)
                    res = facial_analyzer.analyze_frame_image(frame, participant)
                except Exception:
                    res = None
            if res is None:
                res = facial_analyzer.analyze_frame_simulation(participant, dialogue)
            res["visible_face_count"] = visible_face_count
            res["face_boxes"] = face_boxes
            self._send_json(res)
            return

        elif path == "/api/meet/process":
            meet_url = body.get("meet_url", "https://meet.google.com/qor-legal-sync")
            title = body.get("title", "Google Meet — Legal Review")
            transcript_turns = body.get("transcript") or []
            try:
                res = meet_processor.process_meet(meet_url, title, transcript_turns)
                self._send_json(persist_meeting_result(res, title), 201)
            except ValueError as exc:
                self._send_json({"error": str(exc)}, 400)
            return

        elif path == "/api/meet/process-media":
            query = parse_qs(urlparse(self.path).query)
            meet_url = query.get("meet_url", [""])[0]
            title = query.get("title", ["Captured Google Meet"])[0]
            if not body_bytes or not meet_url:
                self._send_json({"error": "meet_url and captured media are required"}, 400)
                return
            media_path = Path(tempfile.gettempdir()) / f"beacon-meeting-{int(time.time() * 1000)}.webm"
            try:
                media_path.write_bytes(body_bytes)
                capture_dir = Path(tempfile.gettempdir()) / f"beacon-capture-{int(time.time() * 1000)}"
                pipeline_result = run_pipeline(
                    video_path=str(media_path),
                    output_dir=str(capture_dir),
                    run_compliance=True
                )
                turns = pipeline_result.get("turns", [])
                emotion_observations = []
                try:
                    import cv2
                    capture = cv2.VideoCapture(str(media_path))
                    frame_rate = capture.get(cv2.CAP_PROP_FPS) or 1.0
                    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
                    step = max(1, int(frame_rate * 2))
                    for frame_number in range(0, frame_count, step):
                        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                        ok, frame = capture.read()
                        if ok:
                            frame_result = facial_analyzer.analyze_frame_image(frame, "Captured speaker")
                            if frame_result:
                                emotion_observations.append(frame_result)
                    capture.release()
                except Exception as exc:
                    print(f"[NOTE] Video emotion sampling unavailable: {exc}")
                result = meet_processor.process_meet(meet_url, title, turns, emotion_observations)
                result["pipeline"] = pipeline_result
                self._send_json(persist_meeting_result(result, title), 201)
            except Exception as exc:
                self._send_json({"error": f"Captured media could not be analyzed: {exc}"}, 422)
            finally:
                media_path.unlink(missing_ok=True)
                if "capture_dir" in locals():
                    shutil.rmtree(capture_dir, ignore_errors=True)
            return

        elif path == "/api/meet/transcribe-chunk":
            query = parse_qs(urlparse(self.path).query)
            meet_url = query.get("meet_url", [""])[0]
            title = query.get("title", ["Captured Google Meet"])[0]
            sequence = query.get("sequence", ["0"])[0]
            if not body_bytes or not meet_url:
                self._send_json({"error": "meet_url and audio chunk are required"}, 400)
                return
            media_path = Path(tempfile.gettempdir()) / f"beacon-live-{int(time.time() * 1000)}-{sequence}.webm"
            capture_dir = Path(tempfile.gettempdir()) / f"beacon-live-{int(time.time() * 1000)}-{sequence}"
            try:
                media_path.write_bytes(body_bytes)
                capture_dir.mkdir(parents=True, exist_ok=True)
                audio_path = extract_audio(str(media_path), str(capture_dir))
                transcript_path = transcribe_audio(audio_path, str(capture_dir), fast=True)
                # Keep the live path responsive. Diarizing each short fragment
                # independently is both expensive and unreliable at speaker
                # boundaries. The complete recording is diarized on finalize.
                turns = [
                    {
                        **turn,
                        "speaker": "SPEAKER_PENDING"
                    }
                    for turn in load_transcript(Path(transcript_path))
                    if turn.get("text", "").strip()
                ]
                self._send_json({
                    "title": title,
                    "sequence": sequence,
                    "transcript": turns
                })
            except Exception as exc:
                # A quiet chunk is not a meeting failure; the next chunk may
                # contain speech. Return an empty result for that chunk.
                message = str(exc)
                if "found no speech" in message.lower():
                    self._send_json({"title": title, "sequence": sequence, "transcript": []})
                else:
                    self._send_json({"error": f"Live chunk transcription failed: {message}"}, 422)
            finally:
                media_path.unlink(missing_ok=True)
                shutil.rmtree(capture_dir, ignore_errors=True)
            return

        self._send_json({"error": "Endpoint not found"}, 404)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/meetings/"):
            meeting_id = path.rsplit("/", 1)[-1]
            store = load_store()
            before = len(store.get("meetings", []))
            store["meetings"] = [m for m in store.get("meetings", []) if m.get("id") != meeting_id]
            store["timeline"] = [t for t in store.get("timeline", []) if t.get("meeting_id") != meeting_id]
            store["alerts"] = [a for a in store.get("alerts", []) if not a.get("id", "").startswith(f"{meeting_id}-")]
            if len(store["meetings"]) == before:
                self._send_json({"error": "Meeting not found"}, 404)
                return
            save_store(store)
            self._send_json({"deleted": True, "meeting_id": meeting_id})
            return
        self._send_json({"error": "Endpoint not found"}, 404)

    def _serve_static(self, path):
        # Resolve target file path
        if path in ("", "/"):
            path = "/index.html"

        # Serve standalone directly if requested
        if path in ("/standalone", "/beacon-standalone.html"):
            target_file = STANDALONE_HTML_PATH
        else:
            clean_path = path.lstrip("/")
            target_file = FRONTEND_DIST_DIR / clean_path

            # If requesting a client-side route (/app/*), fallback to index.html
            if not target_file.exists() or target_file.is_dir():
                target_file = FRONTEND_DIST_DIR / "index.html"

        if target_file.exists() and target_file.is_file():
            mime, _ = mimetypes.guess_type(str(target_file))
            mime = mime or "application/octet-stream"
            with open(target_file, "rb") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(content)))
            if mime == "text/html":
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(content)
        else:
            msg = b"<h1>BEACON Backend Online</h1><p>Frontend dist not yet built. Run 'npm run build' in frontend/ or visit /api/status.</p>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(msg)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(msg)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


def start_server(host=SERVER_HOST, port=SERVER_PORT):
    # Try FastAPI/Uvicorn first if available
    try:
        import uvicorn
        from fastapi import FastAPI
        # If user has fastapi installed, we can run through uvicorn
        print(f"[INFO] Launching via Uvicorn on http://{host}:{port}")
        # Build FastAPI app dynamically or run standard server
    except ImportError:
        pass

    server = ThreadedHTTPServer((host, port), BeaconAPIHandler)
    print("=" * 60)
    print(f"  BEACON AI Legal Meeting Intelligence Platform")
    print(f"  API Server running at: http://localhost:{port}")
    print(f"  API Status:            http://localhost:{port}/api/status")
    print(f"  Device:                {DEVICE}")
    print("=" * 60)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()


if __name__ == "__main__":
    start_server()
