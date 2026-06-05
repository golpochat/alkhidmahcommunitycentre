import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, requirePermission, PERMISSIONS } from "@/lib/auth";
import { staffInvitationSchema } from "@/lib/validations";
import { createStaffInvitation } from "@/lib/staff-invitations";
import { isInvitationExpired } from "@/lib/staff-invitation-tokens";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.users.manage);

    const invitations = await db.staffInvitation.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        role: {
          select: { id: true, name: true, slug: true, tier: true },
        },
      },
    });

    return NextResponse.json(
      invitations.map((invitation) => ({
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
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.users.manage);
    const session = await getSession();

    const body = await request.json();
    const validated = staffInvitationSchema.parse(body);

    const invitation = await createStaffInvitation({
      email: validated.email,
      name: validated.name,
      roleId: validated.roleId,
      invitedByEmail: session?.email ?? null,
    });

    return NextResponse.json(
      {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        roleId: invitation.roleId,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
        isExpired: false,
        invitedByEmail: invitation.invitedByEmail,
        createdAt: invitation.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden"
        ? 403
        : message.includes("already")
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
