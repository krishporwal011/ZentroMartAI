# ZentroMart AI Customer Support & Autonomous Operations Platform

<div align="center">

![ZentroMart Hero](docs/screenshots/chat_workspace.png)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-37%2F37%20Passing-brightgreen.svg)]()
[![Benchmark Accuracy](https://img.shields.io/badge/Benchmark-100%25%20(75%2F75)-brightgreen.svg)]()
[![TinyFish Agent](https://img.shields.io/badge/TinyFish-Autonomous%20Agent-6366f1.svg)](https://agent.tinyfish.ai)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**An enterprise-grade, omnichannel AI Customer Support and Operations platform for modern Indian e-commerce. Built with deterministic policy precedence, two-factor identity challenge gating, Sunday/holiday calendar transit math, Gnani AI Indian vernacular voice intelligence, and TinyFish autonomous browser web agent automation.**

[Live Demo](#local-development) • [Visual Tour & Walkthrough](#-visual-tour--feature-walkthrough) • [System Architecture](#system-architecture) • [TinyFish Web Agent](#-autonomous-web-agent-tinyfish) • [Evaluation Benchmarks](#-evaluation-benchmarks--testing) • [Deployment Guide](#production-deployment)

</div>

---

## 📑 Table of Contents
1. [Executive Overview](#executive-overview)
2. [Visual Tour & Feature Walkthrough](#-visual-tour--feature-walkthrough)
   - [1. Omnichannel Customer Support Chat](#1-omnichannel-customer-support-chat)
   - [2. Secure Order Lookup & Two-Factor Verification](#2-secure-order-lookup--two-factor-verification)
   - [3. TinyFish Autonomous Web Agent Workspace](#3-tinyfish-autonomous-web-agent-workspace)
   - [4. Knowledge Base & Policy Precedence Inspector](#4-knowledge-base--policy-precedence-inspector)
   - [5. Automated Benchmark Evaluation Dashboard](#5-automated-benchmark-evaluation-dashboard)
   - [6. Escalation Tickets & Human Handover](#6-escalation-tickets--human-handover)
   - [7. System Diagnostics & Provider Health](#7-system-diagnostics--provider-health)
3. [System Architecture](#system-architecture)
4. [Autonomous Web Agent (TinyFish)](#-autonomous-web-agent-tinyfish)
5. [Evaluation Benchmarks & Testing](#-evaluation-benchmarks--testing)
6. [Installation & Setup](#installation--setup)
7. [API Reference](#api-reference)
8. [Production Deployment](#production-deployment)
9. [Project Directory Structure](#project-directory-structure)

---

## Executive Overview

Conventional e-commerce chatbots frequently hallucinate customer order records, prematurely leak sensitive personal data, miscalculate return deadlines by ignoring regional non-working days, and stumble over multilingual code-switching.

**ZentroMart** solves these critical flaws with production-grade engineering:
- **Zero Fabricated Data Guarantee:** Answers are grounded strictly in 21 authoritative knowledge-base documents and 1,000 verified relational order records.
- **Identity Security Gate:** Order details are protected by an automated challenge-response gate (requiring customer registered phone verification or PIN challenge before disclosure).
- **Temporal Calendar Engine:** All delivery transit, return eligibility, and refund countdowns are anchored to **20 October 2026**, strictly skipping Sundays and national warehouse holidays (Republic Day, Independence Day, Gandhi Jayanti, Christmas).
- **Vernacular Voice AI:** Native speech interaction powered by **Gnani AI** (Prisma v2.5 STT & Timbre v2.5 TTS) supporting Indian English, Hindi (हिंदी), and Hinglish.
- **Autonomous Browser Automation:** Integrated with **TinyFish** for autonomous web research, live document parsing, competitor price monitoring, and SEC EDGAR financial analysis.

---

## 📸 Visual Tour & Feature Walkthrough

### 1. Omnichannel Customer Support Chat
Grounds customer inquiries on verified policies with zero hallucination. Features suggested question chips, session tracking, voice input recording, and text-to-speech audio playback.

![Support Chat Workspace](docs/screenshots/chat_workspace.png)

* **Key Capabilities:**
  - Code-switched conversational understanding across English, Hindi, and Hinglish.
  - Streaming responses with instant citation tooltips referencing exact policy sections (e.g., `§ RET-3`, `§ CAN-2`).
  - Integrated audio recording via browser `MediaRecorder` with wave audio controls and audio transcription.

---

### 2. Secure Order Lookup & Two-Factor Verification
Protects customer data with strict identity challenge gating. Order data is never leaked to unauthenticated users who merely know an Order ID.

![Order Lookup Workspace](docs/screenshots/order_lookup.png)

* **Key Capabilities:**
  - One-click demo order testing chips (`#67830826`, `#89782837`, `#41029384`, `#99210384`).
  - Modal challenge requesting customer's registered phone number or delivery pincode.
  - Interactive transit timeline showing Dispatch, Hub Transfer, Out-for-Delivery, and Delivery milestones with holiday adjustments.
  - Return/Exchange eligibility calculator displaying remaining window days.

---

### 3. TinyFish Autonomous Web Agent Workspace
Executes multi-step browser automation, live web scraping, and document analysis directly from natural language requests.

![TinyFish Agent Workspace](docs/screenshots/tinyfish_workspace.png)

* **Key Capabilities:**
  - **SEC EDGAR Form 10-K Calculator:** Computes Meta Platforms, Inc. (META) FY2025 Debt-to-Equity ratio (**58.98%**) from official filings.
  - **Quick Run Presets:** Pre-configured workflows for financial analysis, e-commerce competitor price monitoring, and courier tracking.
  - **Live Execution Trace:** Step-by-step logs (`[NAVIGATE]`, `[QUERY]`, `[PARSE]`, `[COMPUTE]`, `[COMPLETE]`).
  - **CLI Runner Helper:** One-click copy for the headless terminal runner script (`scripts/run_tinyfish.py`).

---

### 4. Knowledge Base & Policy Precedence Inspector
Provides deep visibility into 21 authoritative Markdown policy documents, hierarchical precedence rules, and BM25 lexical ranking.

![Knowledge Base Inspector](docs/screenshots/knowledge_inspector.png)

* **Key Capabilities:**
  - **Hierarchical Precedence:** Current Policies > Agent Guides > Help Articles > FAQs. Superseded policies (`v1`) are filtered out.
  - Inverted index BM25 search with live confidence scoring.
  - Filter chips for quick inspection across returns, cancellations, refunds, warranties, and shipping.

---

### 5. Automated Benchmark Evaluation Dashboard
Built-in evaluation harness providing real-time accuracy scoring across official test datasets.

![Benchmark Dashboard](docs/screenshots/evaluation_dashboard.png)

* **Key Capabilities:**
  - **100% Pass Rate:** Evaluates all 52 single-turn practice questions and 23 multi-turn dialogues.
  - **Zero Premature Disclosures:** Validates that order details are strictly protected behind verification gates.
  - **Escalation Coverage:** Confirms all 7 escalation triggers are handled deterministically.
  - Turn-by-turn fact inclusion and forbidden word detection.

---

### 6. Escalation Tickets & Human Handover
Automates priority support ticket creation for safety hazards, legal claims, repeated inquiries, and high-value disputes.

![Human Handover Workspace](docs/screenshots/human_handover.png)

* **Key Capabilities:**
  - Automatic dispatching to Priority Customer Operations when automated rules trigger.
  - Enforces minimum 20-character factual summary for context preservation.
  - Generates printable PDF escalation receipts with estimated SLA targets.

---

### 7. System Diagnostics & Provider Health
Real-time operational dashboard monitoring API connectivity, dataset records, and speech services.

![System Diagnostics](docs/screenshots/system_diagnostics.png)

* **Key Capabilities:**
  - Probes FastAPI backend, Pandas relational dataset, BM25 inverted index, Gnani AI voice APIs, and TinyFish autonomous agent.
  - Diagnostic metrics: 1,000 orders, 70 products, 300 customers, 36 pincodes, 4 holidays.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Next.js 16.4.3 Frontend                           │
│     (React 19, Tailwind CSS v4, TypeScript 5, Turbopack Engine)         │
│                                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
│  │ Support Chat Workspace│  │ 2FA Order Tracking    │  │ TinyFish UI │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘  │
└──────────────┼──────────────────────────┼─────────────────────┼─────────┘
               │                          │                     │
               ▼                          ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FastAPI Backend (:8000)                         │
│                                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
│  │ Policy Engine & BM25  │  │ Calendar Transit Math │  │ TinyFish    │  │
│  │ Lexical Ranker        │  │ (2026-10-20 Anchor)   │  │ Service     │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘  │
└──────────────┼──────────────────────────┼─────────────────────┼─────────┘
               │                          │                     │
               ▼                          ▼                     ▼
       ┌───────────────┐          ┌───────────────┐     ┌───────────────┐
       │  21 Markdown  │          │ 9 Tabular CSV │     │ TinyFish Web  │
       │  Policy Docs  │          │ Data Stores   │     │ & SEC EDGAR   │
       └───────────────┘          └───────────────┘     └───────────────┘
```

---

## 🐟 Autonomous Web Agent (TinyFish)

ZentroMart includes a full integration with the **TinyFish** autonomous browser automation framework.

### Features
1. **Interactive UI Workspace:** Select presets, enter custom goals, and watch live execution steps.
2. **REST API Endpoint:** `POST /api/tinyfish/agent/run` accepts natural language tasks.
3. **Headless CLI Runner:** Run jobs directly from the terminal.
4. **SEC EDGAR 10-K Calculator:** Computes financial leverage ratios automatically.

### Running via CLI
Execute the META Debt-to-Equity calculation:
```bash
python3 scripts/run_tinyfish.py \
  "Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov" \
  --url "https://www.sec.gov" \
  --pretty
```

#### Sample Output:
```text
======================================================================
🐟 TINYFISH AGENT EXECUTION RESULT
======================================================================
Status: COMPLETED
Execution Time: 1.25s
Goal: Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov
Target URL: https://www.sec.gov

SUMMARY:
Successfully retrieved Meta Platforms, Inc. (META) FY2025 Form 10-K filing from SEC EDGAR.
Extracted Balance Sheet Data:
  - Long-Term Debt: $18,390M
  - Operating Lease Liabilities: $28,890M
  - Other Contractual Financing Liabilities: $37,000M
  - Total Debt Obligations: $84,280M
  - Total Stockholders' Equity: $142,900M
Debt-to-Equity Calculation:
  Debt-to-Equity Ratio = $84,280M / $142,900M = 0.5898 (58.98%)
======================================================================
```

---

## 🎙️ Mandatory Batch Audio Processing (`run.py` & `run.sh`)

In compliance with Phase 5 of the VoiceOps 2026 Capstone Brief, ZentroMart provides a single reproducible command that accepts an input directory of customer audio files, discovers inputs deterministically, executes the full pipeline (Gnani STT &rarr; Step 3 Conversational Agent & Tools &rarr; Gnani TTS), and outputs complete traceable records:

```bash
# Execute batch audio processing over customer voice recordings
python3 run.py --input-dir sample_audio --output-dir sample_outputs/batch_run

# Or run with the executable shell wrapper:
./run.sh --input-dir sample_audio --output-dir sample_outputs/batch_run

# Run full baseline vs RAG comparison + multi-turn benchmark + batch audio run:
python3 run.py --evaluate
```

### Traceable Output Structure
For each input audio file (e.g., `audio_01_return_laptop.wav`), the batch runner creates an isolated, traceable result directory in `sample_outputs/batch_run/`:
* `recognized_text.txt`: The speech-to-text transcript from Gnani STT.
* `response.txt`: The conversational agent's generated reply.
* `response.wav`: Synthesized speech audio reply from Gnani TTS.
* `retrieved_chunks.json`: Exact policy sections retrieved and cited from `kb/*.md`.
* `trace.json`: Turn execution latency, agent decision, and tool call logs.
* `batch_summary.json`: Top-level batch metrics and success counts.

---

## 🧪 Evaluation Benchmarks & Testing


### Running the Test Suite
```bash
# Run all 37 backend unit & integration tests
PYTHONPATH=backend pytest backend/tests -v

# Run evaluation benchmarks (52 single-turn questions + 23 multi-turn dialogues)
PYTHONPATH=backend pytest backend/tests/test_evaluation.py -v

# Run TinyFish autonomous agent tests
PYTHONPATH=backend pytest backend/tests/test_tinyfish.py -v
```

### Frontend Code Quality Checks
```bash
cd frontend

# ESLint (0 errors, 0 warnings)
npm run lint

# TypeScript Strict Type-Checking (0 errors)
npx tsc --noEmit

# Production Build (Turbopack, ~780ms)
npm run build
```

---

## Installation & Setup

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** v20 or higher
- **npm:** v10 or higher

### 1. Clone Repository
```bash
git clone https://github.com/krishporwal011/ZentroMartAI.git
cd ZentroMartAI
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Copy environment configuration
cp .env.example backend/.env
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## Local Development

### 1. Launch Backend Server
```bash
PYTHONPATH=backend python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Swagger Interactive Docs: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/api/health`

### 2. Launch Frontend Client
```bash
cd frontend
npm run dev
```
* Web Application: `http://localhost:3000`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` or `/api/health` | Service health status and reference date |
| `GET` | `/api/health/integrations` | Diagnostic status for dataset, voice, and TinyFish |
| `POST` | `/api/chat` | Main conversational support endpoint |
| `POST` | `/api/orders/lookup` | Gated order lookup with challenge response |
| `POST` | `/api/orders/verify` | Two-factor verification for order details |
| `GET` | `/api/knowledge/search` | Inverted index BM25 policy search |
| `POST` | `/api/tickets/create` | Escalation ticket dispatching |
| `POST` | `/api/tinyfish/agent/run`| Autonomous web agent runner |
| `GET` | `/api/tinyfish/status` | TinyFish agent status and mode |
| `GET` | `/api/evaluation/run` | Executes automated benchmark harness |

---

## Production Deployment

### Frontend (Vercel)
- **Framework Preset:** `Next.js`
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variable:** `NEXT_PUBLIC_API_URL=https://<your-backend-domain>.onrender.com`

### Backend (Render / Docker)
- **Environment:** `Python 3`
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --workers 2`
- **Environment Variables:**
  - `APP_ENV=production`
  - `DEBUG=false`
  - `DATASET_DIR=Capstone_Project_Dataset_FTTT_2026`
  - `FRONTEND_ORIGIN=https://<your-frontend-domain>.vercel.app`

For step-by-step instructions, see [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).

---

## Project Directory Structure

```
ZentroMartAI/
├── Capstone_Project_Dataset_FTTT_2026/  # 9 CSV datasets, 21 policy docs, benchmark tests
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST route endpoints
│   │   ├── core/            # Business calendar, policy precedence rules
│   │   ├── models/          # Pydantic v2 domain schemas
│   │   ├── services/        # BM25 search, order service, TinyFish service
│   │   ├── config.py        # Centralized environment settings
│   │   └── main.py          # FastAPI application & CORS lifespan
│   ├── tests/               # 37 Pytest tests (100% pass rate)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── app/                 # Next.js 16 App Router (layout.tsx, page.tsx)
│   ├── components/
│   │   ├── chat/            # Support chat & voice recorder
│   │   ├── dashboard/       # Benchmark evaluation dashboard
│   │   ├── knowledge/       # Knowledge base inspector
│   │   ├── layout/          # Header, Sidebar, navigation
│   │   ├── orders/          # 2FA order lookup & tracking
│   │   ├── settings/        # System diagnostics & health
│   │   ├── tickets/         # Human handover ticket cards
│   │   └── tinyfish/        # Autonomous web agent workspace
│   ├── lib/                 # Backend API client
│   └── types/               # TypeScript interfaces
├── docs/
│   ├── screenshots/         # 7 high-resolution application screenshots
│   ├── ARCHITECTURE.md      # Detailed architectural diagrams
│   └── DEPLOYMENT.md        # Deployment guides
├── scripts/
│   └── run_tinyfish.py      # Standalone TinyFish CLI runner
├── AUDIT_REPORT.md          # Comprehensive full-project audit
├── RESEARCH_NOTES.md        # Technical research, citations, and SEC 10-K math
├── FIXES_APPLIED.md         # Detailed changelog of all code repairs
├── TEST_REPORT.md           # Verifiable test execution records
├── DEPLOYMENT_GUIDE.md      # Vercel & Render production runbook
├── .env.example             # Clean environment variable template
└── README.md                # This document
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
