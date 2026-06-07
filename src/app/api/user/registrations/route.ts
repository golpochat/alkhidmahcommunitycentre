import { NextResponse } from "next/server";
import {
  listMemberRegistrations,
  serializeMemberRegistration,
} from "@/lib/user-registrations";
import { requireMemberPortalSession } from "@/lib/user-portal-auth";

export async function GET() {
  try {
    const session = await requireMemberPortalSession();
    const registrations = await listMemberRegistrations(session.email);

    return NextResponse.json(registrations.map(serializeMemberRegistration));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load registrations";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
