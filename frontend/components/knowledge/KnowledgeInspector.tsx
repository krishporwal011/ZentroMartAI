"use client";

import React, { useState, useEffect } from "react";
import { Citation } from "@/types";
import { ApiClient } from "@/lib/api";
import {
  BookOpen,
  Search,
  Filter,
  Loader2,
} from "lucide-react";

interface KnowledgeInspectorProps {
  initialQuery?: string;
  onSelectSection?: (sectionId: string) => void;
}

export function KnowledgeInspector({
  initialQuery = "return window electronics",
  onSelectSection,
}: KnowledgeInspectorProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledge = async (q: string) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.searchKnowledge(q, 6);
      setResults(res.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to search knowledge base.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (!initialQuery.trim()) return;

    ApiClient.searchKnowledge(initialQuery, 6)
      .then((res) => {
        if (!ignore) {
          setResults(res.results || []);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to search knowledge base.");
        }
      });

    return () => {
      ignore = true;
    };
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge(query);
  };

  const filteredResults = results.filter((r) => {
    if (selectedFilter === "policy") return r.source_file.startsWith("POL_");
    if (selectedFilter === "guide") return r.source_file.startsWith("agent_");
    if (selectedFilter === "help") return r.source_file.startsWith("help_");
    if (selectedFilter === "faq") return r.source_file.startsWith("faq_");
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Knowledge Base & Policy Precedence Inspector
            </h3>
            <p className="text-xs text-slate-500">
              Live index over 21 authoritative Markdown documents
            </p>
          </div>
        </div>

        {/* Precedence rule reminder badge */}
        <div className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Priority: Current Policy &gt; Agent Guide &gt; Help &gt; FAQ
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="my-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search policies, return windows, refund rules..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
        <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {[
          { id: "all", label: "All Docs" },
          { id: "policy", label: "Current Policies" },
          { id: "guide", label: "Agent Guides" },
          { id: "help", label: "Help Articles" },
          { id: "faq", label: "FAQs" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedFilter === f.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 mb-4">
          {error}
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        {filteredResults.length === 0 && !loading && (
          <div className="text-center py-8 text-xs text-slate-500">
            No policy documents found matching your search.
          </div>
        )}

        {filteredResults.map((r, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectSection?.(r.section_id)}
                  className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 hover:bg-blue-200 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                  title={`View section ${r.section_id}`}
                >
                  § {r.section_id}
                </button>
                <span className="text-xs font-semibold text-slate-800">
                  {r.doc_title}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                {r.source_file}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
              {r.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
