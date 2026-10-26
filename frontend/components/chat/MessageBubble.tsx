"use client";

import React, { useState } from "react";
import { ChatMessage } from "@/types";
import {
  Bot,
  User,
  Volume2,
  VolumeX,
  ShieldCheck,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench,
  Loader2,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

interface MessageBubbleProps {
  message: ChatMessage;
  onCitationClick?: (sectionId: string) => void;
}

export function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const handlePlayTTS = async () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      setTtsError(null);
      // Auto-detect language
      const isHindi = /[\u0900-\u097F]/.test(message.content);
      const lang = isHindi ? "hi" : "en";
      const blob = await ApiClient.synthesizeSpeech(message.content, lang);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlayingAudio(false);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setTtsError("Audio playback failed");
      };

      await audio.play();
      setIsPlayingAudio(true);
    } catch (err: unknown) {
      setTtsError(err instanceof Error ? err.message : "Voice synthesis unavailable");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div
      className={`flex gap-3 my-4 max-w-4xl ${
        isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-medium shadow-sm ${
          isAssistant
            ? "bg-slate-900 border border-slate-700"
            : "bg-blue-600"
        }`}
      >
        {isAssistant ? <Bot className="w-5 h-5 text-blue-400" /> : <User className="w-5 h-5" />}
      </div>

      {/* Bubble Content */}
      <div
        className={`flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%] ${
          isAssistant ? "items-start" : "items-end"
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
          <span className="font-medium text-slate-700">
            {isAssistant ? "ZentroMart Assistant" : "You"}
          </span>
          <span>•</span>
          <span>{message.timestamp}</span>
          {message.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Order
            </span>
          )}
          {message.ticket_id && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <LifeBuoy className="w-3 h-3 text-amber-600" />
              Ticket #{message.ticket_id}
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm transition-all ${
            isAssistant
              ? "bg-white text-slate-900 border border-slate-200"
              : "bg-blue-600 text-white"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Tools executed badge */}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-[11px] text-slate-500">Tools:</span>
              {message.tool_calls.map((tool, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}

          {/* Evidence / Citation Badges */}
          {message.evidence && message.evidence.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowEvidence(!showEvidence)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Policy Evidence ({message.evidence.length})</span>
                {showEvidence ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showEvidence && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {message.evidence.map((secId, i) => (
                    <button
                      key={i}
                      onClick={() => onCitationClick && onCitationClick(secId)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                      title="Inspect policy clause"
                    >
                      § {secId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TTS & Voice Controls */}
        {isAssistant && (
          <div className="flex items-center gap-2 mt-0.5 px-1">
            <button
              onClick={handlePlayTTS}
              disabled={isLoadingAudio}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Listen to audio response (Gnani TTS)"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
              ) : isPlayingAudio ? (
                <VolumeX className="w-3 h-3 text-blue-600" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
              <span>{isPlayingAudio ? "Stop Audio" : "Listen"}</span>
            </button>
            {ttsError && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {ttsError}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
