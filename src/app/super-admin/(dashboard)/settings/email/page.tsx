import { redirect } from "next/navigation";
import { getFreshSession, canManageSettings } from "@/lib/auth";
import { EmailSettingsTab } from "@/components/super-admin/settings/email-settings-tab";

export default async function SuperAdminEmailSettingsPage() {
  const session = await getFreshSession();

  if (!session || !canManageSettings(session)) {
    redirect("/login");
  }

  return <EmailSettingsTab />;
}

