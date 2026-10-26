"use client";

import React, { useState } from "react";
import { SupportTicket } from "@/types";
import { ApiClient } from "@/lib/api";
import { TicketHandoverCard } from "./TicketHandoverCard";
import {
  PlusCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export function TicketHistoryWorkspace() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      ticket_id: "TKT-829103",
      order_id: "89782837",
      intent: "damaged_item",
      reason: "High-value damaged electronics (Kestrel Laptop > ₹10,000) reported with screen cracks.",
      summary: "Customer reports physical screen damage on Kestrel Book 14 (ELE-0022) delivered on 2026-10-18. Unit value ₹44,990 exceeds automated ceiling. Escalating to Priority Logistics.",
      created_at: "2026-10-20T11:42",
      status: "OPEN",
    },
    {
      ticket_id: "TKT-910244",
      order_id: "41029384",
      intent: "refund_status",
      reason: "Refund overdue by more than 3 business days past maximum timeline.",
      summary: "Refund reference REF-88190 initiated on 2026-10-10 has not credited after 7 business days. Exceeds standard UPI SLA of 2 business days. Escalating to Finance Operations.",
      created_at: "2026-10-20T14:15",
      status: "IN_REVIEW",
    },
  ]);

  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("Customer requested human agent");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.trim().length < 20) {
      setErrorMessage("Summary must be at least 20 characters as required by tools.py.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await ApiClient.createTicket(
        summary.trim(),
        orderId.trim() || undefined,
        "human_handover",
        reason
      );

      if (res.created && res.ticket_id) {
        const newTicket: SupportTicket = {
          ticket_id: res.ticket_id,
          order_id: orderId.trim() || undefined,
          intent: "human_handover",
          reason,
          summary: summary.trim(),
          created_at: new Date().toISOString().slice(0, 16),
          status: "OPEN",
        };
        setTickets([newTicket, ...tickets]);
        setSuccessMessage(`Ticket #${res.ticket_id} created successfully via tools.py!`);
        setSummary("");
        setOrderId("");
      } else {
        setErrorMessage(res.message || "Failed to create support ticket.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to communicate with ticket creation endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Creation form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Create Escalation Support Ticket
            </h3>
            <p className="text-xs text-slate-500">
              Dispatches directly to Priority Resolution Team via tools.py
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateTicket} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Associated Order ID (Optional)
              </label>
              <input
                type="text"
                maxLength={8}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 67830826"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Escalation Trigger
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="Customer explicitly asked for human agent">
                  Customer explicitly requested human agent
                </option>
                <option value="High-value damaged item (> ₹10,000)">
                  High-value damaged item (&gt; ₹10,000)
                </option>
                <option value="Product safety risk (battery swelling / burning smell)">
                  Product safety risk (battery swelling / sparks)
                </option>
                <option value="Suspected unauthorized account/payment activity">
                  Suspected unauthorized account/payment activity
                </option>
                <option value="Legal notice or consumer court mentioned">
                  Legal notice or consumer court complaint
                </option>
                <option value="Repeat contact (>= 2 prior contacts in 7 days)">
                  Repeat contact (&gt;= 2 prior contacts in 7 days)
                </option>
                <option value="Overdue refund (> 3 business days past SLA)">
                  Overdue refund (&gt; 3 business days past SLA)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Handover Summary (Min 20 characters required by tools.py)
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide complete non-sensitive context, verified facts, and actions attempted..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="text-right">
            <button
              type="submit"
              disabled={loading || summary.trim().length < 20}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Dispatch Support Ticket</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Tickets List */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 px-1">
          Active Escalated Tickets ({tickets.length})
        </h4>
        <div className="space-y-3">
          {tickets.map((t) => (
            <TicketHandoverCard key={t.ticket_id} ticket={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
