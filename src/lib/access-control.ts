import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import {
  buildSessionUserFromRecord,
} from "@/lib/session-access";

export {
  buildSessionUserFromRecord,
  canAccessAdminRoutes,
  canAccessSuperAdminRoutes,
  canAccessUserRoutes,
  hasPermission,
  isEditorReadOnly,
  isSuperAdminRole,
} from "@/lib/session-access";

const roleWithPermissionsSelect = {
  id: true,
  slug: true,
  name: true,
  tier: true,
  permissions: {
    select: {
      permission: {
        select: { key: true },
      },
    },
  },
} as const;

export type DbClient = Pick<PrismaClient, "user" | "accessRole" | "permission">;

export async function getRoleBySlug(slug: string, client: DbClient = db) {
  return client.accessRole.findUnique({
    where: { slug },
    select: roleWithPermissionsSelect,
  });
}

export async function getPermissionsForRoleId(roleId: string, client: DbClient = db) {
  const role = await client.accessRole.findUnique({
    where: { id: roleId },
    select: roleWithPermissionsSelect,
  });

  if (!role) {
    return [];
  }

  return role.permissions.map((entry) => entry.permission.key);
}

export async function loadSessionUserById(userId: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: {
        select: {
          id: true,
          slug: true,
          name: true,
          tier: true,
          permissions: {
            select: {
              permission: { select: { key: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return buildSessionUserFromRecord(user);
}
