"use client";

import { PanelLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { BackdropManager } from "@/components/backdrops/BackdropManager";

interface AppShellProps {
  children: React.ReactNode;
  userTier: string;
  userBadges?: string[];
  backdropTheme?: string;
}

export function AppShell({ children, userTier, userBadges = [], backdropTheme = "none" }: AppShellProps) {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const router = useRouter();

  return (
    <div className="relative flex h-screen bg-zinc-950 text-white">
      {/* Backdrop layer */}
      <BackdropManager theme={backdropTheme} />
      {/* Sidebar */}
      <div
        className={cn(
          "relative z-10 shrink-0 transition-all duration-200 ease-in-out overflow-hidden",
          sidebarOpen ? "w-[280px]" : "w-0"
        )}
      >
        <div className="w-[280px] h-full">
          <Sidebar userTier={userTier} userBadges={userBadges} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Top bar when sidebar is closed */}
        {!sidebarOpen && (
          <div className="flex items-center px-4 py-2 border-b border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open sidebar"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <span
              className="ml-2 text-sm font-medium text-zinc-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => router.push("/")}
            >
              Stone AI
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Home"
              className="h-8 w-8 text-zinc-400 hover:text-white ml-auto"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
