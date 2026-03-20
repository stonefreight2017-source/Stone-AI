"use client";

import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CreditCard,
  HelpCircle,
  Settings,
  BarChart3,
  Crown,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    icon: MessageSquare,
    label: "Open Chat",
    href: "/app/chat",
    primary: true,
  },
  {
    icon: CreditCard,
    label: "Billing",
    href: "/app/billing",
    primary: false,
  },
  {
    icon: HelpCircle,
    label: "Support",
    href: "/app/support",
    primary: false,
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/app/settings",
    primary: false,
  },
];

export default function AppPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-zinc-100 mb-1">
            Welcome to Stone AI
          </h1>
          <p className="text-sm text-zinc-400">
            Your AI specialist workspace
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Plan */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <Crown className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Current Plan
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-md bg-zinc-700 px-2.5 py-0.5 text-sm font-medium text-zinc-200">
                Free
              </span>
              <button
                onClick={() => router.push("/app/billing")}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Manage Plan
              </button>
            </div>
          </div>

          {/* Usage */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Usage This Month
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-200">
              0 conversations
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={
                action.primary
                  ? "flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-left group"
                  : "flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group"
              }
            >
              <action.icon
                className={
                  action.primary
                    ? "h-5 w-5 text-amber-400 shrink-0"
                    : "h-5 w-5 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0"
                }
              />
              <span
                className={
                  action.primary
                    ? "text-sm font-medium text-amber-200"
                    : "text-sm font-medium text-zinc-300 group-hover:text-white transition-colors"
                }
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
