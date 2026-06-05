import { NextRequest, NextResponse } from "next/server";
import { AccountTier } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { accessRoleMetadataUpdateSchema } from "@/lib/validations";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";
import { findRoleByName } from "@/lib/role-slug";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const role = await db.accessRole.findUnique({
      where: { id: params.id },
      include: roleInclude,
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(serializeRole(role));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const role = await db.accessRole.findUnique({ where: { id: params.id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.slug === SUPER_ADMIN_ROLE_SLUG) {
      return NextResponse.json(
        { error: "The super admin role cannot be modified" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = accessRoleMetadataUpdateSchema.parse(body);

    if (validated.name !== undefined) {
      const duplicateName = await findRoleByName(db, validated.name, params.id);
      if (duplicateName) {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await db.accessRole.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.description !== undefined
          ? { description: validated.description || null }
          : {}),
        ...(validated.isActive !== undefined ? { isActive: validated.isActive } : {}),
      },
      include: roleInclude,
    });

    return NextResponse.json(serializeRole(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const role = await db.accessRole.findUnique({
      where: { id: params.id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem || role.slug === SUPER_ADMIN_ROLE_SLUG) {
      return NextResponse.json(
        { error: "Built-in roles cannot be deleted" },
        { status: 400 }
      );
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        { error: "Remove all users from this role before deleting it" },
        { status: 400 }
      );
    }

    await db.accessRole.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
