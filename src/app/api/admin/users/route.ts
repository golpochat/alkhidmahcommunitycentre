import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { SUPER_ADMIN_ROLE_SLUG } from "@/lib/rbac-seed";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const users = await db.user.findMany({
      where: {
        role: {
          slug: { not: SUPER_ADMIN_ROLE_SLUG },
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        isActive: true,
        role: {
          select: {
            id: true,
            slug: true,
            name: true,
            tier: true,
            description: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Staff invitations are sent from the Invitations page. Users are created after they complete setup.",
    },
    { status: 403 }
  );
}
