"use client";

import { Cpu, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  allowedModes: string[];
}

export function ModeSelector({ allowedModes }: ModeSelectorProps) {
  const { selectedMode, setSelectedMode } = useAppStore();

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

  return (
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
            onClick={() => setSelectedMode(mode.key)}
            aria-label={`${mode.label} mode: ${mode.description}${!isAllowed ? " (upgrade required)" : ""}`}
            className={cn(
              "flex items-center gap-1.5 h-7 px-3 text-xs rounded-md transition-colors",
              isActive
                ? "bg-zinc-700 text-white"
                : isAllowed
                  ? "text-zinc-400 hover:text-zinc-200"
                  : "text-zinc-600 cursor-not-allowed"
            )}
          >
            <Icon className="h-3 w-3" />
            {mode.label}
          </Button>
        );
      })}
    </div>
  );
}
