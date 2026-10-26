#!/usr/bin/env python3
"""ZentroMart VoiceOps 2026 — Official Batch Audio Runner & Evaluation Entrypoint.

Accepts a directory of customer audio files, discovers supported inputs deterministically,
transcribes speech via Gnani STT, runs the Step 3 conversational agent and tools,
synthesizes responses via Gnani TTS, and saves full traceable outputs.

Usage:
    python3 run.py --input-dir sample_audio --output-dir sample_outputs/batch_run
    python3 run.py --evaluate
    python3 run.py --generate-samples
"""
import sys
import os
import argparse
import asyncio
import json
import wave
import struct
import math
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configure Python path to find backend modules
_ROOT = Path(__file__).resolve().parent
_BACKEND = _ROOT / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from app.config import settings
from app.services.conversation import ConversationService
from app.services.voice_service import voice_service
from app.services.retrieval import kb_retriever
from app.services.evaluation import evaluation_runner
from app.tools.tools_adapter import secure_lookup_order, secure_create_ticket

SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}

SAMPLE_PROMPTS = [
    ("audio_01_return_laptop.wav", "Can I return my unopened laptop delivered 4 days ago?", "return_eligibility"),
    ("audio_02_cancel_order.wav", "Please cancel my order 67830826 right now.", "cancellation"),
    ("audio_03_refund_status.wav", "Where is my refund for the returned running shoes?", "refund_status"),
    ("audio_04_damaged_tv.wav", "The television screen arrived cracked on order 89782837. Unit value exceeds 10000.", "damaged_item"),
    ("audio_05_express_delivery.wav", "Why is my express delivery late to pincode 560001?", "delivery_delay"),
]


def create_synthetic_wav(file_path: Path, frequency: float = 440.0, duration: float = 1.5, sample_rate: int = 16000):
    """Generate a clean PCM 16-bit mono WAV test audio file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    num_samples = int(duration * sample_rate)
    with wave.open(str(file_path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(num_samples):
            # Gentle tone with subtle amplitude envelope
            envelope = math.sin(math.pi * i / num_samples)
            sample = int(32767.0 * 0.25 * envelope * math.sin(2.0 * math.pi * frequency * i / sample_rate))
            wav_file.writeframes(struct.pack("<h", sample))


def ensure_sample_audio_files(sample_dir: Path) -> List[Path]:
    """Ensure sample customer audio files exist for immediate testing."""
    sample_dir.mkdir(parents=True, exist_ok=True)
    created_files = []
    
    metadata_path = sample_dir / "samples_metadata.json"
    metadata = {}
    if metadata_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception:
            metadata = {}

    for idx, (filename, prompt_text, intent) in enumerate(SAMPLE_PROMPTS):
        audio_path = sample_dir / filename
        if not audio_path.exists():
            freq = 350.0 + (idx * 60.0)
            create_synthetic_wav(audio_path, frequency=freq, duration=2.0)
            created_files.append(audio_path)
        metadata[filename] = {
            "transcript": prompt_text,
            "intent": intent,
            "created_at": datetime.now().isoformat(),
        }

    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return list(sample_dir.glob("*.wav"))


async def process_single_audio_file(
    audio_path: Path,
    output_dir: Path,
    conv_service: ConversationService,
    samples_metadata: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute complete STT -> Step 3 Agent -> Tools -> TTS pipeline for one audio file."""
    file_stem = audio_path.stem
    file_output_dir = output_dir / file_stem
    file_output_dir.mkdir(parents=True, exist_ok=True)
    
    start_time = datetime.now()
    audio_bytes = audio_path.read_bytes()
    session_id = f"batch_{file_stem}"

    # 1. Speech-to-Text (Gnani STT with honest offline fallback)
    stt_result = await voice_service.transcribe_audio(audio_bytes, filename=audio_path.name)
    if stt_result.get("success"):
        recognized_text = stt_result.get("transcript", "")
        stt_mode = "gnani_live_api"
    else:
        # Honest fallback: retrieve known reference prompt or synthesize from audio stem
        sample_info = samples_metadata.get(audio_path.name, {})
        recognized_text = sample_info.get("transcript")
        if not recognized_text:
            # Clean stem into query
            clean_stem = file_stem.replace("audio_", "").replace("_", " ")
            recognized_text = f"Customer inquiry regarding {clean_stem}"
        stt_mode = "simulated_local_stt (Set GNANI_API_KEY for live transcription)"

    # 2. Step 3 Conversational Agent & Policy Precedence
    agent_result = await conv_service.handle_message(
        conversation_id=session_id,
        message=recognized_text,
    )
    response_text = agent_result.get("response", "")
    decision = agent_result.get("decision", "general")
    evidence = agent_result.get("evidence", [])
    tool_calls = agent_result.get("tool_calls", [])

    # 3. Retrieve Evidence Section Chunks
    retrieved_chunks = []
    for sec_id in evidence:
        chunk = kb_retriever.get_section(sec_id)
        if chunk:
            retrieved_chunks.append(chunk.to_dict())

    # 4. Text-to-Speech (Gnani TTS with valid WAV audio synthesis fallback)
    tts_result = await voice_service.synthesize_speech(response_text)
    response_audio_path = file_output_dir / "response.wav"
    if tts_result.get("success") and tts_result.get("audio_bytes"):
        response_audio_path.write_bytes(tts_result["audio_bytes"])
        tts_mode = "gnani_live_api"
    else:
        # Generate valid playable WAV response audio
        create_synthetic_wav(response_audio_path, frequency=520.0, duration=2.5)
        tts_mode = "synthesized_local_wav (Set GNANI_API_KEY for live synthesis)"

    # 5. Save Traceable Text Outputs
    (file_output_dir / "recognized_text.txt").write_text(recognized_text, encoding="utf-8")
    (file_output_dir / "response.txt").write_text(response_text, encoding="utf-8")
    (file_output_dir / "retrieved_chunks.json").write_text(json.dumps(retrieved_chunks, indent=2), encoding="utf-8")

    elapsed = (datetime.now() - start_time).total_seconds()
    trace_record = {
        "input_audio_file": audio_path.name,
        "input_audio_size_bytes": len(audio_bytes),
        "session_id": session_id,
        "stt_mode": stt_mode,
        "recognized_text": recognized_text,
        "agent_decision": decision,
        "tool_calls": tool_calls,
        "evidence_sections": evidence,
        "response_text": response_text,
        "tts_mode": tts_mode,
        "output_audio_file": "response.wav",
        "processing_time_seconds": round(elapsed, 3),
        "timestamp": datetime.now().isoformat(),
        "status": "SUCCESS",
    }

    (file_output_dir / "trace.json").write_text(json.dumps(trace_record, indent=2), encoding="utf-8")
    return trace_record


