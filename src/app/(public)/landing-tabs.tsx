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
  prefix?: string;
}

export function LandingTabs({ tabs, children, className, prefix = "landing" }: LandingTabsProps) {
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

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      const currentIndex = tabs.findIndex((t) => t.id === active);
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextTab = tabs[nextIndex];
      handleTabChange(nextTab.id);
      const nextButton = document.getElementById(`${prefix}-tab-${nextTab.id}`);
      nextButton?.focus();
  }

  return (
    <div className={className}>
      {/* Tab bar — sticky, scrollable on mobile */}
      <div className="sticky top-0 z-30 bg-zinc-900 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative flex overflow-x-auto scrollbar-hide gap-1 py-2" role="tablist" aria-label="Product features">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`${prefix}-tab-${tab.id}`}
                role="tab"
                aria-selected={active === tab.id}
                aria-controls={`${prefix}-panel-${tab.id}`}
                tabIndex={active === tab.id ? 0 : -1}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={handleTabKeyDown}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200"
                style={{
                  color: active === tab.id ? "#fff" : "#d4d4d8",
                  backgroundColor: active === tab.id ? "#27272a" : "transparent",
                }}
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
            role="tabpanel"
            id={`${prefix}-panel-${active}`}
            aria-labelledby={`${prefix}-tab-${active}`}
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
