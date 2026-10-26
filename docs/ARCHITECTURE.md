# ZentroMart AI Customer Support Platform: System Architecture

## 1. Architectural Overview

ZentroMart AI Customer Support Platform is an enterprise-grade conversational AI application designed for Indian e-commerce support. The platform pairs deterministic business logic and policy precedence rules with hybrid knowledge retrieval (BM25 + semantic) and a conversational AI model adapter, supported by Indian vernacular voice capabilities via Gnani AI.

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Next.js 15 App Router)"]
        UI["Responsive Support Shell (Desktop & Mobile)"]
        ChatUI["Chat Workspace & Citation Inspector"]
        OrderModal["Identity Verification Modal"]
        OrderCard["Verified Order & Return Timeline Card"]
        TicketBanner["Support Ticket Handover Status"]
        VoiceIO["Gnani Voice Recorder & Player"]
        EvalDash["Benchmark Evaluation Dashboard"]
        HealthDash["Integration Health & Diagnostic View"]
    end

    subgraph APILayer ["API Layer (FastAPI Backend :8000)"]
        Router["FastAPI Application Router"]
        ChatEndpoint["/api/chat & /api/conversations"]
        OrderEndpoint["/api/orders/lookup"]
        TicketEndpoint["/api/tickets"]
        KnowledgeEndpoint["/api/knowledge/search"]
        VoiceEndpoint["/api/voice/transcribe & synthesize"]
        EvalEndpoint["/api/evaluation/run & summary"]
        HealthEndpoint["/api/health & /api/health/integrations"]
    end

    subgraph CoreServices ["Core Reasoning & Business Services"]
        ConvEngine["Conversation State Machine & Session Store"]
        IntentClassifier["Vernacular & Multilingual Intent Classifier"]
        PolicyEngine["Policy Precedence & Return Eligibility Engine"]
        CalendarEngine["Fixed-Date Business Calendar (2026-10-20)"]
        EscalationEngine["7-Rule Escalation Engine (ESC-1 to ESC-7)"]
        LLMAdapter["LLM Provider Abstraction (Hosted + Deterministic)"]
    end

    subgraph RetrievalLayer ["Retrieval-Augmented Generation (RAG) Layer"]
        Chunker["Semantic Section Markdown Chunker (## [SECTION-ID])"]
        BM25["BM25 Lexical & Inverted Index"]
        PrecedenceFilter["Policy Precedence Re-Ranker"]
        KBStore["21 Markdown Knowledge Documents (/kb/*.md)"]
    end

    subgraph SecurityTools ["Secure Tool Execution Layer"]
        SecGate["Identity Verification Gatekeeper"]
        MockTools["tools.py (lookup_order & create_ticket)"]
        SyntheticDB["String-Preserved CSV Relational Store"]
    end

    subgraph ExternalServices ["External Service Integrations"]
        GnaniSTT["Gnani Prisma v2.5 STT REST / Streaming API"]
        GnaniTTS["Gnani Timbre v2.5 TTS REST / Streaming API"]
        HostedLLM["Upstream LLM Provider (Optional)"]
    end

    UI --> ChatEndpoint
    VoiceIO --> VoiceEndpoint
    EvalDash --> EvalEndpoint
    HealthDash --> HealthEndpoint
    OrderModal --> OrderEndpoint
    TicketBanner --> TicketEndpoint

    Router --> CoreServices
    CoreServices --> RetrievalLayer
    CoreServices --> SecurityTools
    VoiceEndpoint --> GnaniSTT
    VoiceEndpoint --> GnaniTTS
    LLMAdapter --> HostedLLM
    SecurityTools --> MockTools
    MockTools --> SyntheticDB
    RetrievalLayer --> KBStore
