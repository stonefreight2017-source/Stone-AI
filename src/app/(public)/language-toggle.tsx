"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

export type LangCode = "en" | "zh" | "es" | "hi" | "fr" | "ar";

export interface Language {
  code: LangCode;
  label: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "zh", label: "Chinese", flag: "ZH" },
  { code: "es", label: "Spanish", flag: "ES" },
  { code: "hi", label: "Hindi", flag: "HI" },
  { code: "fr", label: "French", flag: "FR" },
  { code: "ar", label: "Arabic", flag: "AR" },
];

interface LanguageToggleProps {
  value: LangCode;
  onChange: (lang: LangCode) => void;
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.flag}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onChange(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                value === lang.code
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
              }`}
            >
              <span className="text-[10px] font-bold w-5 text-center">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
