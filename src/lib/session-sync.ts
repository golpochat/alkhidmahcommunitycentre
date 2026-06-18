import type { AccountTier } from "@/lib/account-tier";

interface SessionAuthorizationSnapshot {
  roleId: string;
  roleSlug: string;
  tier: AccountTier;
  permissions: string[];
}

function sortedPermissions(permissions: string[]) {
  return [...permissions].sort();
}

export function permissionsEqual(left: string[], right: string[]) {
  const a = sortedPermissions(left);
  const b = sortedPermissions(right);

  if (a.length !== b.length) {
    return false;
  }

  return a.every((permission, index) => permission === b[index]);
}

export function sessionAuthorizationChanged(
  cached: SessionAuthorizationSnapshot,
  fresh: SessionAuthorizationSnapshot,
) {
  return (
    cached.roleId !== fresh.roleId ||
    cached.roleSlug !== fresh.roleSlug ||
    cached.tier !== fresh.tier ||
    !permissionsEqual(cached.permissions, fresh.permissions)
  );
}
