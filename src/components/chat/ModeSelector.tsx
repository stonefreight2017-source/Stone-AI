"use client";

import { useState, useEffect, useCallback } from "react";
import { Cpu, Cloud, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  allowedModes: string[];
}

interface SmartUsage {
  smartToday: number;
  smartDailyLimit: number;
  smartCostMultiplier: number;
}

export function ModeSelector({ allowedModes }: ModeSelectorProps) {
  const { selectedMode, setSelectedMode } = useAppStore();
  const [showWarning, setShowWarning] = useState(false);
  const [smartUsage, setSmartUsage] = useState<SmartUsage | null>(null);

  // Fetch SMART usage when component mounts and mode is available
  const fetchSmartUsage = useCallback(async () => {
    if (!allowedModes.includes("SMART")) return;
    try {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setSmartUsage({
          smartToday: data.usage?.smartToday ?? 0,
          smartDailyLimit: data.usage?.smartDailyLimit ?? 0,
          smartCostMultiplier: data.usage?.smartCostMultiplier ?? 3,
        });
      }
    } catch {
      // Best effort
    }
  }, [allowedModes]);

  useEffect(() => {
    fetchSmartUsage();
  }, [fetchSmartUsage]);

  function handleModeClick(modeKey: "LOCAL" | "SMART") {
    if (modeKey === "SMART" && selectedMode !== "SMART") {
      // Show warning before switching to SMART
      setShowWarning(true);
      fetchSmartUsage(); // Refresh count
      return;
    }
    setSelectedMode(modeKey);
  }

  function confirmSmart() {
    setShowWarning(false);
    setSelectedMode("SMART");
  }

  const modes = [
    {
      key: "LOCAL" as const,
      label: "Local",
      icon: Cpu,
      description: "Fast, private, on-device",
    },
    {
      key: "SMART" as const,
      label: "Smart",
      icon: Cloud,
      description: "GPT-4o cloud model",
    },
  ];

  const smartAllowed = allowedModes.includes("SMART");
  const usagePercent = smartUsage && smartUsage.smartDailyLimit > 0
    ? Math.round((smartUsage.smartToday / smartUsage.smartDailyLimit) * 100)
    : 0;

  return (
    <div className="relative">
      <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg">
        {modes.map((mode) => {
          const isAllowed = allowedModes.includes(mode.key);
          const isActive = selectedMode === mode.key;
          const Icon = mode.icon;

          return (
            <Button
              key={mode.key}
              variant="ghost"
              size="sm"
              disabled={!isAllowed}
              onClick={() => handleModeClick(mode.key)}
              aria-label={`${mode.label} mode: ${mode.description}${!isAllowed ? " (upgrade required)" : ""}`}
              className={cn(
                "flex items-center gap-1.5 h-7 px-3 text-xs rounded-md transition-all",
                isActive
                  ? mode.key === "SMART"
                    ? "bg-purple-700/50 text-purple-200 ring-1 ring-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                    : "bg-emerald-700/40 text-emerald-200 ring-1 ring-emerald-500/30"
                  : isAllowed
                    ? "text-zinc-400 hover:text-zinc-200"
                    : "text-zinc-600 cursor-not-allowed"
              )}
            >
              <Icon className="h-3 w-3" />
              {mode.label}
              {/* Show SMART usage counter when active */}
              {mode.key === "SMART" && isActive && smartUsage && smartUsage.smartDailyLimit > 0 && (
                <span className={cn(
                  "ml-1 text-[9px] font-mono",
                  usagePercent >= 80 ? "text-red-400" : usagePercent >= 50 ? "text-amber-400" : "text-zinc-400"
                )}>
                  {smartUsage.smartToday}/{smartUsage.smartDailyLimit}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* SMART usage bar when Smart mode is active */}
      {selectedMode === "SMART" && smartUsage && smartUsage.smartDailyLimit > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 rounded-md p-1.5 z-10 shadow-lg border border-zinc-700">
          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-purple-400 font-medium">Smart mode messages today</span>
            <span className={cn(
              "font-mono",
              usagePercent >= 80 ? "text-red-400" : "text-zinc-400"
            )}>
              {smartUsage.smartToday} / {smartUsage.smartDailyLimit}
            </span>
          </div>
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                usagePercent >= 80 ? "bg-red-500" : usagePercent >= 50 ? "bg-amber-500" : "bg-purple-500"
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-[8px] text-zinc-500 mt-1">
            Each Smart message counts as {smartUsage.smartCostMultiplier}x toward daily limit
          </p>
        </div>
      )}

      {/* Warning dialog when switching to SMART */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-amber-700/50 rounded-xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Switch to Smart Mode?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Smart mode uses cloud AI (GPT-4o) which costs significantly more.
                </p>
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="text-zinc-500 hover:text-white ml-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Each Smart message costs <strong>3x</strong> your daily quota</span>
              </div>
              {smartUsage && smartUsage.smartDailyLimit > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>
                    Daily limit: <strong>{smartUsage.smartDailyLimit}</strong> Smart messages
                    {smartUsage.smartToday > 0 && (
                      <> ({smartUsage.smartDailyLimit - smartUsage.smartToday} remaining)</>
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Your daily messages will deplete <strong>3x faster</strong></span>
              </div>
            </div>

            {smartAllowed && (
              <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-emerald-400 font-medium mb-1">Better option:</p>
                <p className="text-xs text-zinc-400">
                  Local mode is <strong className="text-white">sub-100ms fast</strong>, completely private,
                  and doesn&apos;t count extra against your quota. Use Smart only when you truly need
                  GPT-4o&apos;s capabilities.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-zinc-700 text-zinc-300"
                onClick={() => setShowWarning(false)}
              >
                Stay on Local
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={confirmSmart}
              >
                Use Smart Mode
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
