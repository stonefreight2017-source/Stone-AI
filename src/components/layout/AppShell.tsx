"use client";

import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  userTier: string;
}

export function AppShell({ children, userTier }: AppShellProps) {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div
        className={cn(
          "shrink-0 transition-all duration-200 ease-in-out overflow-hidden",
          sidebarOpen ? "w-[280px]" : "w-0"
        )}
      >
        <div className="w-[280px] h-full">
          <Sidebar userTier={userTier} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
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
            <span className="ml-2 text-sm font-medium text-zinc-300">
              Stone AI
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
