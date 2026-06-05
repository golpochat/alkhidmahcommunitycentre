import type { SessionUser } from "@/lib/auth";
import { getHomeRouteForSession } from "@/lib/rbac";

export interface SiteAuthNav {
  isAuthenticated: boolean;
  dashboardHref: string;
}

export function buildSiteAuthNav(session: SessionUser | null): SiteAuthNav {
  if (!session) {
    return {
      isAuthenticated: false,
      dashboardHref: "/login",
    };
  }

  return {
    isAuthenticated: true,
    dashboardHref: getHomeRouteForSession(session),
  };
}
