"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface LandingTabsProps {
  tabs: Tab[];
  children: React.ReactNode[];
  className?: string;
}

export function LandingTabs({ tabs, children, className }: LandingTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className={className}>
      {/* Tab bar — sticky, scrollable on mobile */}
      <div className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  active === tab.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[50vh]">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={active === tab.id ? "animate-in fade-in duration-300" : "hidden"}
          >
            {children[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
