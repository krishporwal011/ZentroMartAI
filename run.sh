#!/usr/bin/env bash
# ZentroMart VoiceOps 2026 — Batch Runner Script
set -e

# Repository directory
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

# Run Python entrypoint with arguments
python3 run.py "$@"
