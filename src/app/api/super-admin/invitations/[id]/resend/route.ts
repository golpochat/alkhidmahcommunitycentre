import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { resendStaffInvitation } from "@/lib/staff-invitations";
import { isInvitationExpired } from "@/lib/staff-invitation-tokens";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.users.manage);
    const { id } = await params;

    const invitation = await resendStaffInvitation(id);

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      roleId: invitation.roleId,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      isExpired: isInvitationExpired(invitation.expiresAt),
      invitedByEmail: invitation.invitedByEmail,
      createdAt: invitation.createdAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
