"use client";

import React from "react";
import { ViewType } from "./Sidebar";
import {
  Menu,
  ShieldCheck,
  Calendar,
  Headphones,
} from "lucide-react";

interface HeaderProps {
  currentView: ViewType;
  onOpenMobile: () => void;
  onQuickAction?: (action: string) => void;
}

export function Header({ currentView, onOpenMobile, onQuickAction }: HeaderProps) {
  const getTitle = () => {
    switch (currentView) {
      case "chat":
        return "AI Customer Support Chat";
      case "orders":
        return "Order Tracking & Security Verification";
      case "tickets":
        return "Escalation & Support Tickets";
      case "knowledge":
        return "Knowledge Base & Precedence Rules";
      case "evaluation":
        return "Benchmark & Evaluation Harness";
      case "tinyfish":
        return "TinyFish Autonomous Web Agent (Cloud Automation)";
      case "settings":
        return "System Diagnostics & Provider Status";
      default:
        return "ZentroMart Customer Support";
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 md:hidden cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {getTitle()}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
              <Calendar className="w-3 h-3 text-blue-600" /> Fixed Reference: 20 Oct 2026
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero Fabricated Data</span>
        </div>

        <button
          onClick={() => onQuickAction && onQuickAction("talk_to_agent")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          <Headphones className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Priority Handover</span>
        </button>
      </div>
    </header>
  );
}
