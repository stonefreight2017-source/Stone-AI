"use client";

import { ChatView } from "@/components/chat/ChatView";

interface ChatViewWrapperProps {
  conversationId: string;
}

export function ChatViewWrapper({ conversationId }: ChatViewWrapperProps) {
  return <ChatView conversationId={conversationId} />;
}
