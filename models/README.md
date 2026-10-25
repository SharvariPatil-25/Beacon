# BEACON Model Weights & Artifacts Directory

This directory houses the neural network weights and artifacts for the BEACON Legal Meeting Intelligence platform.

## Directory Structure

```text
models/
├── cuad/                                # CUAD Contract Intelligence
│   ├── legalbert_final/                 # Fine-tuned LegalBERT QA model & tokenizer
│   ├── clause_embeddings.npy            # Dense retrieval index of annotated clauses (BGE)
│   ├── clause_records.json              # Full text & metadata for indexed clauses
│   └── category_classifier/             # Trained CUAD category classifier
│
├── beacon_flan_t5_v2_1_refined_lora/    # Fact Extraction Model
│   ├── adapter_config.json              # PEFT LoRA adapter configuration
│   └── adapter_model.safetensors        # Fine-tuned BEACON LoRA weights
│
└── indian_corpus/                       # Indian Statutory Knowledge Base
```

---

## 1. CUAD Contract Artifacts

The fine-tuned CUAD artifacts are trained on the Contract Understanding Atticus Dataset (CUAD) to identify contract clauses and compare meeting decisions against legal commitments.

If you trained these in Google Colab using `save_artifacts_to_drive.py`:
1. Download `cuad_artifacts.zip` or the artifacts folder from Google Drive:
   `MyDrive/Beacon_Legal/artifacts/cuad/`
2. Extract the contents into `models/cuad/`.

> **Note:** If these weights are not present, BEACON automatically runs in **Heuristic Knowledge Base Mode**, using canonical CUAD clauses and rule checks.

---

## 2. BEACON FLAN-T5 V2.1 LoRA Adapter

The meeting fact extraction model uses `google/flan-t5-base` with the BEACON V2.1 LoRA adapter.

Place the adapter folder in:
```text
models/beacon_flan_t5_v2_1_refined_lora/
```

> **Note:** If the LoRA adapter is not present, BEACON automatically uses zero-shot FLAN-T5 or pattern-based extraction, ensuring uninterrupted execution.

---

## 3. Speech & Diarization Models

- **Faster-Whisper**: Downloaded automatically on first run to the standard Hugging Face / CTranslate2 cache (`~/.cache/huggingface/hub`).
- **pyannote/speaker-diarization-community-1**: Requires a Hugging Face token with accepted terms of service:
  ```bash
  export HF_TOKEN=hf_your_token_here
  ```
  or configure it in `.env`.
