import { EDUCATION_NAV_LABEL } from "@/lib/constants";

export const SUPER_ADMIN_PAGE_TITLES: Record<string, string> = {
  "/super-admin": "Dashboard",
  "/super-admin/users": "Staff & Users",
  "/super-admin/invitations": "Staff Invitations",
  "/super-admin/flyers": "Flyer Generator",
  "/super-admin/roles": "Roles & Permissions",
  "/super-admin/settings": "Settings",
  "/super-admin/profile": "My Profile",
};

export const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/events": "Events",
  "/admin/gallery": "Gallery",
  "/admin/donations": "Donations",
  "/admin/education": EDUCATION_NAV_LABEL,
  "/admin/registrations": "Registrations",
  "/admin/special-prayers": "Prayer Timetable",
  "/admin/prayer-times": "Prayer Timetable",
  "/admin/display": "TV Display",
  "/admin/profile": "My Profile",
};

export const USER_PAGE_TITLES: Record<string, string> = {
  "/user": "Dashboard",
  "/user/donations": "My Donations",
  "/user/registrations": "My Registrations",
  "/user/profile": "My Profile",
};

export function getDashboardPageTitle(
  pathname: string,
  pageTitles: Record<string, string>,
  defaultTitle: string,
  basePath: string
) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  const matched = Object.entries(pageTitles)
    .filter(([path]) => path !== basePath)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path));

  if (matched) {
    return matched[1];
  }

  if (pathname.includes("/new")) {
    return "Create";
  }

  if (pathname.includes("/edit")) {
    return "Edit";
  }

  return defaultTitle;
}
