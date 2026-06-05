import { redirect } from "next/navigation";
import { getHomeRouteForSession, getSession } from "@/lib/auth";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) {
    redirect(getHomeRouteForSession(session));
  }

  return <>{children}</>;
}

