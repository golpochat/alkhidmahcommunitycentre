import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import {
  applyLegalPolicyPlaceholders,
  getLegalPolicyPlaceholders,
  isLegalPolicySlug,
} from "@/lib/legal-policies";
import { z } from "zod";

interface RouteParams {
  params: { slug: string };
}

const previewSchema = z.object({
  content: z.string(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(PERMISSIONS.legal.manage);

    if (!isLegalPolicySlug(params.slug)) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = previewSchema.parse(body);
    const placeholders = await getLegalPolicyPlaceholders();

    return NextResponse.json({
      renderedContent: applyLegalPolicyPlaceholders(content, placeholders),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
