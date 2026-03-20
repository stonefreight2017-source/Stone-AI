"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeChatId = useAppStore((s) => s.activeChatId);

  // Use active chat ID from sidebar if available
  useEffect(() => {
    if (activeChatId && activeChatId !== conversationId) {
      setConversationId(activeChatId);
      setMessages([]);
    }
  }, [activeChatId, conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [input]);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;

    const res = await fetch("/api/conversations", { method: "POST" });
    if (!res.ok) throw new Error("Failed to create conversation");
    const data = await res.json();
    const id = data.conversation.id;
    setConversationId(id);
    useAppStore.getState().setActiveChatId(id);
    return id;
  }, [conversationId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    // Add user message immediately
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const convId = await ensureConversation();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: convId,
          mode: "LOCAL",
        }),
      });

      if (!res.ok) {
        let errorText = "Something went wrong. Please try again.";
        try {
          const errData = await res.json();
          if (errData.error) errorText = errData.error;
        } catch {
          // Response wasn't JSON
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorText },
        ]);
        setIsLoading(false);
        return;
      }

      // Read the streamed text response
      const reader = res.body?.getReader();
      if (!reader) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "No response received." },
        ]);
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message that we'll stream into
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Update the last message (assistant) with accumulated content
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return updated;
        });
      }

      // If we got an empty response
      if (!assistantContent.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "No reply received. Please try again.",
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center">
                <p className="text-lg font-medium text-zinc-400">
                  Ask your question and Stone will route it to the right
                  specialist.
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  Type a message below to get started.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-zinc-700 text-zinc-100 rounded-br-md"
                    : "bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-md"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex items-center gap-2 text-zinc-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking...
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator when waiting but before stream starts */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-zinc-800 border border-zinc-700">
                <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar — sticky bottom */}
      <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-11 w-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 flex items-center justify-center transition-colors"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
        <p className="max-w-3xl mx-auto text-[11px] text-zinc-500 mt-2 text-center">
          Shift + Enter for new line. Stone routes your request to the right
          specialist.
        </p>
      </div>
    </div>
  );
}
