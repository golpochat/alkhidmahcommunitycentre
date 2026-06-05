import { redirect } from "next/navigation";
import { RolesPermissionsManager } from "@/components/super-admin/roles-permissions-manager";
import { canManageUsers, getSession } from "@/lib/auth";

export default async function SuperAdminRolesPage() {
  const session = await getSession();

  if (!session || !canManageUsers(session)) {
    redirect("/login");
  }

  return (
    <div>
      <RolesPermissionsManager />
    </div>
  );
}
