"""
fact_extraction.py
------------------
Extracts structured factual statements (decisions, requirements, commitments,
deadlines, restrictions, risks) from speaker-labelled meeting transcripts.
Uses FLAN-T5-base with the BEACON V2.1 LoRA adapter, with intelligent zero-shot fallback.
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any

try:
    from config import OUTPUT_DIR, LORA_ADAPTER_DIR, BASE_FACT_MODEL
except ImportError:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output"
    LORA_ADAPTER_DIR = Path(__file__).resolve().parent / "models" / "beacon_flan_t5_v2_1_refined_lora"
    BASE_FACT_MODEL = "google/flan-t5-base"

MAX_INPUT_TOKENS = 768
MAX_NEW_TOKENS = 96
CONTEXT_TURNS = 6
STEP = 3


def load_transcript(transcript_file: Path):
    pattern = re.compile(r"\[(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\]\s*(\S+):\s*(.*)")
    turns = []
    with open(transcript_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            m = pattern.match(line)
            if m:
                turns.append({
                    "start": float(m.group(1)),
                    "end": float(m.group(2)),
                    "speaker": m.group(3),
                    "text": m.group(4).strip()
                })
    return turns


def build_context(turns):
    return "\n".join(f"[{t['start']:.2f} - {t['end']:.2f}] {t['speaker']}: {t['text']}" for t in turns)


def extract_fact_heuristic(context: str) -> str:
    """Fast pattern-based legal and operational fact extractor."""
    lines = context.strip().split("\n")
    candidates = []
    for line in lines:
        l_lower = line.lower()
        if any(w in l_lower for w in ["terminate", "termination", "contract", "agree", "decision", "review", "schedule", "deadline", "require", "must", "shall", "october", "december"]):
            # Strip speaker prefix
            clean = re.sub(r"\[.*?\]\s*[^:]+:\s*", "", line).strip()
            candidates.append(clean)
    if candidates:
        return candidates[0]
    return "NONE"


def extract_facts(input_file: str = None, output_file: str = None, adapter_path: str = None):
    in_path = Path(input_file or (OUTPUT_DIR / "speaker_transcript.txt"))
    out_path = Path(output_file or (OUTPUT_DIR / "facts.json"))
    adapter = Path(adapter_path or LORA_ADAPTER_DIR)

    if not in_path.exists():
        raise FileNotFoundError(f"Speaker transcript not found: {in_path}")

    turns = load_transcript(in_path)
    if not turns:
        raise RuntimeError(f"No valid turns found in {in_path}")

    out_path.parent.mkdir(parents=True, exist_ok=True)

    use_neural = False
    tokenizer, model = None, None

    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

        print(f"Loading {BASE_FACT_MODEL} tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(BASE_FACT_MODEL)

        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32

        print(f"Loading {BASE_FACT_MODEL} on {device}...")
        model = AutoModelForSeq2SeqLM.from_pretrained(BASE_FACT_MODEL, torch_dtype=dtype)

        if adapter.exists():
            from peft import PeftModel
            print(f"Applying BEACON LoRA adapter from {adapter}...")
            model = PeftModel.from_pretrained(model, str(adapter))
        else:
            print(f"[INFO] LoRA adapter not found at {adapter}. Using zero-shot FLAN-T5.")

        if device == "cuda":
            model = model.cuda()
        model.eval()
        use_neural = True

    except Exception as e:
        print(f"[INFO] Running in fast heuristic fact extraction mode ({e}).")
        use_neural = False

    results = []
    window_id = 0

    for start in range(0, len(turns), STEP):
        window = turns[start:start + CONTEXT_TURNS]
        if not window:
            break

        context = build_context(window)
        window_id += 1

        if use_neural:
            prompt = f"""You are the BEACON meeting fact extraction system.
Analyze the following meeting conversation.
Extract ONE important factual statement (decision, requirement, commitment, deadline, restriction, or risk) that is explicitly supported.
If there is no important factual information, output NONE.

MEETING CONVERSATION:
{context}

FACT:
"""
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=MAX_INPUT_TOKENS)
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            with torch.no_grad():
                out = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS, num_beams=4, early_stopping=True)
            fact = tokenizer.decode(out[0], skip_special_tokens=True).strip()
        else:
            fact = extract_fact_heuristic(context)

        if not fact or fact.upper() == "NONE":
            continue

        results.append({
            "id": window_id,
            "start": window[0]["start"],
            "end": window[-1]["end"],
            "speakers": sorted(list(set(t["speaker"] for t in window))),
            "fact": fact,
            "source_turns": window
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nFact extraction complete: {len(results)} facts extracted -> {out_path}")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract facts from speaker transcript.")
    parser.add_argument("--input", type=str, default=None, help="Input speaker transcript path")
    parser.add_argument("--output", type=str, default=None, help="Output facts.json path")
    parser.add_argument("--adapter", type=str, default=None, help="LoRA adapter directory")
    args = parser.parse_args()

    extract_facts(args.input, args.output, args.adapter)