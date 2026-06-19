import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendContactAutoReply, sendContactEmail } from "@/lib/email";
import { contactFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = contactFormSchema.parse(body);

    await db.contactMessage.create({
      data: {
        name: validated.name,
        email: validated.email,
        subject: validated.subject,
        message: validated.message,
        privacyConsentAt: new Date(),
      },
    });

    console.info("[Contact] New message received:", {
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
    });

    const [staffNotified, autoReplySent] = await Promise.all([
      sendContactEmail(validated),
      sendContactAutoReply(validated),
    ]);

    if (!staffNotified) {
      console.warn(
        "[Contact] Message saved but staff notification email was not sent."
      );
    }

    if (!autoReplySent) {
      console.warn(
        "[Contact] Message saved but visitor auto-reply email was not sent."
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: staffNotified && autoReplySent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
