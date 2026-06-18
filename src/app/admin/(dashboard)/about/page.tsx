import { redirect } from "next/navigation";
import { AdminAboutManager } from "@/components/admin/admin-about-manager";
import { canAccessAdminRoutes, canManageAboutPage, getFreshSession } from "@/lib/auth";

export default async function AdminAboutPage() {
  const session = await getFreshSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  if (!canManageAboutPage(session)) {
    redirect("/unauthorized");
  }

  return <AdminAboutManager />;
}