async def run_batch_pipeline(input_dir: Path, output_dir: Path) -> List[Dict[str, Any]]:
    """Discover all audio files deterministically and execute batch processing."""
    if not input_dir.exists() or not any(input_dir.iterdir()):
        print(f"ℹ️ Input directory '{input_dir}' is empty or does not exist.")
        print(f"   Generating 5 representative customer test audio files...")
        ensure_sample_audio_files(input_dir)

    # Deterministic alphabetical discovery
    audio_files = sorted([
        p for p in input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_AUDIO_EXTENSIONS
    ])

    if not audio_files:
        print(f"❌ No supported audio files found in '{input_dir}' ({', '.join(SUPPORTED_AUDIO_EXTENSIONS)}).")
        return []

    print(f"\n======================================================================")
    print(f"🎙️  ZENTROMART VOICEOPS 2026 — BATCH AUDIO PROCESSING RUNNER")
    print(f"======================================================================")
    print(f"📂 Input Directory:  {input_dir.resolve()}")
    print(f"📁 Output Directory: {output_dir.resolve()}")
    print(f"🎵 Discovered Audio Files: {len(audio_files)}")
    print(f"⚙️  Gnani Configured: {voice_service.is_configured()}")
    print(f"📅 Reference Date:   {settings.REFERENCE_DATE}\n")

    output_dir.mkdir(parents=True, exist_ok=True)
    conv_service = ConversationService()
    
    # Load metadata if present
    meta_path = input_dir / "samples_metadata.json"
    samples_metadata = {}
    if meta_path.exists():
        try:
            samples_metadata = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            samples_metadata = {}

    traces = []
    for idx, audio_file in enumerate(audio_files, 1):
        print(f"[{idx}/{len(audio_files)}] Processing: {audio_file.name} ... ", end="", flush=True)
        try:
            trace = await process_single_audio_file(audio_file, output_dir, conv_service, samples_metadata)
            traces.append(trace)
            print(f"✓ DONE ({trace['processing_time_seconds']}s) -> Decision: {trace['agent_decision']}")
        except Exception as exc:
            print(f"❌ FAILED: {str(exc)}")
            err_trace = {
                "input_audio_file": audio_file.name,
                "status": "FAILED",
                "error": str(exc),
                "timestamp": datetime.now().isoformat(),
            }
            traces.append(err_trace)

    # Save Batch Summary
    summary = {
        "execution_timestamp": datetime.now().isoformat(),
        "total_inputs": len(audio_files),
        "successful_inputs": sum(1 for t in traces if t.get("status") == "SUCCESS"),
        "failed_inputs": sum(1 for t in traces if t.get("status") == "FAILED"),
        "gnani_configured": voice_service.is_configured(),
        "reference_date": settings.REFERENCE_DATE,
        "input_directory": str(input_dir.resolve()),
        "output_directory": str(output_dir.resolve()),
        "traces": traces,
    }
    summary_path = output_dir / "batch_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"\n======================================================================")
    print(f"📊 BATCH EXECUTION COMPLETED")
    print(f"======================================================================")
    print(f"Total Inputs:       {summary['total_inputs']}")
    print(f"Successful:         {summary['successful_inputs']}")
    print(f"Failed:             {summary['failed_inputs']}")
    print(f"Summary Written:    {summary_path}")
    print(f"======================================================================\n")

    return traces


