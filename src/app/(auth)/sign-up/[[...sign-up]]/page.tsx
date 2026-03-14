"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

function SignUpInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("stone_ref", ref);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center gap-4">
      <SignUp />
      <p className="max-w-sm text-center text-xs text-zinc-400 px-4">
        By signing up, you acknowledge that Stone AI is not HIPAA-compliant and
        should not be used for protected health information.
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <SignUpInner />
    </Suspense>
  );
}
