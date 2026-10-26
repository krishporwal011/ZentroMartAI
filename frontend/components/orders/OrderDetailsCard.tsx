"use client";

import React from "react";
import { OrderDetails } from "@/types";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
} from "lucide-react";

interface OrderDetailsCardProps {
  order: OrderDetails;
  onAskAboutOrder?: (prompt: string) => void;
}

export function OrderDetailsCard({ order, onAskAboutOrder }: OrderDetailsCardProps) {
  // Format status badge color
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "Delivered",
        };
      case "shipped":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Truck,
          label: "Shipped",
        };
      case "packed":
      case "placed":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
          label: status.toUpperCase(),
        };
      case "cancelled":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          icon: AlertCircle,
          label: "Cancelled",
        };
      case "return_requested":
      case "return_picked_up":
      case "return_in_transit":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: RotateCcw,
          label: status.replace(/_/g, " ").toUpperCase(),
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Package,
          label: status || "UNKNOWN",
        };
    }
  };

  const badge = getStatusBadge(order.status);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900">
              Order #{order.order_id}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Placed: {order.placed_at?.replace("T", " ")}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Authenticated
            </span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-slate-900">
            ₹{Number(order.total_inr || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500 uppercase font-mono">
            {order.payment_method}
          </div>
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 py-1">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Delivery Pincode</span>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-800">
            {order.delivery_pincode || "N/A"}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Promised Date</span>
          </div>
          <div className="text-xs font-medium text-slate-800">
            {order.promised_date || "N/A"}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Delivery Type</span>
          </div>
          <div className="text-xs font-medium text-slate-800 capitalize">
            {order.delivery_type || "Standard"}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Delivery Status</span>
          </div>
          <div className="text-xs font-medium text-slate-800">
            {order.delivered_on ? `Delivered on ${order.delivered_on}` : "In Progress"}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Order Items ({order.items?.length || 0})
        </h4>
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-white hover:bg-slate-50/50 flex items-center justify-between transition-colors text-xs"
            >
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  SKU: {item.sku} • Category: {item.category} • Qty: {item.quantity}
                </div>
              </div>
              <div className="text-right font-medium text-slate-800">
                ₹{Number(item.price_inr).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return & Refund Status (if applicable) */}
      {(order.return_status || order.refund_status) && (
        <div className="mb-4 bg-purple-50/50 border border-purple-200 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-purple-900 mb-1.5">
            <RotateCcw className="w-4 h-4 text-purple-700" />
            <span>Return & Refund Progress</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-purple-950">
            {order.return_status && (
              <div>
                <span className="text-slate-500">Return Status: </span>
                <span className="font-semibold">{order.return_status}</span>
                {order.return_pickup_on && ` (Picked up: ${order.return_pickup_on})`}
              </div>
            )}
            {order.return_qc_passed_on ? (
              <div>
                <span className="text-slate-500">QC Passed: </span>
                <span className="font-semibold text-emerald-700">Yes ({order.return_qc_passed_on})</span>
              </div>
            ) : (
              <div>
                <span className="text-slate-500">QC Status: </span>
                <span className="font-semibold text-amber-700">Pending Inspection</span>
              </div>
            )}
            {order.refund_amount_inr ? (
              <div>
                <span className="text-slate-500">Refund Amount: </span>
                <span className="font-semibold">₹{Number(order.refund_amount_inr).toLocaleString("en-IN")}</span>
              </div>
            ) : null}
            {order.refund_rrn && (
              <div>
                <span className="text-slate-500">Bank RRN: </span>
                <span className="font-mono">{order.refund_rrn}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentic Timeline Events */}
      {order.timeline && (
        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Verified Timeline</span>
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {order.timeline.split(";").map((event, i) => (
              <span
                key={i}
                className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[11px] font-mono border border-slate-200"
              >
                {event.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action buttons */}
      {onAskAboutOrder && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            onClick={() => onAskAboutOrder(`What is the refund status for order ${order.order_id}?`)}
            className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            Ask about Refund Status
          </button>
          <button
            onClick={() => onAskAboutOrder(`Is order ${order.order_id} eligible for return?`)}
            className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors cursor-pointer"
          >
            Check Return Eligibility
          </button>
        </div>
      )}
    </div>
  );
}
