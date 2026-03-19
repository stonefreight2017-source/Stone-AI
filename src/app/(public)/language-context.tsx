"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { LangCode } from "./language-toggle";

const STORAGE_KEY = "stone_lang";

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (saved) {
        setLangState(saved);
        document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    } catch {
      // localStorage not available
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
