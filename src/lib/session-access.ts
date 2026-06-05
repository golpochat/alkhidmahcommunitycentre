import { AccountTier } from "@/lib/account-tier";
import type { SessionUser } from "@/lib/auth";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";

export function buildSessionUserFromRecord(
  user: {
    id: string;
    email: string;
    name: string | null;
    role: {
      id: string;
      slug: string;
      name: string;
      tier: AccountTier;
      permissions: Array<{ permission: { key: string } }>;
    };
  }
): SessionUser {
  const permissions = user.role.permissions.map((entry) => entry.permission.key);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleId: user.role.id,
    roleSlug: user.role.slug,
    roleName: user.role.name,
    tier: user.role.tier,
    permissions,
  };
}

export function hasPermission(session: SessionUser, permission: string) {
  return session.permissions.includes(permission);
}

export function isSuperAdminRole(session: SessionUser) {
  return session.roleSlug === SUPER_ADMIN_ROLE_SLUG;
}

export function canAccessSuperAdminRoutes(session: SessionUser) {
  return session.tier === AccountTier.SUPER_ADMIN;
}

export function canAccessAdminRoutes(session: SessionUser) {
  return session.tier === AccountTier.STAFF;
}

export function canAccessUserRoutes(session: SessionUser) {
  return session.tier === AccountTier.MEMBER;
}

export function isEditorReadOnly(session: SessionUser) {
  return (
    canAccessAdminRoutes(session) &&
    !hasPermission(session, "content.write")
  );
}
