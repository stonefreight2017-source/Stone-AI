"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("App error:", error.digest || error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-700 mb-4">500</p>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          An unexpected error occurred. This has been logged and we'll look into it.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button
            variant="outline"
            className="border-zinc-700"
            onClick={() => (window.location.href = "/app")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
