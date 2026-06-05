import { redirect } from "next/navigation";
import { getFreshSession, getHomeRouteForSession, getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function LoginPage() {
  const session = await getFreshSession();

  if (session) {
    redirect(getHomeRouteForSession(session));
  }

  if (await getSession()) {
    redirect("/api/auth/clear-session");
  }

  return <AdminLoginForm />;
}

