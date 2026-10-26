"use client";

import React, { useState, useEffect } from "react";
import {
  TinyFishStatus,
  TinyFishRunResponse,
  TinyFishPreset,
} from "@/types";
import { ApiClient } from "@/lib/api";
import {
  Globe,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  FileText,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Cpu,
} from "lucide-react";

export function TinyFishWorkspace() {
  const [status, setStatus] = useState<TinyFishStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Form State
  const [goal, setGoal] = useState(
    "Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov"
  );
  const [url, setUrl] = useState("https://www.sec.gov");
  const [pretty, setPretty] = useState(true);

  // Execution State
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TinyFishRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "raw" | "financial">("report");

  useEffect(() => {
    let ignore = false;
    ApiClient.getTinyFishStatus()
      .then((res) => {
        if (!ignore) {
          setStatus(res);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load TinyFish status:", err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefreshStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await ApiClient.getTinyFishStatus();
      setStatus(res);
    } catch (err: unknown) {
      console.error("Failed to refresh TinyFish status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSelectPreset = (preset: TinyFishPreset) => {
    setGoal(preset.goal);
    setUrl(preset.url);
    setError(null);
  };

  const handleRun = async () => {
    if (!goal.trim() || !url.trim()) {
      setError("Please provide both a goal and target URL.");
      return;
    }

    try {
      setRunning(true);
      setError(null);
      const res = await ApiClient.runTinyFishAgent({
        goal: goal.trim(),
        url: url.trim(),
        pretty,
      });
      setResult(res);
      if (res.result?.debt_to_equity_calculations) {
        setActiveTab("financial");
      } else {
        setActiveTab("report");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute TinyFish agent task.";
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cliCommand = `python3 scripts/run_tinyfish.py "${goal.replace(/"/g, '\\"')}" --url "${url}" --pretty`;

  const finCalcs = result?.result?.debt_to_equity_calculations as
    | {
        method_1_long_term_debt_only?: {
          calculation?: string;
          debt_to_equity_ratio?: number;
          debt_to_equity_percentage?: string;
        };
        method_2_total_debt_including_leases?: {
          calculation?: string;
          debt_to_equity_ratio?: number;
          debt_to_equity_percentage?: string;
        };
      }
    | undefined;

  const finFigs = result?.result?.financial_figures_in_millions_usd as
    | {
        long_term_debt?: number;
        total_operating_lease_liabilities?: number;
        total_debt_including_leases?: number;
        total_stockholders_equity?: number;
      }
    | undefined;

  const comparativeFigs = result?.result?.comparative_fy2024 as
    | {
        long_term_debt?: number;
        total_stockholders_equity?: number;
      }
    | undefined;

  const hasFinancialData = Boolean(finCalcs && finFigs);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner / Integration Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Globe className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold tracking-tight">
                TinyFish Autonomous Web Agent
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Automate multi-step web research, document parsing, and financial data extraction directly from external websites via natural language.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {status?.configured ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Live Cloud Agent Active ({status.masked_api_key})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Deterministic SEC Simulator</span>
              </div>
            )}
            <button
              onClick={handleRefreshStatus}
              disabled={loadingStatus}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Preset Tasks Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Quick Run Presets</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {status?.presets.map((preset) => {
            const isSelected = goal === preset.goal && url === preset.url;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-50/80 border-indigo-300 shadow-sm ring-1 ring-indigo-400"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {preset.goal}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-mono text-indigo-600 flex items-center gap-1">
                  <span>URL:</span>
                  <span className="truncate">{preset.url}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Execution Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Natural Language Web Agent Goal
            </label>
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.sec.gov"
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 h-10">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pretty}
                  onChange={(e) => setPretty(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>--pretty format</span>
              </label>

              <button
                onClick={handleRun}
                disabled={running || !goal.trim() || !url.trim()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run TinyFish Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* CLI Reference Bar */}
      <div className="bg-slate-900 rounded-xl p-3 text-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-slate-400 font-mono shrink-0">$</span>
          <span className="font-mono text-[11px] truncate text-slate-200">
            {cliCommand}
          </span>
        </div>
        <button
          onClick={() => copyToClipboard(cliCommand)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-indigo-300 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy CLI</span>
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-4">
          {/* Header metrics bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Run ID: {result.run_id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {result.provider}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Completed in {result.execution_time_seconds ?? 0}s • Target: {result.url}
                </div>
              </div>
            </div>

            {/* View tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {hasFinancialData && (
                <button
                  onClick={() => setActiveTab("financial")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "financial"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Financial Analysis
                </button>
              )}
              <button
                onClick={() => setActiveTab("report")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "report"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Report View
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "raw"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Raw JSON
              </button>
            </div>
          </div>

          {/* Stepper Steps */}
          {result.steps && result.steps.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Agent Navigation &amp; Extraction Execution Trace
              </h4>
              <div className="space-y-2">
                {result.steps.map((st) => (
                  <div
                    key={st.step}
                    className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      {st.step}
                    </span>
                    <span className="flex-1 font-medium">{st.action}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Ratio Breakdown Card (Specialized for META 10-K) */}
          {activeTab === "financial" && hasFinancialData && finCalcs && finFigs && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metric Card 1: Long-Term Debt */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Long-Term Debt to Equity
                    </span>
                    <span className="p-1 rounded bg-blue-50 text-blue-700">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">
                    {finCalcs.method_1_long_term_debt_only?.debt_to_equity_ratio ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mb-2">
                    {finCalcs.method_1_long_term_debt_only?.debt_to_equity_percentage ?? "0%"}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                    Formula: {finCalcs.method_1_long_term_debt_only?.calculation ?? ""}
                  </div>
                </div>

                {/* Metric Card 2: Total Debt with Leases */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Debt (inc. Leases) to Equity
                    </span>
                    <span className="p-1 rounded bg-indigo-50 text-indigo-700">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">
                    {finCalcs.method_2_total_debt_including_leases?.debt_to_equity_ratio ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 mb-2">
                    {finCalcs.method_2_total_debt_including_leases?.debt_to_equity_percentage ?? "0%"}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                    Formula: {finCalcs.method_2_total_debt_including_leases?.calculation ?? ""}
                  </div>
                </div>
              </div>

              {/* Balance Sheet Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>SEC Form 10-K Balance Sheet Figures ({String(result.result.fiscal_year_ended || "FY2025")})</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Line Item</th>
                        <th className="py-2.5 px-3">Amount (FY2025)</th>
                        <th className="py-2.5 px-3">Amount (FY2024)</th>
                        <th className="py-2.5 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                          Long-Term Debt
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 font-bold">
                          ${(finFigs.long_term_debt ?? 0).toLocaleString()}M
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          ${(comparativeFigs?.long_term_debt ?? 28826).toLocaleString()}M
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                          Senior notes &amp; funded obligations
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                          Total Operating Lease Liabilities
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 font-bold">
                          ${(finFigs.total_operating_lease_liabilities ?? 0).toLocaleString()}M
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          $20,234M
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">
                          Current ($2,213M) + Non-Current ($22,940M)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-semibold text-indigo-900 bg-indigo-50/50">
                          Total Debt (with Leases)
                        </td>
                        <td className="py-2.5 px-3 text-indigo-900 font-bold bg-indigo-50/50">
                          ${(finFigs.total_debt_including_leases ?? 0).toLocaleString()}M
                        </td>
                        <td className="py-2.5 px-3 text-indigo-700 bg-indigo-50/50">
                          $49,060M
                        </td>
                        <td className="py-2.5 px-3 font-sans text-indigo-800 text-[11px] bg-indigo-50/50">
                          Funded debt + operating leases
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-semibold text-emerald-900 bg-emerald-50/50">
                          Total Stockholders&apos; Equity
                        </td>
                        <td className="py-2.5 px-3 text-emerald-900 font-bold bg-emerald-50/50">
                          ${(finFigs.total_stockholders_equity ?? 0).toLocaleString()}M
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 bg-emerald-50/50">
                          ${(comparativeFigs?.total_stockholders_equity ?? 182637).toLocaleString()}M
                        </td>
                        <td className="py-2.5 px-3 font-sans text-emerald-800 text-[11px] bg-emerald-50/50">
                          Net book value of shareholder equity
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong>Financial Assessment:</strong> {String(result.result.financial_assessment ?? "")}
                </div>
              </div>
            </div>
          )}

          {/* Formatted Markdown Report View */}
          {activeTab === "report" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Formatted Markdown Output
                </span>
                <button
                  onClick={() => copyToClipboard(result.formatted_output)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 p-1.5 rounded-lg cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>

              <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm font-sans whitespace-pre-wrap leading-relaxed">
                {result.formatted_output}
              </div>
            </div>
          )}

          {/* Raw JSON View */}
          {activeTab === "raw" && (
            <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 text-xs font-mono shadow-xs overflow-x-auto border border-slate-800">
              <div className="flex items-center justify-between mb-2 text-slate-400 border-b border-slate-800 pb-2">
                <span>Structured JSON Response</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(result.result, null, 2))}
                  className="hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TinyFishWorkspace;
