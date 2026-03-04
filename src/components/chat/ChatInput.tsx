"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({ onSend, disabled, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setValue("");
    // Re-focus textarea after send
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [value, disabled, isLoading, onSend]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <Textarea
          ref={textareaRef}
          aria-label="Message input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled || isLoading}
          className="min-h-[44px] max-h-[200px] resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled || isLoading}
          size="icon"
          aria-label={isLoading ? "Sending message" : "Send message"}
          className="shrink-0 h-[44px] w-[44px] bg-blue-600 hover:bg-blue-500"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
