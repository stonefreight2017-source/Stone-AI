"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("stone_cookie_consent");
    if (!consent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAcceptAll() {
    localStorage.setItem("stone_cookie_consent", "all");
    setVisible(false);
  }

  function handleEssentialOnly() {
    localStorage.setItem("stone_cookie_consent", "essential");
    localStorage.setItem("stone_ccpa_optout", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div role="alertdialog" aria-label="Cookie consent" aria-describedby="cookie-desc" className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-900 border-t border-zinc-700 shadow-2xl">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-zinc-300">
          <p id="cookie-desc">
            We use cookies for authentication, preferences, and analytics.
            See our{" "}
            <Link href="/cookies" className="text-emerald-400 underline">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-emerald-400 underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEssentialOnly}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm text-black bg-white hover:bg-zinc-200 rounded-lg font-medium transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
