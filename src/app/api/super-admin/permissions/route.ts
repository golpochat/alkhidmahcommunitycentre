import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { permissionCreateSchema } from "@/lib/validations";
import {
  findPermissionByName,
  generateUniquePermissionKey,
} from "@/lib/permission-key";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const permissions = await db.permission.findMany({
      orderBy: [{ group: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(permissions);
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
    const validated = permissionCreateSchema.parse(body);

    const duplicateName = await findPermissionByName(db, validated.name);
    if (duplicateName) {
      return NextResponse.json(
        { error: "A permission with this name already exists" },
        { status: 409 }
      );
    }

    const key = await generateUniquePermissionKey(
      db,
      validated.group,
      validated.name
    );

    const permission = await db.permission.create({
      data: {
        key,
        name: validated.name.trim(),
        description: validated.description ?? null,
        group: validated.group,
        isSystem: false,
        isActive: true,
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
