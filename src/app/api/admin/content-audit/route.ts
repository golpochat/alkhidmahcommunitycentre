import { NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import {
  listContentAuditLogs,
  serializeContentAuditLog,
} from "@/lib/content-audit-log";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.content.audit);

    const logs = await listContentAuditLogs(200);
    return NextResponse.json(logs.map(serializeContentAuditLog));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load audit log";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
