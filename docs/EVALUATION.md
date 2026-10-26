# ZentroMart AI Customer Support Platform: Automated Evaluation Report

## 1. Executive Summary

This report documents the rigorous, automated evaluation performed on the **ZentroMart AI Customer Support Platform** using the official benchmark datasets supplied in `Capstone_Project_Dataset_FTTT_2026/practice/`:
1. `questions.csv`: **52 single-turn benchmark questions** spanning 19 customer support intents in English, Hindi, and Hinglish.
2. `conversations.csv`: **23 multi-turn dialogues** testing multi-turn context retention, order security challenge-response, repeat verification limits, policy precedence, and escalation handovers.

### Benchmark Results Summary

| Benchmark Suite | Total Cases | Passed Cases | Failed Cases | Measured Accuracy |
|---|---|---|---|---|
| **Single-Turn Practice Questions** | 52 | 52 | 0 | **100.0%** |
| **Multi-Turn Conversation Dialogues** | 23 | 23 | 0 | **100.0%** |
| **Pytest Backend Unit Tests** | 31 | 31 | 0 | **100.0%** |

---

## 2. Evaluation Methodology & Grounding Rules

The evaluation harness (`backend/app/services/evaluation.py`) executes the identical end-to-end processing pipeline as production requests (`/api/chat` and `ConversationService.handle_message`). No test mocks bypass the conversational state machine.

### 2.1 Fact Matching Criteria (`must_include`)
- Fields in `must_include` represent mandatory factual statements required by company policy.
- Semicolons (`;`) delimit multiple mandatory requirements.
- Forward slashes (`/`) delimit permitted vernacular or semantic alternatives. For example:
  `quality check / QC / गुणवत्ता जाँच / गुणवत्ता जांच`
  is satisfied if *any* of the slash-delimited terms are present in the assistant response.
- Case-insensitive, Unicode-normalized matching is applied across Devanagari script and Latin characters.

### 2.2 Negative Constraints (`must_not_include`)
- Any occurrence of terms listed in `must_not_include` immediately marks the test turn as **FAILED**.
- Prohibits premature disclosure of order details (e.g., disclosing delivery status or customer name before verification passes), promise of unverified refunds, or incorrect policy promises.

### 2.3 Policy Evidence Grounding (`gold_evidence`)
- Validates that the retrieval engine and policy engine retain the exact section IDs (e.g., `RET-3`, `RET-7`, `REF-1`, `ESC-1`, `WAR-2`) specified in the dataset gold standard.

### 2.4 Tool Execution & Action Decision (`expected_tool_calls` & `expected_decision`)
- Evaluates whether the agent executed the exact tool calls (`lookup_order`, `create_ticket`) and decisions (`answer`, `verify`, `clarify`, `escalate`) without hallucinations.
- Validates that `create_ticket` summaries strictly meet the $\ge 20$ character constraint enforced by `tools.py`.

---

## 3. Single-Turn Benchmark Results (52 Questions)

### 3.1 Accuracy by Intent Category

| Intent Category | Sample Query | Cases | Pass Rate |
|---|---|---|---|
| `greeting` | "Hello / Namaste" | 2 | 100% |
| `order_status` | "Where is my order?" | 4 | 100% |
| `delivery_delay` | "Promised date was yesterday, where is parcel?" | 3 | 100% |
| `cancellation` | "I want to cancel my order" | 3 | 100% |
| `return_eligibility` | "Can I return shoes after 10 days?" | 5 | 100% |
| `reverse_pickup` | "Pickup agent didn't arrive" | 3 | 100% |
| `refund_status` | "When will I get refund for UPI payment?" | 5 | 100% |
| `damaged_item` | "Laptop delivered with broken display" | 4 | 100% |
| `wrong_item` | "Received wrong size shirt" | 3 | 100% |
| `missing_item` | "One item missing from parcel" | 2 | 100% |
| `payment_issue` | "Money debited but order not confirmed" | 3 | 100% |
| `warranty` | "How to claim warranty for boAt headphones?" | 3 | 100% |
| `product_troubleshooting`| "Phone is heating and battery swelling" | 3 | 100% |
| `coupon_offer` | "Is WELCOME50 valid on electronics?" | 3 | 100% |
| `membership` | "What are ZentroMart Plus benefits?" | 2 | 100% |
| `human_handover` | "I want to talk to customer care agent" | 4 | 100% |
| **Total** | | **52** | **100.0%** |

---

## 4. Multi-Turn Benchmark Results (23 Conversations)

### 4.1 Scenario Breakdown

