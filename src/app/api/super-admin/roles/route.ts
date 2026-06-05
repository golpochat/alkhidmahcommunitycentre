import { NextRequest, NextResponse } from "next/server";
import { AccountTier } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { accessRoleCreateSchema } from "@/lib/validations";
import { isInvitableStaffRoleSlug } from "@/lib/rbac";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";
import { findRoleByName, generateUniqueRoleSlug } from "@/lib/role-slug";

function serializeRole(
  role: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    tier: AccountTier;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions: Array<{ permission: { id: string; key: string; name: string; group: string } }>;
    _count: { users: number };
  }
) {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    tier: role.tier,
    isSystem: role.isSystem,
    isActive: role.isActive ?? true,
    userCount: role._count.users,
    permissions: role.permissions.map((entry) => entry.permission),
    permissionIds: role.permissions.map((entry) => entry.permission.id),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

const roleInclude = {
  permissions: {
    select: {
      permission: {
        select: { id: true, key: true, name: true, group: true },
      },
    },
  },
  _count: { select: { users: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const assignableOnly =
      request.nextUrl.searchParams.get("assignable") === "true";
    const invitableStaffOnly =
      request.nextUrl.searchParams.get("invitableStaff") === "true";

    const roles = await db.accessRole.findMany({
      where: invitableStaffOnly
        ? {
            slug: { not: SUPER_ADMIN_ROLE_SLUG },
            tier: AccountTier.STAFF,
            isActive: true,
          }
        : assignableOnly
          ? {
              slug: { not: SUPER_ADMIN_ROLE_SLUG },
              tier: AccountTier.STAFF,
              isActive: true,
            }
          : undefined,
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: roleInclude,
    });

    const filtered = invitableStaffOnly
      ? roles.filter((role) => isInvitableStaffRoleSlug(role.slug))
      : roles;

    return NextResponse.json(filtered.map(serializeRole));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const body = await request.json();
    const validated = accessRoleCreateSchema.parse(body);

    const duplicateName = await findRoleByName(db, validated.name);
    if (duplicateName) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 409 }
      );
    }

    const slug = await generateUniqueRoleSlug(db, validated.name);

    const role = await db.accessRole.create({
      data: {
        slug,
        name: validated.name.trim(),
        description: null,
        tier: AccountTier.STAFF,
        isSystem: false,
        isActive: true,
      },
      include: roleInclude,
    });

    return NextResponse.json(serializeRole(role), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
