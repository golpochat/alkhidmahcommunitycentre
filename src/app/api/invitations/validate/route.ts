import { NextRequest, NextResponse } from "next/server";
import { findValidStaffInvitation } from "@/lib/staff-invitation-tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Invalid invitation link" }, { status: 400 });
  }

  const result = await findValidStaffInvitation(token);

  if (!result) {
    return NextResponse.json(
      { error: "This invitation link is invalid or has already been used" },
      { status: 400 }
    );
  }

  if (result.expired) {
    return NextResponse.json(
      {
        error: "This invitation link has expired",
        expired: true,
        email: result.invitation.email,
        name: result.invitation.name,
        roleName: result.invitation.role.name,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    email: result.invitation.email,
    name: result.invitation.name,
    roleName: result.invitation.role.name,
    expired: false,
  });
}
