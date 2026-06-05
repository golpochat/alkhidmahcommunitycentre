import { redirect } from "next/navigation";
import { getFreshSession, canAccessSuperAdminRoutes } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";

export default async function SuperAdminProfilePage() {
  const session = await getFreshSession();

  if (!session || !canAccessSuperAdminRoutes(session)) {
    redirect("/login");
  }

  return <ProfileSettingsForm />;
}

