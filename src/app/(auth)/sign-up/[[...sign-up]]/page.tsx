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

  return <SignUp />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <SignUpInner />
    </Suspense>
  );
}
