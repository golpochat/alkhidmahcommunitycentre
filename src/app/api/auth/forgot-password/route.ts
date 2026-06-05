import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createPasswordResetToken,
  getSiteUrl,
} from "@/lib/auth-tokens";
import { sendPasswordResetLinkEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;

      await sendPasswordResetLinkEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
