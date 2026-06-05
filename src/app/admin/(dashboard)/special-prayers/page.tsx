import { redirect } from "next/navigation";
import { AdminPrayerTimesManager } from "@/components/admin/admin-prayer-times-manager";
import { canAccessAdminRoutes, canManagePrayerTimes, getSession } from "@/lib/auth";

export default async function AdminSpecialPrayersPage() {
  const session = await getSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  if (!canManagePrayerTimes(session)) {
    redirect("/unauthorized");
  }

  return <AdminPrayerTimesManager />;
}
