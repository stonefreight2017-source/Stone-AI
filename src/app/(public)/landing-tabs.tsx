"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [direction, setDirection] = useState(0);
  const prevIndex = useRef(0);

  const activeIndex = tabs.findIndex((t) => t.id === active);

  function handleTabChange(tabId: string) {
    const newIndex = tabs.findIndex((t) => t.id === tabId);
    setDirection(newIndex > prevIndex.current ? 1 : -1);
    prevIndex.current = newIndex;
    setActive(tabId);
  }

  return (
    <div className={className}>
      {/* Tab bar — sticky, scrollable on mobile */}
      <div className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 z-10 transition-colors duration-200"
                style={{ color: active === tab.id ? "#fff" : "#71717a" }}
              >
                {active === tab.id && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className="absolute inset-0 bg-zinc-800 rounded-lg"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content with directional slide */}
      <div className="min-h-[50vh] overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children[activeIndex >= 0 ? activeIndex : 0]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
