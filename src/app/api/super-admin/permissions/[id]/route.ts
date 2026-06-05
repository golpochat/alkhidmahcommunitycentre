import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { permissionPatchSchema } from "@/lib/validations";
import { findPermissionByName } from "@/lib/permission-key";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const permission = await db.permission.findUnique({ where: { id: params.id } });
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = permissionPatchSchema.parse(body);

    if (validated.name !== undefined) {
      const duplicateName = await findPermissionByName(db, validated.name, params.id);
      if (duplicateName) {
        return NextResponse.json(
          { error: "A permission with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await db.permission.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.description !== undefined
          ? { description: validated.description || null }
          : {}),
        ...(validated.group !== undefined ? { group: validated.group } : {}),
        ...(validated.isActive !== undefined ? { isActive: validated.isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
