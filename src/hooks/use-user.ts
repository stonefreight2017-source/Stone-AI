"use client";

import { useQuery } from "@tanstack/react-query";

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  tierName: string;
  limits: {
    messagesPerDay: number;
    tokensPerMonth: number;
    maxResponseTokens: number;
    concurrentRequests: number;
    requestsPerMinute: number;
  };
  allowedModes: string[];
  canExport: boolean;
}

export function useUser() {
  return useQuery<{ user: UserInfo }>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    staleTime: 60 * 1000, // Cache user info for 60s
  });
}
