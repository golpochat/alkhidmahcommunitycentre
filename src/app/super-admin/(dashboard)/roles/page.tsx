import { redirect } from "next/navigation";
import { RolesPermissionsManager } from "@/components/super-admin/roles-permissions-manager";
import { canManageUsers, getFreshSession } from "@/lib/auth";

export default async function SuperAdminRolesPage() {
  const session = await getFreshSession();

  if (!session || !canManageUsers(session)) {
    redirect("/login");
  }

  return (
    <div>
      <RolesPermissionsManager />
    </div>
  );
}
