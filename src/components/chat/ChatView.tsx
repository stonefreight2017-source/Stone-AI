"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Loader2, StopCircle, Zap, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatInput } from "./ChatInput";
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
  const { selectedMode, setTierError } = useAppStore();
  const { data: userData } = useUser();

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
      // Record final latency for this message
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

  // Capture first-token latency when streaming starts
  useEffect(() => {
    if (isStreaming && !firstTokenCaptured.current && sendTimeRef.current > 0) {
      firstTokenCaptured.current = true;
      // Find the last assistant message being streamed
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAssistant) {
        const firstTokenMs = Date.now() - sendTimeRef.current;
        setLatencyMap((prev) => ({ ...prev, [`${lastAssistant.id}-ttft`]: firstTokenMs }));
      }
    }
  }, [isStreaming, messages]);

  // Auto-scroll to bottom
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

  // Merge DB messages with streaming messages
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-sm font-medium text-zinc-300 truncate">
          {data.conversation.title}
        </h1>
        <div className="flex items-center gap-2">
          {userData?.user.canExport && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-white"
              onClick={() => {
                window.open(`/api/conversations/${conversationId}/export?format=json`, "_blank");
              }}
              aria-label="Export conversation"
              title="Export conversation"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          <ModeSelector allowedModes={userData?.user.allowedModes ?? ["LOCAL"]} />
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
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Send a message to start the conversation
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
                    <div className="shrink-0 h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                      S
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-200"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {msg.parts.map((p) => p.text).join("")}
                      </div>
                    </div>
                    {/* Speed badge for assistant messages */}
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
                    <div className="shrink-0 h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-blue-200">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isSubmitted && (
              <div className="flex gap-3 px-4 py-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
                <div className="bg-zinc-800 rounded-lg px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-zinc-500 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="h-2 w-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
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

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isBusy} isLoading={isBusy} />
    </div>
  );
}
