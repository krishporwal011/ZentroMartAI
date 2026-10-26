"use client";

import React, { useState, useEffect } from "react";
import { HealthResponse } from "@/types";
import { ApiClient } from "@/lib/api";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Server,
  Database,
  BookOpen,
  Cpu,
  Mic,
  Volume2,
  RefreshCw,
  Key,
} from "lucide-react";

export function IntegrationHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getHealth();
      setHealth(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch integration health.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    ApiClient.getHealth()
      .then((res) => {
        if (!ignore) {
          setHealth(res);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to fetch integration health.");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "connected":
      case "healthy":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "Connected & Active",
        };
      case "fallback":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: AlertCircle,
          label: "Deterministic Fallback",
        };
      case "unconfigured":
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          icon: HelpCircle,
          label: "Configuration Required",
        };
      default:
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: AlertCircle,
          label: status?.toUpperCase() || "DEGRADED",
        };
    }
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("dataset") || lower.includes("store")) return Database;
    if (lower.includes("knowledge") || lower.includes("indexer") || lower.includes("base")) return BookOpen;
    if (lower.includes("llm") || lower.includes("provider") || lower.includes("model")) return Cpu;
    if (lower.includes("speech-to-text") || lower.includes("stt")) return Mic;
    if (lower.includes("text-to-speech") || lower.includes("tts")) return Volume2;
    return Server;
  };

  const backendCard = {
    id: "backend",
    name: "FastAPI Backend Service",
    icon: Server,
    status: health?.status === "healthy" ? "connected" : "error",
    detail: "FastAPI REST API with Pydantic typing and error boundaries",
    note: `Reference Date: ${health?.reference_date || "2026-10-20"}`,
  };

  const backendIntegrations = Array.isArray(health?.integrations)
    ? health.integrations.map((item, idx) => ({
        id: `item-${idx}`,
        name: item.name,
        icon: getIcon(item.name),
        status: item.status,
        detail: item.details,
        note: item.model_or_version ? `Model/Version: ${item.model_or_version}` : "",
      }))
    : [];

  const cards = health ? [backendCard, ...backendIntegrations] : [];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">
            System & Integration Diagnostics
          </h3>
          <p className="text-xs text-slate-500">
            Real-time status of backend services, dataset, models, and speech APIs
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="my-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Dataset Statistics Counters */}
      {health?.dataset_records && (
        <div className="my-4 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Loaded Synthetic Dataset Scope (Reference: {health.reference_date})
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900">{health.dataset_records.orders?.toLocaleString() || 1000}</div>
              <div className="text-[10px] text-slate-500">Orders</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900">{health.dataset_records.products || 70}</div>
              <div className="text-[10px] text-slate-500">Products</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900">{health.dataset_records.customers || 300}</div>
              <div className="text-[10px] text-slate-500">Customers</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900">{health.dataset_records.pincodes || 36}</div>
              <div className="text-[10px] text-slate-500">Pincodes</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <div className="font-bold text-slate-900">{health.dataset_records.kb_sections || 84}</div>
              <div className="text-[10px] text-slate-500">KB Sections</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <div className="font-bold text-emerald-700">{health.dataset_records.practice_questions || 52}</div>
              <div className="text-[10px] text-slate-500">Questions (100%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-4">
        {cards.map((item) => {
          const Icon = item.icon;
          const badge = getStatusBadge(item.status);
          const BadgeIcon = badge.icon;

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-xs text-slate-900">
                      {item.name}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.detail}
                </p>
              </div>

              {item.note && (
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <span>{item.note}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Environment Config Helper Box */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
          <Key className="w-4 h-4 text-blue-400" />
          <span>Configuring Optional Cloud Providers</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          The platform operates completely with zero external keys using the included deterministic policy engine, BM25 retriever, and mock tools.
          To activate cloud speech or LLMs, set the following in <code>backend/.env</code>:
        </p>
        <pre className="bg-slate-950 p-2.5 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto">
{`GNANI_API_KEY=your_gnani_token_here
GNANI_TOKEN=your_bearer_token
LLM_PROVIDER=gemini   # or openai, anthropic
LLM_API_KEY=your_llm_key_here`}
        </pre>
      </div>
    </div>
  );
}
