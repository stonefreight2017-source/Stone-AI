"use client";

import { useRouter, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Plus, Settings, CreditCard, PanelLeftClose, HelpCircle, Bell, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConversationList } from "./ConversationList";
import { TierBadge } from "@/components/billing/TierBadge";
// Ad component removed — ads disabled
// import { TierGatedAd } from "@/components/ads/TierGatedAd";
import { GoldenEggDot } from "@/components/badges/UserBadges";
import { useCreateConversation } from "@/hooks/use-conversations";
import { useAppStore } from "@/store/app-store";
import { useQuery } from "@tanstack/react-query";
import { Insignia } from "@/components/brand/Insignia";

interface SidebarProps {
  userTier: string;
  userBadges?: string[];
}

export function Sidebar({ userTier, userBadges = [] }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const createConversation = useCreateConversation();
  const { toggleSidebar } = useAppStore();
  const isOnChat = pathname === "/app/chat";
  const { data: notifData } = useQuery<{ unreadCount: number }>({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?unread=true");
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  function handleNewChat() {
    createConversation.mutate(undefined, {
      onSuccess: (data) => {
        useAppStore.getState().setActiveChatId(data.conversation.id);
        router.push('/app/chat');
      },
    });
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" aria-label="Go to homepage" className="flex items-center gap-2 bg-transparent border-none p-0" onClick={() => router.push("/")}>
          <Insignia size={10} showPills={false} />
          <TierBadge tier={userTier} />
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="h-8 w-8 text-zinc-400 hover:text-white relative"
            onClick={() => router.push("/app")}
          >
            <Bell className="h-4 w-4" />
            {(notifData?.unreadCount ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-blue-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notifData!.unreadCount > 9 ? "9+" : notifData!.unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close sidebar"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={toggleSidebar}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat section — only visible on /app/chat */}
      {isOnChat && (
        <>
          <div className="px-3 pb-2">
            <Button
              onClick={handleNewChat}
              disabled={createConversation.isPending}
              className="w-full justify-start gap-2 bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="flex-1 min-h-0 overflow-hidden py-2">
            <ConversationList />
          </div>

          <Separator className="bg-zinc-800" />
        </>
      )}

      {/* Navigation */}
      <div className="p-3 space-y-1 overflow-y-auto shrink-0">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Navigate</p>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 h-9"
          onClick={() => router.push("/app")}
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 h-9"
          onClick={() => router.push("/app/chat")}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 h-9"
          onClick={() => router.push("/app/billing")}
        >
          <CreditCard className="h-4 w-4" />
          Billing
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 h-9"
          onClick={() => router.push("/app/support")}
        >
          <HelpCircle className="h-4 w-4" />
          Support
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-zinc-300 hover:text-white hover:bg-zinc-800 h-9"
          onClick={() => router.push("/app/settings")}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>

        <Separator className="bg-zinc-800 my-2" />

        <div className="flex items-center gap-3 px-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <span className="text-sm text-zinc-400 truncate flex items-center gap-1.5">
            Account
            <GoldenEggDot badges={userBadges} />
          </span>
        </div>
      </div>
    </div>
  );
}
