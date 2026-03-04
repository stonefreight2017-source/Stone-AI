"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConversationListItem, MessageData } from "@/types";

interface ConversationDetail {
  conversation: ConversationListItem & { createdAt: string };
  messages: MessageData[];
}

export function useConversation(id: string) {
  return useQuery<ConversationDetail>({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!id,
  });
}
