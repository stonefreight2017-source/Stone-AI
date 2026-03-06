import { getOrCreateUser } from "@/lib/auth";
import { getUserBadges } from "@/lib/badges";
import { AppShellWrapper } from "./app-shell-wrapper";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateUser();
  const userBadges = getUserBadges(user).map((b) => b.slug);

  return (
    <AppShellWrapper
      userTier={user.tier}
      userBadges={userBadges}
      onboardingCompleted={user.onboardingCompleted}
      backdropTheme={user.backdropTheme}
    >
      {children}
    </AppShellWrapper>
  );
}
