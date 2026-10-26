export type LanguageCode = "en" | "hi" | "hi-en";

export interface Citation {
  section_id: string;
  doc_title: string;
  source_file: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  intent?: string;
  decision?: "answer" | "escalate" | "clarify" | "verify";
  evidence?: string[];
  tool_calls?: string[];
  verified?: boolean;
  order_id?: string;
  ticket_id?: string;
  audio_url?: string;
  error?: boolean;
}

export interface OrderItem {
  sku: string;
  title: string;
  category: string;
  quantity: number;
  price_inr: number;
  return_window_days?: number;
}

export interface OrderDetails {
  order_id: string;
  customer_id?: string;
  placed_at: string;
  status: string;
  payment_method: string;
  delivery_type: string;
  delivery_pincode: string;
  promised_date?: string;
  delivered_on?: string;
  subtotal_inr: number;
  total_inr: number;
  items: OrderItem[];
  timeline?: string;
  return_status?: string;
  return_requested_on?: string;
  return_pickup_on?: string;
  return_qc_passed_on?: string;
  refund_status?: string;
  refund_amount_inr?: number;
  refund_rrn?: string;
  contacts_last_7_days?: number;
}

export interface SupportTicket {
  ticket_id: string;
  order_id?: string;
  customer_id?: string;
  intent?: string;
  reason?: string;
  summary: string;
  created_at: string;
  status: string;
}

export interface EvaluationTurn {
  turn: number;
  passed: boolean;
  expected_decision: string;
  actual_decision: string;
  missing_facts: string[];
  violations: string[];
  expected_tools: string[];
  actual_tools: string[];
  response: string;
}

export interface EvaluationItem {
  id?: string;
  conversation_id?: string;
  question?: string;
  scenario?: string;
  language?: string;
  passed: boolean;
  total_turns?: number;
  turns?: EvaluationTurn[];
  expected_decision?: string;
  actual_decision?: string;
  missing_facts?: string[];
  violations?: string[];
  response?: string;
}

export interface EvaluationReport {
  total_cases: number;
  passed: number;
  failed: number;
  accuracy_pct: number;
  passed_cases?: number;
  passed_conversations?: number;
  total_conversations?: number;
  intent_accuracy_pct?: number;
  evidence_accuracy_pct?: number;
  tool_accuracy_pct?: number;
  failures: EvaluationItem[];
  results?: EvaluationItem[];
}

export interface IntegrationItem {
  name: string;
  status: string;
  details: string;
  model_or_version?: string;
}

export interface HealthResponse {
  status: string;
  reference_date: string;
  dataset_records?: Record<string, number>;
  integrations: IntegrationItem[];
}

export interface TinyFishPreset {
  id: string;
  title: string;
  goal: string;
  url: string;
  category: string;
}

export interface TinyFishStatus {
  configured: boolean;
  provider: string;
  api_url: string;
  masked_api_key?: string | null;
  presets: TinyFishPreset[];
}

export interface TinyFishStep {
  step: number;
  action: string;
  status: string;
}

export interface TinyFishRunRequest {
  goal: string;
  url: string;
  pretty?: boolean;
}

export interface TinyFishRunResponse {
  success: boolean;
  run_id: string;
  status: string;
  provider: string;
  goal: string;
  url: string;
  execution_time_seconds?: number;
  steps: TinyFishStep[];
  result: Record<string, unknown>;
  formatted_output: string;
  warning?: string | null;
  simulated?: boolean;
}

