import { NextResponse } from "next/server";
import { listPublishedLegalPolicies } from "@/lib/legal-policies";

export async function GET() {
  try {
    const policies = await listPublishedLegalPolicies();
    return NextResponse.json(policies);
  } catch {
    return NextResponse.json({ error: "Failed to load policies" }, { status: 500 });
  }
}
