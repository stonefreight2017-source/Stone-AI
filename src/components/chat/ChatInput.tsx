"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, isLoading, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setValue("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [value, disabled, isLoading, onSend]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Auto-resize textarea
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  const hasContent = value.trim().length > 0;

  return (
    <div className="px-4 pb-2 pt-3">
      <div className="max-w-3xl mx-auto">
        {/* Pill-shaped input container — ChatGPT style */}
        <div className="relative flex items-end gap-2 rounded-3xl bg-zinc-800/80 border border-zinc-700/50 px-4 py-2.5 focus-within:border-zinc-600 transition-colors">
          <textarea
            ref={textareaRef}
            aria-label="Message input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Message Stone AI..."}
            disabled={disabled || isLoading}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 resize-none outline-none min-h-[24px] max-h-[200px] py-0.5 leading-relaxed"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={!hasContent || disabled || isLoading}
            aria-label={isLoading ? "Sending message" : "Send message"}
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-default bg-white text-black hover:bg-zinc-200"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
