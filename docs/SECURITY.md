# ZentroMart AI Customer Support Platform: Security & Privacy Architecture

## 1. Executive Summary

The ZentroMart AI Customer Support platform handles customer inquiries, sensitive order history, refund details, and escalation workflows. This document details the security boundaries, authentication controls, privacy protections, prompt-injection defenses, and production hardening requirements implemented across the frontend and backend architectures.

---

## 2. Identity Verification Model

### 2.1 Synthetic Verification Workflow (`lookup_order`)
The system strictly enforces a two-factor verification barrier before disclosing any order details:

```
[Customer Query]
       │
       ▼
┌─────────────────────────┐
│ Provides Order ID Only  │ ──► Call lookup_order(order_id, None)
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Response: Verified=False│ ──► Request either:
└─────────────────────────┘     • Last 4 digits of registered phone number
                                • 6-digit delivery pincode
       │
       ▼
┌─────────────────────────┐
│ Customer provides code  │ ──► Call lookup_order(order_id, value)
└─────────────────────────┘
       │
       ├── Match: Verified=True ──► Disclose order details
       │
       └── Mismatch: Verified=False (Retry 1 allowed)
             │
             └── Mismatch (Attempt 2) ──► Lock order lookup, route to human agent
```

### 2.2 Enumeration & Existence Protection
- If an invalid or non-existent Order ID is passed to `lookup_order(order_id, None)`, the backend returns the **same challenge structure** as a valid order (`verified: false`).
- The system **never discloses** whether an order ID exists in the database prior to successful verification.
- This prevents malicious actors from enumerating valid order IDs across the 1,000 synthetic order records.

### 2.3 Educational / Synthetic Limitations
> [!WARNING]
> The supplied `tools.lookup_order()` tool matches the provided verification value against synthetic CSV records (`customer_phone[-4:]` or `delivery_pincode`). This is an educational simulation of identity challenge-response and is **not** a substitute for cryptographic session authentication (OAuth 2.0 / OIDC / OTP).

---

## 3. Privacy & Sensitive Data Boundaries

### 3.1 Zero Secret Logging
- Verification values (phone suffixes and delivery pincodes) are **never written** to disk logs, terminal outputs, or persistence records.
- Session logs record only the metadata: `{"verified": bool, "attempts": int, "workflow": str}`.

### 3.2 LLM Prompt Hygiene
- Verification codes and unverified customer data are **never injected** into upstream LLM prompts.
- The prompt sent to the LLM or conversational adapter contains only:
  - Sanitized customer message
  - Retrieved policy chunks
  - Post-verification order facts (items, delivery date, status)
- The customer's registered phone number, customer ID, and pincode are never transmitted to external AI providers.

### 3.3 Session Isolation
- Verification status is tied exclusively to the active `conversation_id`.
- A verified session for Order `67830826` **cannot** be reused to inspect Order `89782837`.
- Resetting or initiating a new conversation immediately revokes all verification privileges and wipes in-memory session caches.

---

## 4. Prompt Injection & Jailbreak Defenses

### 4.1 Untrusted Context Segregation
Customer inputs and retrieved markdown text are treated as **untrusted data**.
- System instructions explicitly forbid the agent from adopting new personas, altering company policies, or granting unauthorized refunds.
- The agent enforces deterministic business rules for all financial and legal decisions:
  - Return window calculation (`check_return_eligibility`) is governed by Python code, not LLM discretion.
  - Refund business-day deadlines are computed deterministically via `BusinessCalendar`.
  - Escalation rules (`ESC-1` through `ESC-7`) are evaluated deterministically.

### 4.2 Indirect Injection Mitigation
- Knowledge base markdown documents are chunked and sanitized before indexing.
- The LLM provider abstraction enforces structured output schemas, preventing prompt leaks or arbitrary tool execution.

---

## 5. Secret Management & API Security

### 5.1 Server-Side Credentials
- All external API credentials (`GNANI_API_KEY`, `GNANI_TOKEN`, `LLM_API_KEY`) reside exclusively in backend environment variables.
- The Next.js frontend has zero access to speech or LLM provider tokens.
- All speech transcription (STT) and synthesis (TTS) requests are proxied through FastAPI endpoints:
  - `POST /api/voice/transcribe`
  - `POST /api/voice/synthesize`

### 5.2 Honest Fallback States
- When credentials are not configured, the backend reports `status: "unconfigured"` with HTTP 503.
- The frontend renders an honest "Configuration Required" badge without disabling the core text support workflow.
- No dummy or mock success signals are fabricated.

---

## 6. Input Validation & Request Constraints

| Endpoint | Input Constraint | Validation Rule |
|---|---|---|
| `/api/chat` | Message text $\le 2000$ characters | Pydantic `Field(max_length=2000)` |
| `/api/orders/lookup` | Order ID format: 8 digits | Regex `^\d{8}$` |
| `/api/orders/lookup` | Verification code: 4 or 6 digits | Regex `^(\d{4}|\d{6})$` |
| `/api/tickets` | Summary length $\ge 20$ chars | Pydantic `Field(min_length=20)` |
| `/api/voice/transcribe` | Audio file $\le 10$ MB | FastAPI `UploadFile` size check |
| `/api/knowledge/search` | Query text $\le 500$ chars | Pydantic string validation |

---

## 7. Production Hardening Roadmap

Before deploying this architecture to real-world production environments with live customer data, implement the following enhancements:

1. **Enterprise Identity Provider (IdP)**: Replace the synthetic 4-digit/pincode challenge with an SMS/WhatsApp OTP service or SSO (OIDC/SAML).
2. **Mutual TLS & Network Isolation**: Deploy the FastAPI backend inside a private VPC with ingress restricted to the Next.js reverse proxy.
3. **Hardware Security Module (HSM) / KMS**: Store provider secrets in AWS Secrets Manager or HashiCorp Vault with automated rotation.
4. **Rate Limiting & WAF**: Enforce token-bucket rate limiting (e.g., 60 requests/min per IP) and Cloudflare WAF protection against DDoS and automated credential stuffing.
5. **PII Masking Pipeline**: Deploy Microsoft Presidio or an on-premise regex PII scrubber to redact credit card numbers, Aadhaar numbers, and addresses in real-time.
