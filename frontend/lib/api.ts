import {
  HealthResponse,
  EvaluationReport,
  OrderDetails,
  Citation,
  TinyFishStatus,
  TinyFishRunRequest,
  TinyFishRunResponse,
} from "@/types";

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  // When running in browser on Vercel, default to deployed Render backend
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://zentromartai.onrender.com";
  }
  return "http://localhost:8000";
}

const API_BASE = getApiBaseUrl();

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;
    const headers = {
      Accept: "application/json",
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data.detail) errDetail = data.detail;
      } catch {
        // use default
      }
      throw new Error(errDetail);
    }
    return res.json();
  }

  // Chat
  static async sendMessage(
    message: string,
    conversationId?: string,
    language: string = "en"
  ): Promise<{
    conversation_id: string;
    response: string;
    intent: string;
    decision: "answer" | "escalate" | "clarify" | "verify";
    evidence: string[];
    tool_calls: string[];
    verified: boolean;
    order_id?: string;
    ticket_id?: string;
    workflow: string;
  }> {
    return this.request("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        language,
      }),
    });
  }

  // Conversation Management
  static async getConversation(conversationId: string): Promise<{
    conversation_id: string;
    messages: Array<{ role: string; content: string }>;
    workflow: string;
    verified: boolean;
    order_id?: string;
    ticket_id?: string;
  }> {
    return this.request(`/api/conversations/${conversationId}`);
  }

  static async resetConversation(conversationId: string): Promise<void> {
    await this.request(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }

  // Order Lookup
  static async lookupOrder(
    orderId: string,
    verificationValue?: string
  ): Promise<{
    verified: boolean;
    message?: string;
    order?: OrderDetails;
    allowed_methods?: string[];
  }> {
    return this.request("/api/orders/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        verification_value: verificationValue || null,
      }),
    });
  }

  // Tickets
  static async createTicket(
    summary: string,
    orderId?: string,
    intent?: string,
    reason?: string
  ): Promise<{
    created: boolean;
    ticket_id?: string;
    message?: string;
  }> {
    return this.request("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary,
        order_id: orderId || null,
        intent: intent || null,
        reason: reason || null,
      }),
    });
  }

  // Knowledge Search
  static async searchKnowledge(
    query: string,
    topK: number = 4
  ): Promise<{
    results: Citation[];
    count: number;
    query: string;
  }> {
    return this.request(
      `/api/knowledge/search?q=${encodeURIComponent(query)}&top_k=${topK}`
    );
  }

  // Health and Integrations
  static async getHealth(): Promise<HealthResponse> {
    return this.request("/api/health/integrations");
  }

  // Evaluation
  static async getEvaluationSummary(): Promise<{
    single_questions: {
      total: number;
      passed: number;
      accuracy_pct: number;
    };
    multi_turn: {
      total: number;
      passed: number;
      accuracy_pct: number;
    };
  }> {
    return this.request("/api/evaluation/summary");
  }

  static async runEvaluation(datasetType: "questions" | "conversations" | "all"): Promise<EvaluationReport | Record<string, unknown>> {
    return this.request("/api/evaluation/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_type: datasetType }),
    });
  }

  // Voice STT
  static async transcribeAudio(
    audioBlob: Blob,
    languageCode: string = "hi-IN"
  ): Promise<{
    transcript: string;
    confidence: number;
    language: string;
    provider: string;
  }> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("audio_file", audioBlob, "recording.webm");
    formData.append("language_code", languageCode);

    const url = `${API_BASE}/api/voice/transcribe`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Transcription failed: HTTP ${res.status}`);
    }
    return res.json();
  }

  // Voice TTS
  static async synthesizeSpeech(
    text: string,
    languageCode: string = "hi",
    voice?: string
  ): Promise<Blob> {
    const url = `${API_BASE}/api/voice/synthesize`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language: languageCode,
        voice,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Synthesis failed: HTTP ${res.status}`);
    }
    return res.blob();
  }

  // TinyFish Autonomous Web Agent
  static async getTinyFishStatus(): Promise<TinyFishStatus> {
    return this.request<TinyFishStatus>("/api/tinyfish/status");
  }

  static async runTinyFishAgent(
    req: TinyFishRunRequest
  ): Promise<TinyFishRunResponse> {
    return this.request<TinyFishRunResponse>("/api/tinyfish/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  }
}
