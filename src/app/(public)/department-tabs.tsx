"use client";

import { Wrench, Code, CreditCard, Settings, TrendingUp, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Category {
  title: string;
  description: string;
  icon: LucideIcon;
}

const categories: Category[] = [
  {
    title: "Troubleshooting",
    description:
      "Fix broken workflows, setup issues, failed integrations, and service problems faster.",
    icon: Wrench,
  },
  {
    title: "Development",
    description:
      "Get implementation help for APIs, routes, scripts, backend logic, and product fixes.",
    icon: Code,
  },
  {
    title: "Billing",
    description:
      "Handle plans, pricing, Stripe setup, renewals, payment issues, and customer billing questions.",
    icon: CreditCard,
  },
  {
    title: "Operations",
    description:
      "Get help with launch planning, usage limits, service design, support flow, and business systems.",
    icon: Settings,
  },
  {
    title: "Growth",
    description:
      "Use specialist support for scaling, strategy, marketing, and business growth decisions.",
    icon: TrendingUp,
  },
  {
    title: "Research",
    description:
      "Get structured help for analysis, comparison, competitive research, and planning.",
    icon: Search,
  },
];

export function DepartmentTabs() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <div
            key={category.title}
            className="rounded-xl bg-zinc-800/50 border border-zinc-700/30 p-5 hover:border-zinc-600/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-700/40 flex items-center justify-center">
                <Icon className="h-5 w-5 text-zinc-300" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {category.title}
              </h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {category.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
