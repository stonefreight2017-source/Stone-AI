"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations, useDeleteConversation } from "@/hooks/use-conversations";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function ConversationList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { data, isLoading } = useConversations();
  const deleteConversation = useDeleteConversation();
  const { activeChatId, setActiveChatId } = useAppStore();

  const conversations = data?.conversations ?? [];
  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  function handleSelect(id: string) {
    setActiveChatId(id);
    router.push(`/app/chat/${id}`);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();

    // First click sets pending, second click confirms
    if (pendingDeleteId === id) {
      setPendingDeleteId(null);
      deleteConversation.mutate(id, {
        onSuccess: () => {
          toast.success("Conversation deleted");
          if (activeChatId === id) {
            setActiveChatId(null);
            router.push("/app");
          }
        },
        onError: () => {
          toast.error("Failed to delete conversation");
        },
      });
    } else {
      setPendingDeleteId(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setPendingDeleteId((prev) => (prev === id ? null : prev)), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      <div className="px-3">
        <Input
          aria-label="Search conversations"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm bg-zinc-800 border-zinc-700"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 space-y-0.5" role="list" aria-label="Conversations">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">
              {search ? "No matching chats" : "No conversations yet"}
            </p>
          ) : (
            filtered.map((convo) => (
              <div key={convo.id} role="listitem">
                <button
                  onClick={() => handleSelect(convo.id)}
                  aria-label={`Open conversation: ${convo.title}`}
                  aria-current={activeChatId === convo.id ? "true" : undefined}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left group transition-colors",
                    activeChatId === convo.id
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{convo.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      pendingDeleteId === convo.id
                        ? "Click again to confirm delete"
                        : "Delete conversation"
                    }
                    className={cn(
                      "h-6 w-6 shrink-0",
                      pendingDeleteId === convo.id
                        ? "opacity-100 bg-red-900/50 hover:bg-red-800"
                        : "opacity-0 group-hover:opacity-100 hover:bg-zinc-600"
                    )}
                    onClick={(e) => handleDelete(e, convo.id)}
                    disabled={deleteConversation.isPending}
                  >
                    {deleteConversation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2
                        className={cn(
                          "h-3 w-3",
                          pendingDeleteId === convo.id
                            ? "text-red-400"
                            : "text-zinc-400"
                        )}
                      />
                    )}
                  </Button>
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
