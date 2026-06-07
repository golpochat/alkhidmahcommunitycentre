import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import {
  deleteDonationCategory,
  listAllDonationCategories,
  refreshDonationCategoryUrls,
} from "@/lib/donation-categories";
import { logContentPublishAction } from "@/lib/content-audit-log";
import {
  donationCategoryUpdateSchema,
  publishStatusSchema,
} from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.donations.manage);

    const existing = await db.donationCategory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = donationCategoryUpdateSchema.parse(body);

    await db.donationCategory.update({
      where: { id: params.id },
      data: {
        name: validated.name.trim(),
        description: validated.description.trim(),
      },
    });

    await refreshDonationCategoryUrls();

    const categories = await listAllDonationCategories();
    const category = categories.find((item) => item.id === params.id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission(PERMISSIONS.donations.manage);

    const existing = await db.donationCategory.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const { published } = publishStatusSchema.parse(body);

    await db.donationCategory.update({
      where: { id: params.id },
      data: { isActive: published },
    });

    if (existing.isActive !== published) {
      await logContentPublishAction({
        entityType: "donation_category",
        entityId: existing.id,
        entityTitle: existing.name,
        published,
        actorEmail: session.email,
      });
    }

    if (published) {
      await refreshDonationCategoryUrls();
    }

    const categories = await listAllDonationCategories();
    const category = categories.find((item) => item.id === params.id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requirePermission(PERMISSIONS.donations.manage);
    await deleteDonationCategory(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Category not found"
            ? 404
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
