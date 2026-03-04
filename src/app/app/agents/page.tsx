import { getOrCreateUser } from "@/lib/auth";
import AgentMarketplace from "./agent-marketplace";

export default async function AgentsPage() {
  const user = await getOrCreateUser();
  return <AgentMarketplace userTier={user.tier} />;
}
