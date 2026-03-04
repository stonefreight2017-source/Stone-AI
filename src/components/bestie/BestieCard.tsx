"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

interface BestieCardProps {
  bestie: {
    id: string;
    name: string;
    avatarEmoji: string;
    personality: {
      traits: string[];
      style: string;
      expertise: string[];
    };
    conversationCount: number;
  };
  onDelete?: () => void;
}

const STYLE_LABELS: Record<string, string> = {
  casual: "BFF Vibes",
  supportive: "Life Coach",
  intellectual: "Mentor",
  hype: "Hype Squad",
};

export function BestieCard({ bestie, onDelete }: BestieCardProps) {
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleChat() {
    setIsCreatingChat(true);
    try {
      const res = await fetch(`/api/bestie/${bestie.id}/conversations`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.conversation) {
        router.push(`/app/bestie/chat/${data.conversation.id}`);
      } else {
        toast.error("Could not start chat");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsCreatingChat(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to remove ${bestie.name}? Their conversations will be archived.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/bestie?id=${bestie.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${bestie.name} has been removed`);
        onDelete?.();
      } else {
        toast.error("Could not remove bestie");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-pink-800/50 transition-colors">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
              {bestie.avatarEmoji}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{bestie.name}</h3>
              <p className="text-xs text-pink-400">
                {STYLE_LABELS[bestie.personality.style] ?? bestie.personality.style}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-pink-400"
              onClick={() => router.push(`/app/bestie/edit/${bestie.id}`)}
              aria-label="Edit bestie"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:text-red-400"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete bestie"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Trait chips */}
        <div className="flex flex-wrap gap-1.5">
          {bestie.personality.traits.map((trait) => (
            <Badge
              key={trait}
              variant="outline"
              className="text-[10px] border-pink-800/50 text-pink-300 bg-pink-900/10"
            >
              {trait}
            </Badge>
          ))}
          {bestie.personality.expertise.map((exp) => (
            <Badge
              key={exp}
              variant="outline"
              className="text-[10px] border-purple-800/50 text-purple-300 bg-purple-900/10"
            >
              {exp}
            </Badge>
          ))}
        </div>

        {/* Stats + Chat */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {bestie.conversationCount} conversation{bestie.conversationCount !== 1 ? "s" : ""}
          </span>
          <Button
            onClick={handleChat}
            disabled={isCreatingChat}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
            size="sm"
          >
            {isCreatingChat ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-1" />
            )}
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
