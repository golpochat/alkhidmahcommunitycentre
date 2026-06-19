import { redirect } from "next/navigation";
import { AdminLegalManager } from "@/components/admin/admin-legal-manager";
import { canAccessAdminRoutes, canManageLegalPolicies, getFreshSession } from "@/lib/auth";

export default async function AdminLegalPage() {
  const session = await getFreshSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  if (!canManageLegalPolicies(session)) {
    redirect("/unauthorized");
  }

  return <AdminLegalManager />;
}
