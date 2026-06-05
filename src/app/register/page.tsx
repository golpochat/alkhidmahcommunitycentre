import { redirect } from "next/navigation";
import { getFreshSession, getHomeRouteForSession, getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await getFreshSession();

  if (session) {
    redirect(getHomeRouteForSession(session));
  }

  if (await getSession()) {
    redirect("/api/auth/clear-session");
  }

  return <RegisterForm />;
}

