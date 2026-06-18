import { redirect } from "next/navigation";
import { getFreshSession, getHomeRouteForSession } from "@/lib/auth";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshSession();
  if (session) {
    redirect(getHomeRouteForSession(session));
  }

  return <>{children}</>;
}

