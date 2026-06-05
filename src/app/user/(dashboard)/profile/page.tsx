import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import { canAccessUserRoutes, getFreshSession } from "@/lib/auth";

export default async function UserProfilePage() {
  const session = await getFreshSession();

  if (!session || !canAccessUserRoutes(session)) {
    redirect("/login");
  }

  return <ProfileSettingsForm />;
}

