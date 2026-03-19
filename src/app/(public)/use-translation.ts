"use client";

import { useLanguage } from "./language-context";
import { t as translate } from "./translations";

export function useT() {
  const { lang } = useLanguage();
  return (key: string) => translate(lang, key);
}
