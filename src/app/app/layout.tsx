import { getOrCreateUser } from "@/lib/auth";
import { AppShellWrapper } from "./app-shell-wrapper";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateUser();

  return (
    <AppShellWrapper userTier={user.tier}>{children}</AppShellWrapper>
  );
}
