import { redirect } from "next/navigation";
import { getFreshSession, getSession, canAccessSuperAdminRoutes } from "@/lib/auth";
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";

export default async function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshSession();

  if (!session || !canAccessSuperAdminRoutes(session)) {
    if (await getSession()) {
      redirect("/api/auth/clear-session");
    }
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SuperAdminShell email={session.email} name={session.name}>
          {children}
        </SuperAdminShell>
      </div>
    </div>
  );
}

