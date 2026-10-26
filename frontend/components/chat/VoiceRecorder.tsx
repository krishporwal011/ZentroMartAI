"use client";

import React, { useState, useRef } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Languages,
} from "lucide-react";
import { ApiClient } from "@/lib/api";

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onTranscriptReady, onCancel }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "recorded" | "transcribing" | "review"
  >("idle");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("hi-IN");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        audioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingState("recorded");
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setRecordSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: unknown) {
      const isNotAllowed = err instanceof Error && err.name === "NotAllowedError";
      setErrorMessage(
        isNotAllowed
          ? "Microphone access denied. Please enable microphone permissions in your browser."
          : "Unable to access microphone on this device."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
    }

    if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const submitForTranscription = async () => {
    if (!audioBlobRef.current) return;
    try {
      setRecordingState("transcribing");
      setErrorMessage(null);
      const res = await ApiClient.transcribeAudio(
        audioBlobRef.current,
        selectedLanguage
      );
      setTranscript(res.transcript || "");
      setRecordingState("review");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to transcribe audio.");
      setRecordingState("recorded");
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onTranscriptReady(transcript.trim());
    }
  };

  const resetAll = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setRecordingState("idle");
    setAudioUrl(null);
    setTranscript("");
    setIsPlayingAudio(false);
    setErrorMessage(null);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h4 className="font-semibold text-sm text-slate-800">
            Gnani Vernacular Voice Support
          </h4>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
          <Languages className="w-3.5 h-3.5 text-blue-600" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={recordingState === "recording"}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="en-IN">Indian English</option>
            <option value="hi-en">Hinglish</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* State: Idle */}
      {recordingState === "idle" && (
        <div className="flex flex-col items-center justify-center py-4">
          <button
            onClick={startRecording}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
            title="Start voice recording"
          >
            <Mic className="w-6 h-6" />
          </button>
          <p className="mt-2 text-xs text-slate-600">
            Click to record voice message in Hindi, Hinglish, or English
          </p>
        </div>
      )}

      {/* State: Recording */}
      {recordingState === "recording" && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-red-500/20 animate-ping absolute inset-0" />
            <button
              onClick={stopRecording}
              className="relative w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer"
              title="Stop recording"
            >
              <Square className="w-6 h-6 fill-white" />
            </button>
          </div>
          <div className="mt-3 font-mono text-sm font-semibold text-red-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Recording: 00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Speak clearly into your microphone... Click square to stop.
          </p>
        </div>
      )}

      {/* State: Recorded (Preview & Transcribe) */}
      {recordingState === "recorded" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
                title={isPlayingAudio ? "Pause preview" : "Play preview"}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <span className="text-xs text-slate-600 font-medium">
                Audio Preview ({recordSeconds}s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Discard audio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={submitForTranscription}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Transcribe Audio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State: Transcribing */}
      {recordingState === "transcribing" && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-xs font-medium text-slate-700">
            Transcribing via Gnani Prisma v2.5 STT...
          </p>
        </div>
      )}

      {/* State: Review & Edit Transcript */}
      {recordingState === "review" && (
        <div className="flex flex-col gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium text-slate-700">Transcribed Text</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditing ? "Done" : "Edit"}</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full text-sm text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                rows={3}
              />
            ) : (
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {transcript || (
                  <span className="text-slate-400 italic">No speech detected.</span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={resetAll}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Discard & Re-record
            </button>
            <button
              onClick={handleSend}
              disabled={!transcript.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Support</span>
            </button>
          </div>
        </div>
      )}

      {/* Cancel button */}
      <div className="mt-2 text-right">
        <button
          onClick={onCancel}
          className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer underline"
        >
          Close Voice Input
        </button>
      </div>
    </div>
  );
}
