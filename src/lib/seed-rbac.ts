import type { PrismaClient } from "@prisma/client";
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from "@/lib/rbac-seed";

export async function seedRbac(prisma: PrismaClient) {
  const permissionIdByKey = new Map<string, string>();

  for (const permission of DEFAULT_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description,
        group: permission.group,
        isSystem: true,
      },
      create: {
        key: permission.key,
        name: permission.name,
        description: permission.description,
        group: permission.group,
        isSystem: true,
      },
    });
    permissionIdByKey.set(permission.key, record.id);
  }

  for (const role of DEFAULT_ROLES) {
    const record = await prisma.accessRole.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        tier: role.tier,
        isSystem: role.isSystem,
      },
      create: {
        slug: role.slug,
        name: role.name,
        description: role.description,
        tier: role.tier,
        isSystem: role.isSystem,
      },
    });

    await prisma.accessRolePermission.deleteMany({
      where: { roleId: record.id },
    });

    const permissionIds = role.permissionKeys
      .map((key) => permissionIdByKey.get(key))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await prisma.accessRolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: record.id,
          permissionId,
        })),
      });
    }
  }

  return permissionIdByKey;
}

export async function getRoleIdBySlug(prisma: PrismaClient, slug: string) {
  const role = await prisma.accessRole.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!role) {
    throw new Error(`Missing access role: ${slug}`);
  }
  return role.id;
}
