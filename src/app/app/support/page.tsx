import { getOrCreateUser } from "@/lib/auth";
import { SupportClient } from "./support-client";

export default async function SupportPage() {
  const user = await getOrCreateUser();
  return <SupportClient userTier={user.tier} userEmail={user.email} />;
}
