"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("stone_ref", ref);
    }
  }, [searchParams]);

  return <SignUp />;
}
