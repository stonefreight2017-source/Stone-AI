"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageData } from "@/types";

interface MessageBubbleProps {
  message: MessageData;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";

  return (
    <div
      className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "")}
    >
      {!isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <Bot className="h-4 w-4 text-zinc-300" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-200"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {message.mode && (
          <div
            className={cn(
              "mt-1.5 text-[10px] uppercase tracking-wider",
              isUser ? "text-blue-300" : "text-zinc-500"
            )}
          >
            {message.mode}
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center">
          <User className="h-4 w-4 text-blue-200" />
        </div>
      )}
    </div>
  );
}
