import { redirect } from "next/navigation";
import { AdminDisplayManager } from "@/components/admin/admin-display-manager";
import { canAccessAdminRoutes, canManagePrayerTimes, getSession } from "@/lib/auth";

export default async function AdminDisplayPage() {
  const session = await getSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  if (!canManagePrayerTimes(session)) {
    redirect("/unauthorized");
  }

  return <AdminDisplayManager />;
}
