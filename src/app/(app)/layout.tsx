import { requireUser } from "@/server/auth/session";
import { getZone } from "@/server/zone";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, zone] = await Promise.all([requireUser(), getZone()]);

  return (
    <AppShell userName={user.name} zone={zone}>
      {children}
    </AppShell>
  );
}
