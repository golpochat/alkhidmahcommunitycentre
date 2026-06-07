import { NextRequest, NextResponse } from "next/server";
import { AccountTier } from "@prisma/client";
import { db } from "@/lib/db";
import {
  createEmailVerificationToken,
  getSiteUrl,
} from "@/lib/auth-tokens";
import { sendRegistrationVerificationEmail } from "@/lib/email";
import { resendVerificationSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: { select: { tier: true } },
      },
    });

    if (!user || user.role.tier !== AccountTier.MEMBER || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = await createEmailVerificationToken(user.id);
    const verifyUrl = `${getSiteUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    await sendRegistrationVerificationEmail({
      email: user.email,
      name: user.name,
      verifyUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
