import { NextRequest, NextResponse } from "next/server";
import { getRenderedLegalPolicyBySlug, isLegalPolicySlug } from "@/lib/legal-policies";

interface RouteParams {
  params: { slug: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    if (!isLegalPolicySlug(params.slug)) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const policy = await getRenderedLegalPolicyBySlug(params.slug, {
      publishedOnly: true,
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch {
    return NextResponse.json({ error: "Failed to load policy" }, { status: 500 });
  }
}
