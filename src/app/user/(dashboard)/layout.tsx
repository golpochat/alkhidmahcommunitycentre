import { redirect } from "next/navigation";
import {
  canAccessUserRoutes,
  getFreshSession,
  getSession,
} from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UserSidebar } from "@/components/user/user-sidebar";
import { USER_PAGE_TITLES } from "@/lib/dashboard-titles";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshSession();

  if (!session || !canAccessUserRoutes(session)) {
    if (await getSession()) {
      redirect("/api/auth/clear-session");
    }
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <UserSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardShell
          email={session.email}
          name={session.name}
          profilePath="/user/profile"
          pageTitles={USER_PAGE_TITLES}
          defaultTitle="My Account"
          basePath="/user"
        >
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}

