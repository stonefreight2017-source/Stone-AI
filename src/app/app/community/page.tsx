import { getOrCreateUser } from "@/lib/auth";
import { CommunityClient } from "./community-client";

export default async function CommunityPage() {
  const user = await getOrCreateUser();

  return (
    <CommunityClient
      userId={user.id}
      userName={user.name || "Anonymous"}
      userTier={user.tier}
    />
  );
}
