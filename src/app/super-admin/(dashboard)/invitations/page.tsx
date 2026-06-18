import { redirect } from "next/navigation";
import { getFreshSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { StaffInvitationsManager } from "@/components/super-admin/staff-invitations-manager";

export default async function SuperAdminInvitationsPage() {
  const session = await getFreshSession();
  if (!session) {
    redirect("/login");
  }
  if (!canManageUsers(session)) {
    redirect("/super-admin");
  }

  return (
    <div>
      <h1 className="admin-page-title">Staff invitations</h1>
      <StaffInvitationsManager />
    </div>
  );
}
