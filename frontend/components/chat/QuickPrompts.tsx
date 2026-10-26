"use client";

import React from "react";
import {
  Package,
  RotateCcw,
  Clock,
  AlertTriangle,
  Headphones,
  Tag,
  Shield,
} from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  language: string;
}

export function QuickPrompts({ onSelectPrompt, language }: QuickPromptsProps) {
  const prompts = [
    {
      label: language === "hi" ? "ऑर्डर ट्रैक करें" : "Track My Order",
      query: language === "hi" ? "मेरा ऑर्डर कहाँ है?" : "Where is my order?",
      icon: Package,
    },
    {
      label: language === "hi" ? "रिफ़ंड की स्थिति" : "Refund Status",
      query: language === "hi" ? "मेरा रिफ़ंड कब तक मिलेगा?" : "What is the status of my refund?",
      icon: Clock,
    },
    {
      label: language === "hi" ? "रिटर्न पात्रता" : "Check Return Eligibility",
      query: language === "hi" ? "क्या मैं अपना सामान वापस कर सकता हूँ?" : "Can I return my item?",
      icon: RotateCcw,
    },
    {
      label: language === "hi" ? "क्षतिग्रस्त सामान" : "Report Damaged Item",
      query: language === "hi" ? "मुझे टूटा हुआ सामान मिला है" : "I received a damaged product",
      icon: AlertTriangle,
    },
    {
      label: language === "hi" ? "वारंटी की जानकारी" : "Warranty Claim",
      query: language === "hi" ? "वारंटी कैसे क्लेम करें?" : "How do I claim warranty on my product?",
      icon: Shield,
    },
    {
      label: language === "hi" ? "ऑफ़र और कूपन" : "Coupons & Offers",
      query: language === "hi" ? "क्या कोई एक्टिव कूपन कोड है?" : "What coupons are active right now?",
      icon: Tag,
    },
    {
      label: language === "hi" ? "मानव एजेंट" : "Human Agent",
      query: language === "hi" ? "मुझे कस्टमर केयर एजेंट से बात करनी है" : "I want to speak with a human support agent",
      icon: Headphones,
    },
  ];

  return (
    <div className="py-2">
      <p className="text-xs font-medium text-slate-500 mb-2 px-1">
        {language === "hi" ? "सुझाए गए प्रश्न:" : "Suggested Questions:"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p.query)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 px-2.5 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
