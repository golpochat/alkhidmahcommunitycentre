import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { findValidStaffInvitation } from "@/lib/staff-invitation-tokens";
import { acceptStaffInvitationSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = acceptStaffInvitationSchema.parse(body);

    const result = await findValidStaffInvitation(token);

    if (!result) {
      return NextResponse.json(
        { error: "This invitation link is invalid or has already been used" },
        { status: 400 }
      );
    }

    if (result.expired) {
      return NextResponse.json(
        { error: "This invitation link has expired. Ask your administrator to resend the invitation." },
        { status: 400 }
      );
    }

    const { invitation } = result;

    const existingUser = await db.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      await db.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: invitation.email,
          name: invitation.name,
          roleId: invitation.roleId,
          passwordHash,
          isActive: true,
        },
      });

      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
