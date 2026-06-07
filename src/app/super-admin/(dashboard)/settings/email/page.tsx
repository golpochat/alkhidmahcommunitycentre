import { redirect } from "next/navigation";

export default function SuperAdminEmailSettingsPage() {
  redirect("/super-admin/settings?tab=email");
}
