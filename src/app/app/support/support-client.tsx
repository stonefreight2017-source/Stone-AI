"use client";

import { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Zap,
  Bot,
  CreditCard,
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Send,
  CheckCircle,
  Loader2,
  Lightbulb,
  Rocket,
  Users,
  Key,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SupportClientProps {
  userTier: string;
  userEmail: string;
}

// ─── Getting Started Guides ───
const GETTING_STARTED = [
  {
    title: "Your first conversation",
    icon: MessageCircle,
    steps: [
      "Click \"New Chat\" in the sidebar to start a conversation.",
      "Type your question or request in the message box at the bottom.",
      "Press Enter or click Send — your AI response will appear in seconds.",
      "Your conversations are saved automatically. Find them in the sidebar anytime.",
    ],
  },
  {
    title: "Using AI Agents",
    icon: Bot,
    steps: [
      "Click \"AI Agents\" in the sidebar to browse all available agents.",
      "Each agent is a specialist — pick the one that matches your task (e.g., Copywriting, Web Dev, Marketing).",
      "Click an agent to start a new conversation with it. The agent already knows its specialty.",
      "The agent remembers your preferences across sessions, so it gets better the more you use it.",
      "Agents are available on Plus ($29.99/mo) and above.",
    ],
  },
  {
    title: "Understanding your plan",
    icon: CreditCard,
    steps: [
      "Go to \"Billing\" in the sidebar to see your current plan and usage.",
      "Free plan: Local AI chat with generous daily usage — no credit card needed.",
      "Starter ($9.99/mo): 4x faster speed, longer responses, extended context.",
      "Plus ($29.99/mo): 11 AI Expert Agents, 2 concurrent chats, conversation export.",
      "Smart ($69.99/mo): 26 agents, GPT-4o Smart mode, cloud fallback so it never goes down.",
      "Pro ($199/mo): All 30 agents, API access, priority speed, 10 concurrent chats.",
      "You can upgrade or downgrade anytime. No contracts.",
    ],
  },
  {
    title: "Managing API keys (Pro plan)",
    icon: Key,
    steps: [
      "Go to \"Settings\" in the sidebar.",
      "Scroll down to the API Keys section (Pro plan only).",
      "Click \"Create Key\" to generate a new API key.",
      "Copy and save your key immediately — it will only be shown once.",
      "Use the key in your own apps by sending requests to our API.",
      "You can revoke a key at any time if it's compromised.",
    ],
  },
];

// ─── How-To Guides ───
const HOW_TO_GUIDES = [
  {
    title: "How to plan a business with Stone AI™",
    icon: Rocket,
    content:
      "Start a chat with the Startup Launcher agent (Pro plan). Tell it your business idea, target market, and budget. The agent will help you create a business plan, identify your target audience, map out revenue models, and build a go-to-market strategy. You can iterate on each section until it's ready to present to investors or partners.",
  },
  {
    title: "How to create marketing content",
    icon: Lightbulb,
    content:
      "Use the Content Studio agent (Plus plan) for blog posts, social captions, and email campaigns. For ad copy, switch to the Copywriting agent. For social media strategy, use the Social Media Management agent. Each agent produces ready-to-use content — just describe your audience, tone, and goals.",
  },
  {
    title: "How to build a website with AI help",
    icon: Settings,
    content:
      "Chat with the Website Development agent (Smart plan). Describe the kind of website you need — landing page, e-commerce store, portfolio, etc. The agent will generate the code, suggest frameworks, and walk you through deployment. It supports React, Next.js, HTML/CSS, WordPress, and more.",
  },
  {
    title: "How to analyze data and create reports",
    icon: Zap,
    content:
      "Use the Data Analytics agent (Smart plan). Paste your data or describe what you want to analyze. The agent can write Python/SQL queries, create visualizations, interpret trends, and produce executive summaries. Great for sales reports, customer insights, and financial analysis.",
  },
  {
    title: "How to use multiple agents together",
    icon: Users,
    content:
      "For big projects, use agents in sequence. Example: Use the Lead Generation agent to find prospects, then the Copywriting agent to write outreach emails, then the Social Media agent to create supporting posts. Each agent's conversation is saved separately, so you can reference past work anytime.",
  },
];

// ─── FAQ ───
const FAQ_ITEMS = [
  {
    q: "Is my data private?",
    a: "Yes. On the Free and Starter plans, all your conversations are processed on a local GPU — your data never leaves the network. On Smart and Pro plans, when you use GPT-4o Smart mode, your message is sent to OpenAI's API for that specific response only. Local mode is always available as the default.",
  },
  {
    q: "How do I upgrade or downgrade my plan?",
    a: "Go to Billing in the sidebar and click \"Upgrade\" on the plan you want. To downgrade, click \"Manage Billing\" to open the Stripe portal where you can switch plans. Your current plan stays active until the end of the billing period.",
  },
  {
    q: "What happens if I hit my daily message limit?",
    a: "You'll see a message letting you know you've reached your daily allowance. Your usage resets at midnight UTC. Higher plans come with significantly more capacity — upgrade anytime from the Billing page.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no contracts or commitments. Go to Billing, click \"Manage Billing\", and cancel through the Stripe portal. You'll keep access to your paid features until the end of the billing period.",
  },
  {
    q: "What's the difference between Local and Smart mode?",
    a: "Local mode runs on our own GPU — it's extremely fast (under 100ms) and completely private. Smart mode sends your message to GPT-4o for the most advanced AI reasoning. Smart mode is available on Smart ($69.99) and Pro ($199) plans.",
  },
  {
    q: "How do AI Agents work?",
    a: "Each agent is a pre-configured AI specialist with built-in knowledge about its domain. When you start a conversation with an agent, it uses a custom prompt and a knowledge base to give you expert-level responses. Agents also remember your preferences across conversations, so they get more useful over time.",
  },
  {
    q: "What is the API and who is it for?",
    a: "The API lets developers build their own apps using Stone AI™ as the backend. It's available on the Pro plan ($199/mo). You get an API key from Settings and can send requests programmatically. This is for developers who want to integrate AI into their products.",
  },
  {
    q: "My response was cut off. Why?",
    a: "Each plan has a maximum response length. Free: 500 tokens, Starter: 2K, Plus: 3.9K, Smart: 7.8K, Pro: 32K tokens. If your response needs to be longer, try upgrading to a higher plan or asking the AI to continue where it left off.",
  },
  {
    q: "How do I export my conversations?",
    a: "Conversation export is available on Plus and above. Open the conversation you want to export and use the export option in the chat menu. This downloads your full conversation history.",
  },
  {
    q: "I forgot my password / can't log in",
    a: "Stone AI™ uses Clerk for authentication. Click \"Sign In\" and then \"Forgot Password\" to reset your password via email. If you signed up with Google or another social login, use that same method to sign in.",
  },
];

export function SupportClient({ userTier, userEmail }: SupportClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "question">("question");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);

  // Filter FAQ by search
  const filteredFaq = searchQuery.trim()
    ? FAQ_ITEMS.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQ_ITEMS;

  async function handleFeedbackSubmit() {
    if (!feedbackMessage.trim()) return;
    setFeedbackSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType.toUpperCase(),
          message: feedbackMessage.trim(),
        }),
      });
      if (res.ok) {
        setFeedbackSent(true);
        setFeedbackMessage("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send message");
      }
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-blue-400" />
          Help & Support
        </h1>
        <p className="text-zinc-400 text-sm">
          Everything you need to get the most out of Stone AI™. No live chat needed —
          find your answer below or send us a message.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help (e.g., 'upgrade plan', 'API key', 'agents')"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Getting Started", icon: Rocket, href: "#getting-started", color: "text-blue-400" },
          { label: "How-To Guides", icon: BookOpen, href: "#how-to", color: "text-purple-400" },
          { label: "FAQ", icon: HelpCircle, href: "#faq", color: "text-amber-400" },
          { label: "Send Feedback", icon: MessageCircle, href: "#feedback", color: "text-green-400" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors"
          >
            <link.icon className={`h-5 w-5 ${link.color}`} />
            <span className="text-sm font-medium text-zinc-300">{link.label}</span>
          </a>
        ))}
      </div>

      {/* Getting Started */}
      <section id="getting-started">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-blue-400" />
          Getting Started
        </h2>
        <div className="space-y-3">
          {GETTING_STARTED.map((guide, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between"
                onClick={() => setExpandedGuide(expandedGuide === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <guide.icon className="h-5 w-5 text-blue-400 shrink-0" />
                  <span className="font-medium text-white">{guide.title}</span>
                </div>
                {expandedGuide === i ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                )}
              </button>
              {expandedGuide === i && (
                <CardContent className="pt-0 pb-5 px-5">
                  <ol className="space-y-3 ml-8">
                    {guide.steps.map((step, j) => (
                      <li key={j} className="text-sm text-zinc-400 leading-relaxed flex gap-3">
                        <span className="text-blue-400 font-semibold shrink-0">{j + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* How-To Guides */}
      <section id="how-to">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-400" />
          How-To Guides
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {HOW_TO_GUIDES.map((guide, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-5 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <guide.icon className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-white text-sm">{guide.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{guide.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-400" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {filteredFaq.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center">
                <p className="text-zinc-500 text-sm">
                  No results found for "{searchQuery}". Try different keywords or{" "}
                  <a href="#feedback" className="text-blue-400 hover:underline">
                    send us a message
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFaq.map((item, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <button
                  className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-4"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <span className="font-medium text-white text-sm">{item.q}</span>
                  {expandedFaq === i ? (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                  )}
                </button>
                {expandedFaq === i && (
                  <CardContent className="pt-0 pb-4 px-5">
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Feedback / Contact */}
      <section id="feedback">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-400" />
          Send Us a Message
        </h2>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6 space-y-4">
            {feedbackSent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Message received!</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  We'll review your message and get back to you at {userEmail} if needed.
                </p>
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => setFeedbackSent(false)}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <>
                <p className="text-zinc-400 text-sm">
                  Have a question, found a bug, or want to suggest a feature? Let us know. We read
                  every message.
                </p>

                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">What is this about?</label>
                  <div className="flex gap-2">
                    {[
                      { key: "question" as const, label: "Question" },
                      { key: "bug" as const, label: "Bug Report" },
                      { key: "feature" as const, label: "Feature Request" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setFeedbackType(t.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          feedbackType === t.key
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Your message</label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your question, issue, or idea in plain language..."
                    rows={5}
                    maxLength={5000}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-zinc-600">
                      We'll respond to {userEmail}
                    </p>
                    <p className="text-xs text-zinc-600">{feedbackMessage.length}/5,000</p>
                  </div>
                </div>

                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackSending || !feedbackMessage.trim()}
                  className="bg-green-600 hover:bg-green-500"
                >
                  {feedbackSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Security footer */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-1">Your data is safe</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Stone AI™ processes your conversations on local hardware. On the Free and Starter plans,
                your data never touches third-party servers. We use bank-grade encryption (AES-256-GCM)
                and follow enterprise security practices from Cloudflare, Stripe, and Signal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
