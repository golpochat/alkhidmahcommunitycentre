import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccessSuperAdminRoutes } from "@/lib/rbac";
import { FlyerGeneratorManager } from "@/components/super-admin/flyer-generator-manager";

export default async function SuperAdminFlyersPage() {
  const session = await getSession();
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
