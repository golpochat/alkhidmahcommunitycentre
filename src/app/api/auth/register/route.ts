import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getRoleIdBySlug } from "@/lib/seed-rbac";
import { MEMBER_ROLE_SLUG } from "@/lib/rbac-seed";
import {
  createEmailVerificationToken,
  getSiteUrl,
} from "@/lib/auth-tokens";
import { sendRegistrationVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const existing = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const memberRoleId = await getRoleIdBySlug(db, MEMBER_ROLE_SLUG);
    const passwordHash = await bcrypt.hash(validated.password, 12);
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        passwordHash,
        roleId: memberRoleId,
        emailVerified: false,
        privacyConsentAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = await createEmailVerificationToken(user.id);
    const verifyUrl = `${getSiteUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    await sendRegistrationVerificationEmail({
      email: user.email,
      name: user.name,
      verifyUrl,
    });

    return NextResponse.json({
      success: true,
      verifyRequired: true,
      email: user.email,
      redirect: `/register/check-email?email=${encodeURIComponent(user.email)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }
}
