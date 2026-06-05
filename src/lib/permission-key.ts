import { slugify } from "@/lib/classes";
import type { PrismaClient } from "@prisma/client";

type PermissionDb = Pick<PrismaClient, "permission">;

export function permissionKeyFromName(group: string, name: string): string {
  const action = slugify(name).replace(/-/g, "_");
  const key = `${group}.${action || "permission"}`.slice(0, 64);
  return key;
}

export async function generateUniquePermissionKey(
  db: PermissionDb,
  group: string,
  name: string
): Promise<string> {
  const base = permissionKeyFromName(group, name);
  let suffix = 0;

  while (suffix < 100) {
    const candidate =
      suffix === 0 ? base : `${group}.${slugify(name).replace(/-/g, "_")}_${suffix}`.slice(0, 64);
    const existing = await db.permission.findUnique({
      where: { key: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
  }

  return `${group}.permission_${Date.now()}`.slice(0, 64);
}

export async function findPermissionByName(
  db: PermissionDb,
  name: string,
  excludeId?: string
) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return db.permission.findFirst({
    where: {
      name: { equals: trimmed, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}
