import { slugify } from "@/lib/classes";
import type { PrismaClient } from "@prisma/client";

type RoleDb = Pick<PrismaClient, "accessRole">;

export function slugifyRoleName(name: string): string {
  const slug = slugify(name).slice(0, 48);
  return slug || "role";
}

export async function generateUniqueRoleSlug(
  db: RoleDb,
  name: string
): Promise<string> {
  const base = slugifyRoleName(name);
  let suffix = 0;

  while (suffix < 100) {
    const candidate = suffix === 0 ? base : `${base}-${suffix}`;
    const existing = await db.accessRole.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

export async function findRoleByName(
  db: RoleDb,
  name: string,
  excludeId?: string
) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return db.accessRole.findFirst({
    where: {
      name: { equals: trimmed, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}
