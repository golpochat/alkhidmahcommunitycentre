import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SUPER_ADMIN_PAGE_TITLES } from "@/lib/dashboard-titles";

interface SuperAdminShellProps {
  children: React.ReactNode;
  email: string;
  name?: string | null;
}

export function SuperAdminShell({ children, email, name }: SuperAdminShellProps) {
  return (
    <DashboardShell
      email={email}
      name={name}
      profilePath="/super-admin/profile"
      pageTitles={SUPER_ADMIN_PAGE_TITLES}
      defaultTitle="Super Admin"
      basePath="/super-admin"
    >
      {children}
    </DashboardShell>
  );
}
