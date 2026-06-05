import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import {
  getDonationCategoryById,
  listActiveDonationCategories,
} from "@/lib/donation-categories";
import { generateFlyer } from "@/lib/flyers/renderFlyer";
import { flyerGenerateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const validated = flyerGenerateSchema.parse(body);

    if (validated.theme === "multi-category") {
      const allCategories = await listActiveDonationCategories();
      const result = await generateFlyer({
        theme: validated.theme,
        allCategories,
      });

      return NextResponse.json({
        ...result,
        theme: validated.theme,
        generatedAt: new Date().toISOString(),
      });
    }

    const allCategories = await listActiveDonationCategories();
    const category = await getDonationCategoryById(validated.categoryId!);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const result = await generateFlyer({
      theme: validated.theme,
      category,
      allCategories,
    });

    return NextResponse.json({
      ...result,
      theme: validated.theme,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message.includes("required") || message.includes("missing")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
