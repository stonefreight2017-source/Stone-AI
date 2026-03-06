"use client";

import { useRouter } from "next/navigation";
import {
  Briefcase, PenLine, Code, TrendingUp,
} from "lucide-react";

const SUGGESTIONS = [
  {
    icon: Briefcase,
    label: "Plan a business",
    prompt: "Help me plan a new business from scratch. I have an idea and need help with validation, structure, and next steps.",
  },
  {
    icon: PenLine,
    label: "Write content",
    prompt: "I need help writing professional content. Let's start with what I need and who it's for.",
  },
  {
    icon: Code,
    label: "Build something",
    prompt: "I want to build a web application. Help me plan the architecture, tech stack, and development approach.",
  },
  {
    icon: TrendingUp,
    label: "Grow my brand",
    prompt: "Help me create a marketing strategy to grow my brand. Let's start with my current situation and goals.",
  },
];

export default function AppPage() {
  const router = useRouter();

  async function handleSuggestion(prompt: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: prompt.slice(0, 50) }),
    });
    const data = await res.json();
    if (data.conversation) {
      router.push(`/app/chat/${data.conversation.id}?prompt=${encodeURIComponent(prompt)}`);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-semibold text-zinc-100 mb-2">
            What can I help with?
          </h1>
          <p className="text-sm text-zinc-500">
            Choose a suggestion or start typing below.
          </p>
        </div>

        {/* Suggestion chips — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s.prompt)}
              className="flex items-start gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group"
            >
              <s.icon className="h-5 w-5 text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {s.label}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">
                  {s.prompt.slice(0, 80)}...
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