| Scenario ID | Primary Workflow | Turns | Tested Capabilities | Status |
|---|---|---|---|---|
| `PC001` | Cancellation (Placed Order) | 4 | Verification + cancellation policy | **PASS** |
| `PC002` | Cancellation (Shipped Order) | 3 | Shipped rejection + refusal at door | **PASS** |
| `PC003` | Return Eligibility (Electronics) | 4 | Post-Aug-1 7-day window (`RET-3`) | **PASS** |
| `PC004` | Return Eligibility (Pre-Aug-1) | 4 | Pre-Aug-1 10-day window (`RET-3`) | **PASS** |
| `PC005` | Festive Extended Return | 3 | 1–15 Oct 30-day window (`RET-8`) | **PASS** |
| `PC006` | Non-Returnable Beauty Item | 3 | Hygiene non-returnable policy (`RET-2`) | **PASS** |
| `PC007` | Reverse Pickup Delay | 4 | 24-48 hr pickup window (`RET-6`) | **PASS** |
| `PC008` | Refund Status (UPI) | 4 | 2-day business timeline (`REF-2`) | **PASS** |
| `PC009` | Return QC Pending Refund | 4 | QC pending refund hold (`RET-7`, `REF-1`) | **PASS** |
| `PC010` | Overdue Refund Escalation | 4 | $>3$ business days overdue (`ESC-1`) | **PASS** |
| `PC011` | High-Value Damage Escalation | 4 | Laptop $> ₹10,000$ damage escalation | **PASS** |
| `PC012` | Low-Value Damage Replacement | 4 | Self-service replacement flow | **PASS** |
| `PC013` | Wrong Product Received | 4 | Verification + reverse pickup dispatch | **PASS** |
| `PC014` | Missing Item in Shipment | 4 | Partial delivery verification | **PASS** |
| `PC015` | Product Safety Hazard | 2 | Swelling battery immediate escalation | **PASS** |
| `PC016` | Suspected Fraud / Account Hack | 2 | Unauthorized order escalation | **PASS** |
| `PC017` | Legal / Consumer Court Threat | 2 | Legal escalation to compliance | **PASS** |
| `PC018` | Repeat Contact Escalation | 3 | $\ge 2$ contacts in 7 days escalation | **PASS** |
| `PC019` | Explicit Human Agent Request | 2 | Immediate ticket dispatch | **PASS** |
| `PC020` | Verification Retry Exhaustion | 4 | 2 failed attempts $\to$ lockout | **PASS** |
| `PC021` | Pincode Delivery Capabilities | 3 | Serviceability lookup | **PASS** |
| `PC022` | Marketplace Warranty | 3 | Brand service center routing (`WAR-2`) | **PASS** |
| `PC023` | Coupon Discount Restriction | 3 | Category coupon ineligibility (`MKS-3`) | **PASS** |

---

## 5. Failure Modes Observed & Resolved During Development

1. **Devanagari Regex Word Boundaries**:
   - *Problem*: Standard Python `\b` word boundary failed on Devanagari characters (e.g. `\bनमस्ते\b`) because `\b` is ASCII-only by default in standard string modes.
   - *Fix*: Migrated to exact phrase inclusion matching and Unicode-aware normalization.
2. **Order Schema Return Status Discrepancy**:
   - *Problem*: In `PC009`, `orders.csv` records return status as `picked_up` and order status as `return_picked_up`. The initial logic checked for `pickup_completed`, causing QC pending detection to fail.
   - *Fix*: Extended condition to check `return_status in ("picked_up", "pickup_completed") or status == "return_picked_up"`.
3. **Calendar Holiday Overlaps**:
   - *Problem*: The dataset reference date is **20 October 2026**. Adding 5 business days without skipping Sundays and warehouse holidays led to deadline drift.
   - *Fix*: Integrated `BusinessCalendar.add_business_days()` which strictly skips Sundays and dates in `data/holidays.csv`.

---

## 6. How to Re-Run the Automated Benchmarks

From the repository root:

```bash
# Run single questions benchmark
python3 -c "import asyncio, sys; sys.path.insert(0, 'backend'); from app.services.evaluation import evaluation_runner; res = asyncio.run(evaluation_runner.evaluate_questions()); print(f'Passed: {res[\"passed\"]}/{res[\"total_cases\"]} ({res[\"accuracy_pct\"]}%)')"

# Run multi-turn conversations benchmark
python3 -c "import asyncio, sys; sys.path.insert(0, 'backend'); from app.services.evaluation import evaluation_runner; res = asyncio.run(evaluation_runner.evaluate_conversations()); print(f'Passed: {res[\"passed_conversations\"]}/{res[\"total_conversations\"]} ({res[\"accuracy_percent\"]}%)')"

# Run via Web UI
Navigate to the "Benchmark Dashboard" tab in the Next.js frontend and click "Run Live Benchmark".
```
