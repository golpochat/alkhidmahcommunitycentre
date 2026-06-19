import { AccountTier } from "@/lib/account-tier";
import type { SessionUser } from "@/lib/auth";
import {
  canAccessAdminRoutes,
  canAccessSuperAdminRoutes,
  canAccessUserRoutes,
  hasPermission,
  isEditorReadOnly,
} from "@/lib/session-access";
import { getHomeRouteForSession } from "@/lib/home-routes";
import { PERMISSIONS } from "@/lib/permission-keys";
import { MEMBER_ROLE_SLUG, SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";

export { PERMISSIONS } from "@/lib/permission-keys";
export {
  hasPermission,
  isSuperAdminRole,
} from "@/lib/session-access";
export { getHomeRouteForSession } from "@/lib/home-routes";

export type UserTier = 1 | 2 | 3;

export function getUserTier(session: SessionUser): UserTier {
  if (session.tier === AccountTier.SUPER_ADMIN) return 1;
  if (session.tier === AccountTier.STAFF) return 2;
  return 3;
}

export {
  canAccessAdminRoutes,
  canAccessSuperAdminRoutes,
  canAccessUserRoutes,
  isEditorReadOnly,
};

export function isProtectedSuperAdminAccount(session: SessionUser) {
  return session.roleSlug === SUPER_ADMIN_ROLE_SLUG;
}

export function canManageUsers(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.users.manage);
}

export function canManageSettings(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.settings.manage);
}

export function canManageEvents(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.events.manage);
}

export function canDeleteEvents(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.events.delete);
}

export function canManageGallery(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.gallery.manage);
}

export function canDeleteGallery(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.gallery.delete);
}

export function canManageClasses(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.education.manage);
}

export function canDeleteClasses(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.education.delete);
}

export function canManageDonations(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.donations.manage);
}

export function canManagePrayerTimes(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.prayerTimes.manage);
}

export function canManageDisplay(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.display.manage);
}

export function canManageAboutPage(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.about.manage);
}

export function canManageLegalPolicies(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.legal.manage);
}

export function canManageRegistrations(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.registrations.manage);
}

export function canManageContactMessages(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.contact.manage);
}

export function canViewContentAudit(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.content.audit);
}

export function canWriteAdminContent(session: SessionUser) {
  return hasPermission(session, PERMISSIONS.content.write);
}

export function roleLabel(session: SessionUser | { roleName: string }) {
  return session.roleName;
}

export const INVITABLE_STAFF_ROLE_SLUGS = [
  "admin",
  "editor",
  "web-admin",
  "account-admin",
] as const;

export function isInvitableStaffRoleSlug(slug: string) {
  return (INVITABLE_STAFF_ROLE_SLUGS as readonly string[]).includes(slug);
}

export function isMemberRoleSlug(slug: string) {
  return slug === MEMBER_ROLE_SLUG;
}

/** @deprecated Use canManageEvents */
export function canManageContent(session: SessionUser) {
  return canManageEvents(session);
}

/** @deprecated Use canWriteAdminContent */
export function canWriteAdmin(session: SessionUser) {
  return canWriteAdminContent(session);
}

/** @deprecated Use getHomeRouteForSession */
export function getHomeRouteForRole(role: SessionUser | { tier: SessionUser["tier"] }): string {
  if (role && typeof role === "object" && "permissions" in role) {
    return getHomeRouteForSession(role as SessionUser);
  }
  if (role && typeof role === "object" && "tier" in role) {
    return getHomeRouteForSession({ tier: role.tier });
  }
  return "/login";
}