```

---

## 2. Component Breakdown

### 2.1 Backend Services (`backend/app/`)

| Module | Responsibility | Key Interfaces |
|---|---|---|
| `app.core.dataset_loader` | String-preserving loader for 9 CSV tables (1,000 orders, 70 products, 300 customers, 1,783 items, holidays, pincodes, logs). Relational join resolution. | `get_order(id)`, `get_customer(id)`, `get_product(sku)`, `get_pincode(pin)` |
| `app.core.business_calendar` | Date calculations anchored to reference date **20 October 2026**. Monday–Saturday business days, Sunday exclusion, 4 warehouse holiday exclusions. | `add_business_days()`, `diff_business_days()`, `format_bilingual_date()` |
| `app.services.retrieval` | Document ingestion of 21 markdown files. Chunks by `## [SECTION-ID]`. BM25 ranker with policy document weight multipliers and multilingual synonym expansion. | `search(query, top_k, min_score)` |
| `app.services.policy_engine` | Return windows by product category (clothing: 7d, electronics: 7d [10d pre-Aug-1], large appliances: 10d, footwear: 14d, books: 7d, beauty/grocery: non-returnable). Festive sale extension (RET-8). | `check_return_eligibility()`, `calculate_refund_timeline()` |
| `app.services.escalation` | Evaluates 7 mandatory escalation rules. Formats detailed handover summaries ($\ge 20$ chars) and calls `create_ticket`. | `evaluate_escalation()`, `dispatch_ticket()` |
| `app.services.conversation` | Multi-turn state machine. Manages session lifecycles, verification challenges, retry tracking (max 1 retry), tool execution, and citation aggregation. | `handle_message()`, `reset_session()` |
| `app.services.voice_service` | Gnani Prisma v2.5 STT (`api.vachana.ai/stt/v3`) & Timbre v2.5 TTS (`api.vachana.ai/api/v1/tts/inference`) with honest unconfigured fallback. | `transcribe_audio()`, `synthesize_speech()` |
| `app.services.evaluation` | Automated benchmark harness for 52 practice questions and 23 multi-turn conversations. Computes fact coverage, forbidden checks, tool decisions, and evidence accuracy. | `evaluate_questions()`, `evaluate_conversations()` |
| `app.tools.tools_adapter` | Safe proxy to `tools.py`. Enforces `lookup_order` verification contract and `create_ticket` summary length validation. | `lookup_order()`, `create_ticket()` |

---

## 3. Data Flow & Security Boundaries

### 3.1 Order Lookup & Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Browser)
    participant State as Conversation State Machine
    participant Gate as Security Gatekeeper
    participant Tools as tools.py (lookup_order)
    participant DB as Synthetic Orders Store

    Customer->>State: "Where is my order 67830826?"
    State->>Tools: lookup_order("67830826", None)
    Tools->>DB: Scan orders.csv
    DB-->>Tools: Order exists
    Tools-->>State: {"verified": false, "message": "Verification required..."}
    Note over State: Never disclose private order data or order existence
    State-->>Customer: "Please provide the last 4 digits of your phone or your delivery pincode."

    Customer->>State: "My pincode is 560103"
    State->>Gate: Validate input format (4 digits or 6 digits)
    State->>Tools: lookup_order("67830826", "560103")
    Tools->>DB: Compare verification_value against phone_suffix / pincode
    DB-->>Tools: Match confirmed
    Tools-->>State: {"verified": true, "order": {...}}
    State->>State: Mark session.verified = True, session.order_id = "67830826"
    State-->>Customer: Returns verified delivery/refund status with citation [RET-7, REF-1]
