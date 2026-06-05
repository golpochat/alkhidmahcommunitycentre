import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const logs = await db.userAdminLog.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        reason: log.reason,
        details: log.details,
        actorEmail: log.actorEmail,
        createdAt: log.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
