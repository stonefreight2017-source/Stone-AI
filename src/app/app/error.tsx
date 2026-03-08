"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App section error:", error.digest || error.message);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center">
        <p className="text-5xl font-bold text-zinc-700 mb-4">Oops</p>
        <h1 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm">
          An unexpected error occurred in the app. Your data is safe — try
          again or head back to the dashboard.
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
