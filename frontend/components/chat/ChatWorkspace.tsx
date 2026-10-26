"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, OrderDetails, SupportTicket } from "@/types";
import { ApiClient } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";
import { QuickPrompts } from "./QuickPrompts";
import { VoiceRecorder } from "./VoiceRecorder";
import { OrderVerificationModal } from "../orders/OrderVerificationModal";
import { OrderDetailsCard } from "../orders/OrderDetailsCard";
import { TicketHandoverCard } from "../tickets/TicketHandoverCard";
import {
  Send,
  Mic,
  RotateCcw,
  Sparkles,
  Loader2,
  Languages,
} from "lucide-react";

interface ChatWorkspaceProps {
  onCitationClick?: (sectionId: string) => void;
}

export function ChatWorkspace({ onCitationClick }: ChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Verification modal state
  const [verificationOrderId, setVerificationOrderId] = useState<string | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  // Active verified order & ticket states
  const [verifiedOrder, setVerifiedOrder] = useState<OrderDetails | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize opening greeting
  useEffect(() => {
    const initSession = () => {
      const newCid = "conv_" + Math.random().toString(36).substring(2, 9);
      setConversationId(newCid);
      setMessages([
        {
          id: "msg_init",
          role: "assistant",
          content:
            "नमस्ते! I am the ZentroMart AI Customer Support Assistant. How may I assist you with your orders, returns, refunds, deliveries, or product queries today?",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    };
    initSession();
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await ApiClient.sendMessage(
        text,
        conversationId,
        selectedLanguage
      );

      const assistantMsg: ChatMessage = {
        id: "msg_" + (Date.now() + 1),
        role: "assistant",
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        intent: res.intent,
        decision: res.decision,
        evidence: res.evidence,
        tool_calls: res.tool_calls,
        verified: res.verified,
        order_id: res.order_id,
        ticket_id: res.ticket_id,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If response asks for verification or provides order ID that is unverified
      if (res.decision === "verify" && res.order_id) {
        setVerificationOrderId(res.order_id);
        setIsVerificationOpen(true);
      }

      // If an order was verified in this turn
      if (res.verified && res.order_id && !verifiedOrder) {
        // Fetch order details for card
        ApiClient.lookupOrder(res.order_id).then((ordRes) => {
          if (ordRes.order) setVerifiedOrder(ordRes.order);
        }).catch(() => {});
      }

      // If ticket was created
      if (res.ticket_id) {
        setActiveTicket({
          ticket_id: res.ticket_id,
          order_id: res.order_id,
          summary: res.response,
          reason: res.intent || "Human escalation request",
          created_at: "2026-10-20",
          status: "OPEN",
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_err_" + Date.now(),
          role: "assistant",
          content:
            "I encountered a connection issue while communicating with our support backend. Please retry or contact human customer support.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = async () => {
    if (conversationId) {
      await ApiClient.resetConversation(conversationId).catch(() => {});
    }
    const newCid = "conv_" + Math.random().toString(36).substring(2, 9);
    setConversationId(newCid);
    setVerifiedOrder(null);
    setActiveTicket(null);
    setMessages([
      {
        id: "msg_init_" + Date.now(),
        role: "assistant",
        content:
          "नमस्ते! I am the ZentroMart AI Customer Support Assistant. How may I assist you today?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Workspace Header */}
      <div className="bg-white px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-900">
                Customer Support Chat
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-500 font-mono">
                Session: {conversationId.slice(0, 10)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Grounded on official policies • Ref: 20 October 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs text-slate-600">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="hi-en">Hinglish</option>
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            title="Reset conversation state and verification tokens"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onCitationClick={onCitationClick}
          />
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3 my-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span>Verifying policies and knowledge...</span>
            </div>
          </div>
        )}

        {/* Verified Order Card (if an order is authenticated in this session) */}
        {verifiedOrder && (
          <div className="my-4">
            <OrderDetailsCard
              order={verifiedOrder}
              onAskAboutOrder={(prompt) => handleSendMessage(prompt)}
            />
          </div>
        )}

        {/* Active Escalated Ticket Banner */}
        {activeTicket && (
          <div className="my-4">
            <TicketHandoverCard ticket={activeTicket} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="bg-white p-4 border-t border-slate-200">
        {/* Quick Prompts (shown only when messages count is low) */}
        {messages.length <= 4 && (
          <QuickPrompts
            language={selectedLanguage}
            onSelectPrompt={(p) => handleSendMessage(p)}
          />
        )}

        {/* Voice Recorder Overlay / Tray */}
        {isVoiceOpen ? (
          <div className="mb-3">
            <VoiceRecorder
              onTranscriptReady={(transcript) => {
                setIsVoiceOpen(false);
                handleSendMessage(transcript);
              }}
              onCancel={() => setIsVoiceOpen(false)}
            />
          </div>
        ) : null}

        {/* Text Input Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoiceOpen(!isVoiceOpen)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isVoiceOpen
                ? "bg-red-50 border-red-300 text-red-600"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600"
            }`}
            title="Voice input via Gnani Speech API"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              selectedLanguage === "hi"
                ? "अपना प्रश्न यहाँ लिखें (उदा. मेरा रिफ़ंड कब आएगा)..."
                : "Type your query or order ID (e.g., Where is order 67830826?)..."
            }
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>Official ZentroMart Policies strictly enforced</span>
          <span>Zero fabricated answers • Verified tools</span>
        </div>
      </div>

      {/* Identity Verification Modal */}
      {verificationOrderId && (
        <OrderVerificationModal
          orderId={verificationOrderId}
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          onVerificationSuccess={(ord) => {
            setVerifiedOrder(ord);
            handleSendMessage(
              `I have verified my order ${verificationOrderId}. What is its current status?`
            );
          }}
          onVerificationFailed={() => {
            handleSendMessage(
              `Verification failed for order ${verificationOrderId}. Please transfer me to a human agent.`
            );
          }}
        />
      )}
    </div>
  );
}
