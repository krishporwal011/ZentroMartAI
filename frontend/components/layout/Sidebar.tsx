"use client";

import React from "react";
import {
  MessageSquare,
  Package,
  LifeBuoy,
  BookOpen,
  Activity,
  Settings,
  ShieldCheck,
  Globe,
} from "lucide-react";

export type ViewType =
  | "chat"
  | "orders"
  | "tickets"
  | "knowledge"
  | "evaluation"
  | "tinyfish"
  | "settings";

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: "chat" as ViewType,
      label: "Support Chat",
      icon: MessageSquare,
      badge: "AI Live",
    },
    {
      id: "orders" as ViewType,
      label: "Orders & Verification",
      icon: Package,
    },
    {
      id: "tickets" as ViewType,
      label: "Human Handover",
      icon: LifeBuoy,
    },
    {
      id: "knowledge" as ViewType,
      label: "Policy Precedence",
      icon: BookOpen,
      badge: "21 Docs",
    },
    {
      id: "evaluation" as ViewType,
      label: "Benchmark Dashboard",
      icon: Activity,
      badge: "100%",
    },
    {
      id: "tinyfish" as ViewType,
      label: "Web Agent (TinyFish)",
      icon: Globe,
      badge: "Autonomous",
    },
    {
      id: "settings" as ViewType,
      label: "System Diagnostics",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
        isOpenMobile ? "translate-x-0" : "-translate-x-full"
      } md:static md:w-64 shrink-0 border-r border-slate-800`}
    >
      <div>
        {/* Brand Logo & Title */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              Z
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight">
                ZentroMart
              </h1>
              <p className="text-[11px] text-blue-400 font-medium">
                AI Customer Support Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Gated</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          Strict two-factor verification for orders. Monday–Saturday calendar math.
        </p>
        <div className="pt-2 text-[10px] text-slate-400 font-mono">
          Dataset Ref: 2026-10-20
        </div>
      </div>
    </aside>
  );
}
