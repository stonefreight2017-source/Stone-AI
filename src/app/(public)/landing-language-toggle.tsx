"use client";

import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-context";

export function LandingLanguageToggle() {
  const { lang, setLang } = useLanguage();
  return <LanguageToggle value={lang} onChange={setLang} />;
}
