import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { listActiveDonationCategories } from "@/lib/donation-categories";

export async function GET() {
  try {
    await requireSuperAdmin();

    const categories = await listActiveDonationCategories();

    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
