import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import {
  createDonationCategory,
  listAllDonationCategories,
} from "@/lib/donation-categories";
import { donationCategoryCreateSchema } from "@/lib/validations";

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

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.donations.manage);

    const body = await request.json();
    const validated = donationCategoryCreateSchema.parse(body);
    const category = await createDonationCategory(validated);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
