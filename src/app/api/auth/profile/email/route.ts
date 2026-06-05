import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFreshSession } from "@/lib/auth";
import {
  createEmailChangeToken,
  getSiteUrl,
} from "@/lib/auth-tokens";
import { sendEmailChangeVerificationEmail } from "@/lib/email";
import { isEmailConfigured } from "@/lib/email-service";
import { requestEmailChangeSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const session = await getFreshSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newEmail } = requestEmailChangeSchema.parse(body);
    const normalizedEmail = newEmail.toLowerCase();

    if (normalizedEmail === session.email.toLowerCase()) {
      return NextResponse.json(
        { error: "That is already your current email address" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "That email address is already in use" },
        { status: 400 }
      );
    }

    const token = await createEmailChangeToken(session.id, normalizedEmail);
    const verifyUrl = `${getSiteUrl()}/verify-email?token=${token}`;

    const sendResult = await sendEmailChangeVerificationEmail({
      email: normalizedEmail,
      name: session.name,
      verifyUrl,
    });

    if (sendResult === "failed") {
      const configured = await isEmailConfigured();
      return NextResponse.json(
        {
          error: configured
            ? "Unable to send verification email. Please check your SMTP settings and try again."
            : "Email is not configured. Add SMTP details under Settings → Email Settings, then try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        sendResult === "fallback"
          ? "SMTP delivery failed in development mode. Verification link was printed to the dev terminal."
          : "A verification link has been sent to your new email address.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
