import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { accessRolePermissionsUpdateSchema } from "@/lib/validations";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";

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
    const validated = accessRolePermissionsUpdateSchema.parse(body);

    const permissions = await db.permission.findMany({
      where: { id: { in: validated.permissionIds } },
      select: { id: true },
    });

    if (permissions.length !== validated.permissionIds.length) {
      return NextResponse.json(
        { error: "One or more permissions are invalid" },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.accessRolePermission.deleteMany({ where: { roleId: params.id } }),
      db.accessRolePermission.createMany({
        data: validated.permissionIds.map((permissionId) => ({
          roleId: params.id,
          permissionId,
        })),
      }),
    ]);

    const updated = await db.accessRole.findUnique({
      where: { id: params.id },
      include: roleInclude,
    });

    if (!updated) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      permissionIds: updated.permissions.map((entry) => entry.permission.id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
