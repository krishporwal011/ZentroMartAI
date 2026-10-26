"use client";

import React from "react";
import { SupportTicket } from "@/types";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
} from "lucide-react";

interface TicketHandoverCardProps {
  ticket: SupportTicket;
}

export function TicketHandoverCard({ ticket }: TicketHandoverCardProps) {
  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <LifeBuoy className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-amber-950">
                Escalated to Human Support
              </h3>
              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                #{ticket.ticket_id}
              </span>
            </div>
            <p className="text-xs text-amber-800/80">
              Assigned to Priority Customer Operations
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {ticket.status || "OPEN"}
        </span>
      </div>

      <div className="my-3 flex flex-col gap-2 text-xs">
        {ticket.order_id && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-amber-900">Associated Order:</span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 text-slate-800">
              #{ticket.order_id}
            </span>
          </div>
        )}

        {ticket.reason && (
          <div className="flex items-start gap-2">
            <span className="font-medium text-amber-900 shrink-0">Escalation Trigger:</span>
            <span className="text-amber-950 font-medium">{ticket.reason}</span>
          </div>
        )}

        <div className="mt-1 bg-white p-3 rounded-xl border border-amber-200/70 text-slate-800 leading-relaxed">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>Escalation Handover Summary</span>
          </div>
          <p className="text-xs text-slate-800 whitespace-pre-wrap">
            {ticket.summary}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800/80">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Created: {ticket.created_at || "2026-10-20"}
        </span>
        <span className="flex items-center gap-1 text-slate-600">
          <UserCheck className="w-3 h-3 text-emerald-600" />
          Estimated SLA: Within 4 business hours
        </span>
      </div>
    </div>
  );
}
