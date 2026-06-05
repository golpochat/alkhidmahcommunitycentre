import type { PrismaClient } from "@prisma/client";
import { getRoleIdBySlug } from "@/lib/seed-rbac";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";

/** Canonical super-admin email — one account only, set via env. */
export function getSuperAdminEmail() {
  return (
    process.env.SUPER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "super-admin@alkhidmah.ie"
  ).toLowerCase();
}

type UserDelegate = Pick<PrismaClient, "user" | "accessRole">["user"];

/**
 * Ensures exactly one super-admin exists (the canonical email from env).
 * All other super-admin accounts are demoted to the admin role.
 */
export async function ensureSingleSuperAdmin(db: {
  user: UserDelegate;
  accessRole: PrismaClient["accessRole"];
}) {
  const canonicalEmail = getSuperAdminEmail();
  const superAdminRoleId = await getRoleIdBySlug(db as PrismaClient, SUPER_ADMIN_ROLE_SLUG);
  const adminRoleId = await getRoleIdBySlug(db as PrismaClient, "admin");

  let canonical = await db.user.findUnique({
    where: { email: canonicalEmail },
  });

  if (!canonical) {
    const existingSuperAdmins = await db.user.findMany({
      where: { roleId: superAdminRoleId },
      orderBy: { createdAt: "asc" },
    });

    if (existingSuperAdmins.length === 0) {
      return null;
    }

    canonical = existingSuperAdmins[0];
  }

  if (canonical.roleId !== superAdminRoleId) {
    canonical = await db.user.update({
      where: { id: canonical.id },
      data: { roleId: superAdminRoleId },
    });
  }

  const demoted = await db.user.updateMany({
    where: {
      roleId: superAdminRoleId,
      NOT: { id: canonical.id },
    },
    data: { roleId: adminRoleId },
  });

  return { canonical, demotedCount: demoted.count };
}
