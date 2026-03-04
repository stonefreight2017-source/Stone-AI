"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SalesWidgetProps {
  configSnapshot: string;
}

const SESSION_KEY = "stone-ai-sales-session";
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function getSession(): { sessionId: string; messages: Message[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(sessionId: string, messages: Message[]) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ sessionId, messages, ts: Date.now() })
  );
}

export function SalesWidget({ configSnapshot }: SalesWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [showDot, setShowDot] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userSentMessage = useRef(false);
  const hasLoggedRef = useRef(false);

  // Initialize session
  useEffect(() => {
    const existing = getSession();
    if (existing) {
      setSessionId(existing.sessionId);
      setMessages(existing.messages);
      if (existing.messages.some((m) => m.role === "user")) {
        userSentMessage.current = true;
      }
    } else {
      setSessionId(crypto.randomUUID());
    }
  }, []);

  // Proactive greeting after 8s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        const greeting: Message = {
          role: "assistant",
          content:
            "Hi there! I'm your Enterprise Advisor. I can help you configure the perfect plan, answer pricing questions, or walk you through our security and compliance capabilities. What are you looking to solve?",
        };
        setMessages([greeting]);
        saveSession(sessionId, [greeting]);
        if (!open) setShowDot(true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [sessionId, messages.length, open]);

  // Persist messages
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveSession(sessionId, messages);
    }
  }, [messages, sessionId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  // Abandonment detection
  useEffect(() => {
    function handleUnload() {
      if (!userSentMessage.current || hasLoggedRef.current) return;
      hasLoggedRef.current = true;
      const body = JSON.stringify({
        sessionId,
        outcome: "abandoned",
        messageCount: messages.filter((m) => m.role === "user").length,
        transcript: messages.slice(-20),
        configSnapshot,
      });
      navigator.sendBeacon("/api/enterprise/chat/log", body);
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [sessionId, messages, configSnapshot]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      userSentMessage.current = true;
      const userMsg: Message = { role: "user", content: text.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setStreaming(true);

      try {
        const res = await fetch("/api/enterprise/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updated.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            sessionId,
            configSnapshot,
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
            },
          ]);
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: assistantText,
            };
            return copy;
          });
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Connection lost. Please try again.",
          },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, sessionId, configSnapshot]
  );

  // Log submitted outcome (called externally via ref)
  const logSubmitted = useCallback(() => {
    if (!userSentMessage.current || hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    fetch("/api/enterprise/chat/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        outcome: "submitted",
        messageCount: messages.filter((m) => m.role === "user").length,
        transcript: messages.slice(-20),
        configSnapshot,
      }),
    }).catch(() => {});
  }, [sessionId, messages, configSnapshot]);

  // Expose logSubmitted via custom event
  useEffect(() => {
    function handler() {
      logSubmitted();
    }
    window.addEventListener("sales-widget-log-submitted", handler);
    return () => window.removeEventListener("sales-widget-log-submitted", handler);
  }, [logSubmitted]);

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] h-[520px] max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 flex flex-col bg-zinc-900 border border-zinc-700 rounded-xl max-sm:rounded-none shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Enterprise Advisor</p>
                <p className="text-xs text-emerald-400">Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" && msg.content === "" && streaming && (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-700 bg-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about enterprise plans..."
                disabled={streaming}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg px-3 py-2 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => {
          setOpen(!open);
          setShowDot(false);
        }}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {showDot && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
            )}
          </>
        )}
      </button>
    </>
  );
}
