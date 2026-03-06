"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Loader2, StopCircle, Zap, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatInput } from "./ChatInput";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { MessageRenderer } from "./MessageRenderer";
import { useConversation } from "@/hooks/use-conversation";
import { useAppStore } from "@/store/app-store";
import { ModeSelector } from "./ModeSelector";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import type { ChatError } from "@/types";

interface ChatViewProps {
  conversationId: string;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { data, isLoading: isLoadingConversation, error: fetchError } =
    useConversation(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { selectedMode, setSelectedMode, setTierError } = useAppStore();
  const { data: userData } = useUser();
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      api: "/api/chat",
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
        if (parsed.code === "SMART_QUOTA_EXCEEDED") {
          setSelectedMode("LOCAL");
          toast.error(parsed.message || "Smart mode limit reached. Switched to Local mode.");
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
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
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

  const handleSend = useCallback(
    (text: string) => {
      sendTimeRef.current = Date.now();
      firstTokenCaptured.current = false;
      sendMessage({ text });
    },
    [sendMessage]
  );

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (isLoadingConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
        <p>Failed to load conversation</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["conversation", conversationId],
            })
          }
        >
          Try Again
        </Button>
      </div>
    );
  }

  type DisplayMessage = {
    id: string;
    role: string;
    parts: Array<{ type: "text"; text: string }>;
  };

  const allMessages: DisplayMessage[] =
    messages.length > 0
      ? messages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: m.parts
            ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => ({ type: "text" as const, text: p.text })) ?? [],
        }))
      : data.messages.map((m) => ({
          id: m.id,
          role: m.role.toLowerCase(),
          parts: [{ type: "text" as const, text: m.content }],
        }));

  return (
    <div className="flex flex-col h-full">
      {/* Header — clean, minimal like ChatGPT */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <ModeSelector allowedModes={userData?.user.allowedModes ?? ["LOCAL"]} />
          <span className="text-sm text-zinc-500 truncate max-w-[200px] hidden sm:inline">
            {data.conversation.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {userData?.user.canExport && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-white"
              onClick={() => {
                window.open(`/api/conversations/${conversationId}/export?format=json`, "_blank");
              }}
              aria-label="Export conversation"
              title="Export conversation"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {isBusy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={stop}
              aria-label="Stop generating"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages — flat layout like ChatGPT/Claude */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Send a message to start the conversation
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 space-y-1">
            {allMessages.map((msg) => {
              const ttft = latencyMap[`${msg.id}-ttft`];
              const totalLatency = latencyMap[msg.id];
              const messageText = msg.parts.map((p) => p.text).join("");

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "group px-4 py-4",
                    msg.role === "user" ? "bg-transparent" : "bg-transparent"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className={cn(
                      "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5",
                      msg.role === "user"
                        ? "bg-zinc-700 text-zinc-300"
                        : "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                    )}>
                      {msg.role === "user" ? "Y" : "S"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Role label */}
                      <p className="text-xs font-semibold text-zinc-400 mb-1.5">
                        {msg.role === "user" ? "You" : "Stone AI"}
                      </p>

                      {/* Message text */}
                      {msg.role === "user" ? (
                        <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                          {messageText}
                        </div>
                      ) : (
                        <MessageRenderer content={messageText} />
                      )}

                      {/* Actions + latency for assistant */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopy(messageText, msg.id)}
                            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <><Check className="h-3 w-3" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3" /> Copy</>
                            )}
                          </button>
                          {(ttft || totalLatency) && (
                            <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                              <Zap className="h-2.5 w-2.5" />
                              {ttft && <span>{formatLatency(ttft)}</span>}
                              {ttft && totalLatency && <span>/</span>}
                              {totalLatency && <span>{formatLatency(totalLatency)}</span>}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isSubmitted && (
              <div className="px-4 py-4">
                <div className="flex gap-4">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-semibold text-white mt-0.5">
                    S
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-zinc-400 mb-1.5">Stone AI</p>
                    <ThinkingIndicator />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error display */}
      {chatError && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 text-red-300 text-sm text-center">
          {chatError.message}
        </div>
      )}

      {/* Input area */}
      <ChatInput onSend={handleSend} disabled={isBusy} isLoading={isBusy} />

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-zinc-600 pb-2">
        Stone AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
