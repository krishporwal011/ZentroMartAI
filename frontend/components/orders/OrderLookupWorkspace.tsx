"use client";

import React, { useState } from "react";
import { OrderDetails } from "@/types";
import { ApiClient } from "@/lib/api";
import { OrderDetailsCard } from "./OrderDetailsCard";
import { OrderVerificationModal } from "./OrderVerificationModal";
import {
  Package,
  Lock,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";

export function OrderLookupWorkspace() {
  const [orderId, setOrderId] = useState("67830826");
  const [loading, setLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState<OrderDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      setLookupMessage(null);
      setVerifiedOrder(null);

      // Call lookup_order with no verification value
      const res = await ApiClient.lookupOrder(orderId.trim());

      if (res.verified && res.order) {
        setVerifiedOrder(res.order);
      } else {
        const msg = res.message || "Identity verification required to inspect order details.";
        setLookupMessage(msg);
        setIsVerificationOpen(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Order lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Verification Challenge Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Secure Order Lookup & Two-Factor Verification
            </h3>
            <p className="text-xs text-slate-500">
              Order information is never revealed prior to phone suffix or delivery pincode challenge
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              maxLength={8}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 8-digit Order ID (e.g., 67830826)"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || orderId.length !== 8}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Lookup Order</span>
          </button>
        </form>

        {/* Sample Orders quick test pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="text-[11px]">Demo Order IDs:</span>
          {["67830826", "89782837", "41029384", "99210384"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setOrderId(id)}
              className="font-mono text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              #{id}
            </button>
          ))}
        </div>

        {lookupMessage && !verifiedOrder && (
          <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs border border-blue-200 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{lookupMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Verified Order Card */}
      {verifiedOrder && (
        <OrderDetailsCard order={verifiedOrder} />
      )}

      {/* Verification Modal */}
      <OrderVerificationModal
        orderId={orderId}
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerificationSuccess={(ord) => {
          setVerifiedOrder(ord);
          setLookupMessage(null);
        }}
        onVerificationFailed={(msg) => {
          setErrorMessage(msg);
          setVerifiedOrder(null);
        }}
      />
    </div>
  );
}
