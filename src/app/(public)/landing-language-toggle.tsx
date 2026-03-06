"use client";

import { LanguageToggle, type LangCode } from "./language-toggle";
import { useState, useEffect } from "react";

export function LandingLanguageToggle() {
  const [lang, setLang] = useState<LangCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem("stone_lang") as LangCode | null;
    if (saved) setLang(saved);
  }, []);

  const handleChange = (newLang: LangCode) => {
    setLang(newLang);
    localStorage.setItem("stone_lang", newLang);
    document.documentElement.lang = newLang;
  };

  return <LanguageToggle value={lang} onChange={handleChange} />;
}
