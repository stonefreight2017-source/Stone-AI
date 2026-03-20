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
    router.push('/app/chat');
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();

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
  }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <div className="px-3">
        <Input
          aria-label="Search conversations"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm bg-zinc-800 border-zinc-700"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 space-y-0.5" role="list" aria-label="Conversations">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">
              {search ? "No matching chats" : "No conversations yet"}
            </p>
          ) : (
            filtered.map((convo) => (
              <div key={convo.id} role="listitem" className="flex items-center gap-0.5 pr-1">
                <button
                  onClick={() => handleSelect(convo.id)}
                  aria-label={`Open conversation: ${convo.title}`}
                  aria-current={activeChatId === convo.id ? "true" : undefined}
                  className={cn(
                    "flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                    activeChatId === convo.id
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 min-w-0">{convo.title}</span>
                </button>
                <button
                  type="button"
                  aria-label="Double-click to delete conversation"
                  title="Double-click to delete"
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md transition-colors cursor-pointer hover:bg-zinc-700"
                  onDoubleClick={(e) => handleDelete(e, convo.id)}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  disabled={deleteConversation.isPending}
                >
                  {deleteConversation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
