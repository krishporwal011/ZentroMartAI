"use client";

import React, { useState } from "react";
import { Sidebar, ViewType } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { OrderLookupWorkspace } from "@/components/orders/OrderLookupWorkspace";
import { TicketHistoryWorkspace } from "@/components/tickets/TicketHistoryWorkspace";
import { KnowledgeInspector } from "@/components/knowledge/KnowledgeInspector";
import { EvaluationDashboard } from "@/components/dashboard/EvaluationDashboard";
import { IntegrationHealth } from "@/components/settings/IntegrationHealth";
import { TinyFishWorkspace } from "@/components/tinyfish/TinyFishWorkspace";
import {
  Sparkles,
  ShieldCheck,
  Mic,
  X,
  Languages,
} from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("chat");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLandingBanner, setShowLandingBanner] = useState(true);
  const [activeCitationSection, setActiveCitationSection] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      if (view && ["chat", "orders", "tickets", "knowledge", "evaluation", "settings", "tinyfish"].includes(view)) {
        setCurrentView(view as ViewType);
      }
    }
  }, []);

  const handleCitationClick = (sectionId: string) => {
    setActiveCitationSection(sectionId);
    setCurrentView("knowledge");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header
          currentView={currentView}
          onOpenMobile={() => setMobileMenuOpen(true)}
          onQuickAction={(action) => {
            if (action === "talk_to_agent") {
              setCurrentView("tickets");
            }
          }}
        />

        {/* View Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col">
          {/* Landing / Welcome Banner (on Chat view) */}
          {currentView === "chat" && showLandingBanner && (
            <div className="relative mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 overflow-hidden shrink-0">
              <button
                onClick={() => setShowLandingBanner(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Capstone 2026 Enterprise Edition</span>
                </div>

                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-1.5">
                  ZentroMart AI Customer Support Platform
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                  Enterprise-grade conversational support powered by hybrid RAG across 21 official policy documents,
                  strict identity verification gating, Monday–Saturday calendar math, and Gnani Indian vernacular voice AI.
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2-Factor Order Security Gate</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-blue-400" />
                    <span>Hindi, Hinglish & English</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <span>Gnani Speech Services (Prisma v2.5 / Timbre v2.5)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active View Container */}
          <div className="flex-1 flex flex-col min-h-0">
            {currentView === "chat" && (
              <ChatWorkspace onCitationClick={handleCitationClick} />
            )}

            {currentView === "orders" && <OrderLookupWorkspace />}

            {currentView === "tickets" && <TicketHistoryWorkspace />}

            {currentView === "knowledge" && (
              <KnowledgeInspector
                initialQuery={activeCitationSection || "return window electronics"}
              />
            )}

            {currentView === "evaluation" && <EvaluationDashboard />}

            {currentView === "tinyfish" && <TinyFishWorkspace />}

            {currentView === "settings" && <IntegrationHealth />}
          </div>
        </main>
      </div>
    </div>
  );
}
