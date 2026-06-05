"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SITE_NAME } from "@/lib/constants";
import { getDashboardPageTitle } from "@/lib/dashboard-titles";

interface DashboardShellProps {
  children: React.ReactNode;
  email: string;
  name?: string | null;
  profilePath: string;
  pageTitles: Record<string, string>;
  defaultTitle: string;
  basePath: string;
}

export function DashboardShell({
  children,
  email,
  name,
  profilePath,
  pageTitles,
  defaultTitle,
  basePath,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getDashboardPageTitle(
    pathname,
    pageTitles,
    defaultTitle,
    basePath
  );
  const displayName = name?.trim() || email.split("@")[0];

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <div className="admin-dashboard-main">
      <header className="admin-dashboard-navbar">
        <h1 className="admin-dashboard-navbar-title">{pageTitle}</h1>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="admin-user-menu-trigger"
            aria-label="Account menu"
          >
            <span className="admin-user-menu-name">{displayName}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{email}</p>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(profilePath)}>
              <UserRound className="h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="admin-dashboard-content">{children}</main>

      <footer className="admin-dashboard-footer">
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
