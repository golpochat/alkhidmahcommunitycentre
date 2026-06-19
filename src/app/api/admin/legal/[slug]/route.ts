import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { logContentPublishAction } from "@/lib/content-audit-log";
import {
  applyLegalPolicyPlaceholders,
  getLegalPolicyBySlug,
  getLegalPolicyPlaceholders,
  isLegalPolicySlug,
  saveLegalPolicy,
} from "@/lib/legal-policies";
import { legalPolicyUpdateSchema } from "@/lib/validations";

interface RouteParams {
  params: { slug: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(PERMISSIONS.legal.manage);

    if (!isLegalPolicySlug(params.slug)) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const policy = await getLegalPolicyBySlug(params.slug);
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const placeholders = await getLegalPolicyPlaceholders();
    return NextResponse.json({
      ...policy,
      renderedContent: applyLegalPolicyPlaceholders(policy.content, placeholders),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load policy";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requirePermission(PERMISSIONS.legal.manage);

    if (!isLegalPolicySlug(params.slug)) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = legalPolicyUpdateSchema.parse(body);
    const previous = await getLegalPolicyBySlug(params.slug);

    const saved = await saveLegalPolicy(params.slug, validated);

    if (!previous || previous.published !== saved.published) {
      await logContentPublishAction({
        entityType: "legal_policy",
        entityId: saved.id,
        entityTitle: saved.title,
        published: saved.published,
        actorEmail: session.email,
      });
    }

    const placeholders = await getLegalPolicyPlaceholders();
    return NextResponse.json({
      ...saved,
      renderedContent: applyLegalPolicyPlaceholders(saved.content, placeholders),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
