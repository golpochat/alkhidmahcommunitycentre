import { NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { listAllDonationCategories } from "@/lib/donation-categories";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.donations.manage);

    const categories = await listAllDonationCategories();
    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
