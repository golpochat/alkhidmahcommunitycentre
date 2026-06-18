import { redirect } from "next/navigation";
import { getFreshSession } from "@/lib/auth";
import { canAccessSuperAdminRoutes } from "@/lib/rbac";
import { FlyerGeneratorManager } from "@/components/super-admin/flyer-generator-manager";

export default async function SuperAdminFlyersPage() {
  const session = await getFreshSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessSuperAdminRoutes(session)) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="admin-page-title">Flyer Generator</h1>
      <FlyerGeneratorManager />
    </div>
  );
}
