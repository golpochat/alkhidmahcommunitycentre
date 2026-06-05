import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import { canAccessAdminRoutes, getFreshSession } from "@/lib/auth";

export default async function AdminProfilePage() {
  const session = await getFreshSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  return <ProfileSettingsForm />;
}

