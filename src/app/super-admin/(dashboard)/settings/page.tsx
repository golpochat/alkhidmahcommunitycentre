import { redirect } from "next/navigation";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { getSession, canManageSettings } from "@/lib/auth";

export default async function SuperAdminSettingsPage() {
  const session = await getSession();

  if (!session || !canManageSettings(session)) {
    redirect("/login");
  }

  return (
    <div>
      <AdminSettingsForm />
    </div>
  );
}