```

### 3.2 Security Boundaries

1. **Client Isolation**: The browser client receives only sanitized responses. Unverified lookup requests never receive order items, totals, tracking numbers, or customer names.
2. **Session Boundary**: Verification status is tied exclusively to the active `conversation_id` and specific `order_id`. A client cannot use verification of Order A to query Order B.
3. **Retry Exhaustion**: After 2 failed verification attempts (initial + 1 retry), the order is locked for that session, and human assistance is offered.

---

## 4. Policy Precedence Engine

The system strictly enforces the hierarchy specified in `kb/00_about_this_knowledge_base.md`:

```mermaid
graph TD
    P1["1. Current Official Policies (Weight 1.5x)\n(POL_*.md, Effective 2026-08-01 / 2026-10-01)"]
    P2["2. Current Agent Guides (Weight 1.3x)\n(agent_*.md)"]
    P3["3. Help Articles (Weight 1.1x)\n(help_*.md)"]
    P4["4. FAQs (Weight 1.0x)\n(faq_*.md)"]
    P5["5. Marketing Pages (Weight 0.8x)\n(marketing_*.md)"]
    P0["6. Superseded Policies (Weight 0.0x / Disqualified)\n(POL_return_refund_v1.md)"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 -.->|Cannot Override| P1
    P0 -.->|Filtered Out| P1
```

### Temporal Precedence Rules
- **Electronics Return Window Transition (`RET-3`)**:
  - Orders placed **before 2026-08-01**: 10-day return window.
  - Orders placed **on or after 2026-08-01**: 7-day return window.
- **Festive Season Promotional Extension (`RET-8`)**:
  - Orders placed **between 2026-10-01 and 2026-10-15**: 30-day extended return window across all returnable categories.

---

## 5. Multi-Turn Conversation State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: New Session
    Idle --> Greeting: User greets
    Idle --> IntentIdentified: User asks question

    IntentIdentified --> RAGAnswer: General FAQ / Policy Query
    IntentIdentified --> OrderPrompt: Order query without Order ID
    IntentIdentified --> VerifyPrompt: Order ID provided, not verified

    OrderPrompt --> VerifyPrompt: User provides Order ID
    VerifyPrompt --> VerifyEval: User submits 4-digit phone or pincode

    VerifyEval --> OrderFulfilled: Verification Succeeded
    VerifyEval --> VerifyRetry: Verification Failed (Attempt 1)
    VerifyRetry --> VerifyEval: User retries
    VerifyEval --> VerifyLocked: Verification Failed (Attempt 2)
    VerifyLocked --> Escalated: Offer human support

    OrderFulfilled --> OrderFollowUp: Return / Refund / Timeline query
    OrderFulfilled --> EscalationCheck: High value / Safety hazard / Legal

    EscalationCheck --> Escalated: Trigger criteria met
    Escalated --> TicketCreated: create_ticket() succeeded
    TicketCreated --> Idle: Conversation continues with Ticket ID
```

---

## 6. Voice Processing Pipeline (Gnani AI)

```mermaid
sequenceDiagram
    actor User as User (Microphone)
    participant Browser as Web Audio API / MediaRecorder
    participant FastAPIVoice as /api/voice/transcribe
    participant GnaniSTT as Gnani Prisma v2.5 STT
    participant Agent as Conversation Engine
    participant FastAPITTS as /api/voice/synthesize
    participant GnaniTTS as Gnani Timbre v2.5 TTS
    participant Speaker as Web Audio Player

    User->>Browser: Speaks question (Hindi / Hinglish / English)
    Browser->>Browser: Record audio/webm or audio/wav
    Browser->>FastAPIVoice: POST audio multipart + language_code
    FastAPIVoice->>GnaniSTT: Forward to api.vachana.ai/stt/v3 (X-API-Key-ID)
    GnaniSTT-->>FastAPIVoice: {"transcript": "मेरा रिफ़ंड कब आएगा"}
    FastAPIVoice-->>Browser: JSON transcript
    Note over Browser: User reviews/edits transcript before sending
    Browser->>Agent: POST /api/chat {"message": transcript}
    Agent-->>Browser: Agent response text + citations
    Browser->>FastAPITTS: POST /api/voice/synthesize {"text": response, "language": "hi"}
    FastAPITTS->>GnaniTTS: POST api.vachana.ai/api/v1/tts/inference
    GnaniTTS-->>FastAPITTS: Audio bytes (WAV/MP3)
    FastAPITTS-->>Browser: Audio buffer stream
    Browser->>Speaker: Plays response audio with playback controls
```

If `GNANI_API_KEY` is not present, the voice endpoints return HTTP 503 with `"status": "unconfigured"`, and the frontend displays a clear status pill without blocking text chat.
