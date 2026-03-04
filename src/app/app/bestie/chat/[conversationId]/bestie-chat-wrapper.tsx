"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BestieChat } from "@/components/bestie/BestieChat";
import { useRouter } from "next/navigation";

interface BestieChatWrapperProps {
  conversationId: string;
}

interface ConversationData {
  id: string;
  title: string;
  bestie: {
    id: string;
    name: string;
    avatarEmoji: string;
    personality: unknown;
  } | null;
}

export function BestieChatWrapper({ conversationId }: BestieChatWrapperProps) {
  const router = useRouter();

  const { data, isLoading, error } = useQuery<ConversationData>({
    queryKey: ["bestie-conversation", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const json = await res.json();
      return json.conversation;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
      </div>
    );
  }

  if (error || !data || !data.bestie) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
        <p>Conversation not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/app/bestie")}>
          Back to My Bestie
        </Button>
      </div>
    );
  }

  return (
    <BestieChat
      conversationId={conversationId}
      bestieName={data.bestie.name}
      bestieEmoji={data.bestie.avatarEmoji}
    />
  );
}
