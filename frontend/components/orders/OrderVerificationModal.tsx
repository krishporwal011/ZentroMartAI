"use client";

import React, { useState } from "react";
import {
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import { OrderDetails } from "@/types";

interface OrderVerificationModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onVerificationSuccess: (orderData: OrderDetails) => void;
  onVerificationFailed: (message: string) => void;
}

export function OrderVerificationModal({
  orderId,
  isOpen,
  onClose,
  onVerificationSuccess,
  onVerificationFailed,
}: OrderVerificationModalProps) {
  const [method, setMethod] = useState<"phone" | "pincode">("phone");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();
    if (!cleanCode) return;

    if (method === "phone" && cleanCode.length !== 4) {
      setErrorMessage("Please enter exactly 4 digits of your registered phone number.");
      return;
    }
    if (method === "pincode" && cleanCode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit delivery pincode.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await ApiClient.lookupOrder(orderId, cleanCode);

      if (res.verified && res.order) {
        onVerificationSuccess(res.order);
        onClose();
      } else {
        const remaining = attemptsRemaining - 1;
        setAttemptsRemaining(remaining);
        if (remaining <= 0) {
          onVerificationFailed(
            "Verification attempts exceeded. Order details cannot be disclosed. Connecting you with a human support agent..."
          );
          onClose();
        } else {
          setErrorMessage(
            `Verification failed. Incorrect ${
              method === "phone" ? "phone digits" : "pincode"
            }. You have ${remaining} attempt remaining.`
          );
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to verify order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">
                Identity Verification Required
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Order #{orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            To safeguard your private order details, ZentroMart requires identity verification.
            Please choose one of the authorized verification methods below:
          </p>

          {/* Verification Method Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                setVerificationCode("");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                method === "phone"
                  ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone (Last 4 digits)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod("pincode");
                setVerificationCode("");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                method === "pincode"
                  ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivery Pincode</span>
            </button>
          </div>

          {/* Input field */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {method === "phone"
                ? "Last 4 Digits of Registered Phone"
                : "6-Digit Delivery Pincode"}
            </label>
            <input
              type="text"
              maxLength={method === "phone" ? 4 : 6}
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              placeholder={method === "phone" ? "e.g. 4821" : "e.g. 560103"}
              className="w-full font-mono text-sm tracking-wider px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {method === "phone"
                ? "Enter only the final 4 digits of your mobile number"
                : "Enter the exact 6-digit pincode of your delivery address"}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Attempts remaining pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Attempts remaining: <strong className="text-slate-800">{attemptsRemaining}</strong></span>
            <span className="text-slate-400">Fixed ref: 20 Oct 2026</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !verificationCode}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Verify & Disclose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
