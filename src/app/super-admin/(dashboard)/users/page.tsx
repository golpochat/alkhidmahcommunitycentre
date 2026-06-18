import { redirect } from "next/navigation";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { getFreshSession, canManageUsers } from "@/lib/auth";

export default async function SuperAdminUsersPage() {
  const session = await getFreshSession();

  if (!session || !canManageUsers(session)) {
    redirect("/login");
  }

  return <AdminUsersManager />;
}

