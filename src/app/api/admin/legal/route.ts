import { NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { listSerializedLegalPolicies } from "@/lib/legal-policies";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.legal.manage);
    const policies = await listSerializedLegalPolicies();
    return NextResponse.json(policies);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load policies";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
