import { redirect } from "next/navigation";
import {
  canAccessAdminRoutes,
  getFreshSession,
  getHomeRouteForSession,
} from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SessionCookieSync } from "@/components/auth/session-cookie-sync";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_PAGE_TITLES } from "@/lib/dashboard-titles";
import { getSiteBranding } from "@/lib/site-branding";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshSession();

  if (!session) {
    redirect("/login");
  }

  if (!canAccessAdminRoutes(session)) {
    redirect(getHomeRouteForSession(session));
  }

  const branding = await getSiteBranding();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <SessionCookieSync />
      <AdminSidebar session={session} siteName={branding.siteName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardShell
          email={session.email}
          name={session.name}
          profilePath="/admin/profile"
          pageTitles={ADMIN_PAGE_TITLES}
          defaultTitle="Admin Panel"
          basePath="/admin"
          siteName={branding.siteName}
        >
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}

