"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Loader2, StopCircle, Zap, Brain } from "lucide-react";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import type { ChatError } from "@/types";

interface BestieChatProps {
  conversationId: string;
  bestieName: string;
  bestieEmoji: string;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function BestieChat({ conversationId, bestieName, bestieEmoji }: BestieChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { selectedMode, setTierError } = useAppStore();
  const { data: userData } = useUser();

  // Input state
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Latency tracking
  const sendTimeRef = useRef<number>(0);
  const [latencyMap, setLatencyMap] = useState<Record<string, number>>({});
  const firstTokenCaptured = useRef(false);

  const {
    messages,
    sendMessage,
    status,
    stop,
    error: chatError,
  } = useChat({
    id: conversationId,
    transport: new TextStreamChatTransport({
      api: "/api/bestie/chat",
      body: {
        conversationId,
        mode: selectedMode,
      },
    }),
    onError: (error) => {
      try {
        const parsed = JSON.parse(error.message) as ChatError;
        if (parsed.code === "TIER_MISMATCH" || parsed.code === "QUOTA_EXCEEDED") {
          setTierError(parsed);
          return;
        }
        if (parsed.code === "RATE_LIMITED") {
          toast.error("Slow down — too many requests. Try again in a moment.");
          return;
        }
      } catch {
        // Not a structured error
      }
      toast.error("Failed to send message. Please try again.");
    },
    onFinish: ({ message }) => {
      if (sendTimeRef.current > 0) {
        const totalMs = Date.now() - sendTimeRef.current;
        setLatencyMap((prev) => ({ ...prev, [message.id]: totalMs }));
        sendTimeRef.current = 0;
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";
  const isBusy = isStreaming || isSubmitted;

  // Capture first-token latency
  useEffect(() => {
    if (isStreaming && !firstTokenCaptured.current && sendTimeRef.current > 0) {
      firstTokenCaptured.current = true;
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        const firstTokenMs = Date.now() - sendTimeRef.current;
        setLatencyMap((prev) => ({ ...prev, [`${lastAssistant.id}-ttft`]: firstTokenMs }));
      }
    }
  }, [isStreaming, messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isBusy) return;
    sendTimeRef.current = Date.now();
    firstTokenCaptured.current = false;
    sendMessage({ text });
    setInputValue("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [inputValue, isBusy, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  type DisplayMessage = {
    id: string;
    role: string;
    parts: Array<{ type: "text"; text: string }>;
  };

  const allMessages: DisplayMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts:
      m.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => ({ type: "text" as const, text: p.text })) ?? [],
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pink-900/30 bg-gradient-to-r from-pink-950/20 to-purple-950/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-xl">
            {bestieEmoji}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">{bestieName}</h1>
            <p className="text-[10px] text-pink-400/70">Your AI Bestie</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-purple-400/60">
              <Brain className="h-3 w-3" />
              <span>Remembers you</span>
            </div>
          )}
          {isBusy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-white"
              onClick={stop}
              aria-label="Stop generating"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="text-5xl">{bestieEmoji}</div>
            <p className="text-zinc-400 text-sm max-w-md">
              Say hi to <span className="text-pink-400 font-medium">{bestieName}</span>! They&apos;re excited to chat with you.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {allMessages.map((msg) => {
              const ttft = latencyMap[`${msg.id}-ttft`];
              const totalLatency = latencyMap[msg.id];

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 px-4 py-3",
                    msg.role === "user" ? "justify-end" : ""
                  )}
                >
                  {msg.role !== "user" && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-sm">
                      {bestieEmoji}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-pink-600 text-white"
                          : "bg-zinc-800 text-zinc-200"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {msg.parts.map((p) => p.text).join("")}
                      </div>
                    </div>
                    {msg.role === "assistant" && (ttft || totalLatency) && (
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Zap className="h-2.5 w-2.5" />
                        {ttft && <span>First token: {formatLatency(ttft)}</span>}
                        {ttft && totalLatency && <span className="text-zinc-700">|</span>}
                        {totalLatency && <span>Total: {formatLatency(totalLatency)}</span>}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 h-8 w-8 rounded-full bg-pink-700 flex items-center justify-center text-xs font-bold text-pink-200">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking indicator with escalating bestie emojis */}
            {isSubmitted && (
              <div className="flex gap-3 px-4 py-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-sm">
                  {bestieEmoji}
                </div>
                <ThinkingIndicator variant="bestie" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {chatError && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-red-300 text-sm text-center">
          {chatError.message}
        </div>
      )}

      {/* Warm-themed input */}
      <div className="border-t border-pink-900/30 p-4 bg-gradient-to-r from-pink-950/10 to-purple-950/10">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            aria-label="Message input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Tell ${bestieName} anything...`}
            disabled={isBusy}
            className="min-h-[44px] max-h-[200px] resize-none bg-zinc-800 border-pink-800/30 text-white placeholder:text-pink-300/30 focus:border-pink-500"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isBusy}
            size="icon"
            aria-label={isBusy ? "Sending message" : "Send message"}
            className="shrink-0 h-[44px] w-[44px] bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="text-lg">\u2764\uFE0F</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
