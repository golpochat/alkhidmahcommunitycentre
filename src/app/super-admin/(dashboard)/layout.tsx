import { redirect } from "next/navigation";
import { getFreshSession, getSession, canAccessSuperAdminRoutes } from "@/lib/auth";
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { getSiteBranding } from "@/lib/site-branding";

export default async function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshSession({ syncCookie: true });

  if (!session || !canAccessSuperAdminRoutes(session)) {
    if (await getSession()) {
      redirect("/api/auth/clear-session");
    }
    redirect("/login");
  }

  const branding = await getSiteBranding();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <SuperAdminSidebar siteName={branding.siteName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SuperAdminShell email={session.email} name={session.name} siteName={branding.siteName}>
          {children}
        </SuperAdminShell>
      </div>
    </div>
  );
}

