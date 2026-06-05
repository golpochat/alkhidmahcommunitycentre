import { redirect } from "next/navigation";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { getSession, canManageUsers } from "@/lib/auth";

export default async function SuperAdminUsersPage() {
  const session = await getSession();

  if (!session || !canManageUsers(session)) {
    redirect("/login");
  }

  return <AdminUsersManager />;
}