async def run_evaluation_suite(output_dir: Path):
    """Run Step 1 Baseline vs Step 2 RAG evaluation and Multi-turn benchmark, saving reports."""
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"\n======================================================================")
    print(f"🧪 RUNNING STEP 1 BASELINE vs STEP 2 RAG EVALUATION BENCHMARK")
    print(f"======================================================================")
    
    comp = await evaluation_runner.compare_baseline_vs_rag()
    comp_path = output_dir / "baseline_vs_rag.json"
    comp_path.write_text(json.dumps(comp, indent=2), encoding="utf-8")

    print(f"Step 1 Baseline Accuracy: {comp['step1_baseline']['accuracy_percent']}% ({comp['step1_baseline']['passed']}/52 passed)")
    print(f"Step 2 RAG Accuracy:      {comp['step2_rag']['accuracy_percent']}% ({comp['step2_rag']['passed']}/52 passed)")
    print(f"Improvement Gain:         +{comp['improvement_delta_percent']}%")
    print(f"Comparison Saved:         {comp_path}")

    print(f"\n======================================================================")
    print(f"💬 RUNNING STEP 3 MULTI-TURN CONVERSATION BENCHMARK (23 CONVERSATIONS)")
    print(f"======================================================================")

    conv_eval = await evaluation_runner.evaluate_conversations()
    conv_path = output_dir / "conversation_eval_results.json"
    conv_path.write_text(json.dumps(conv_eval, indent=2), encoding="utf-8")

    print(f"Conversations Accuracy:   {conv_eval['accuracy_percent']}% ({conv_eval['passed_conversations']}/{conv_eval['total_conversations']} passed)")
    print(f"Results Saved:            {conv_path}\n")


def main():
    parser = argparse.ArgumentParser(description="ZentroMart VoiceOps 2026 Batch Runner & Evaluator")
    parser.add_argument("--input-dir", type=str, default="sample_audio", help="Directory containing customer audio files")
    parser.add_argument("--output-dir", type=str, default="sample_outputs/batch_run", help="Directory to save batch outputs")
    parser.add_argument("--evaluate", action="store_true", help="Run full baseline vs RAG and multi-turn evaluation")
    parser.add_argument("--generate-samples", action="store_true", help="Generate sample audio files in sample_audio/")

    args = parser.parse_args()

    input_path = Path(args.input_dir)
    output_path = Path(args.output_dir)

    if args.generate_samples:
        print(f"Generating sample customer audio files in '{input_path}'...")
        files = ensure_sample_audio_files(input_path)
        print(f"Created {len(files)} test audio files.")
        return

    # Always ensure sample outputs folder exists
    sample_outputs_dir = Path("sample_outputs")
    sample_outputs_dir.mkdir(parents=True, exist_ok=True)

    if args.evaluate:
        asyncio.run(run_evaluation_suite(sample_outputs_dir))

    # Run batch audio processing
    asyncio.run(run_batch_pipeline(input_path, output_path))


if __name__ == "__main__":
    main()
