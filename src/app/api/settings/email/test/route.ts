import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email-service";
import { emailTestSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const body = await request.json().catch(() => ({}));
    const { to, settingId } = emailTestSchema.parse(body);
    const result = await sendTestEmail({ to, settingId });

    if (result === "failed") {
      return NextResponse.json(
        { error: "Failed to send test email. Check your SMTP settings." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result === "fallback"
          ? "SMTP delivery failed in development mode. Test email details were printed to the dev terminal."
          : `Test email sent${to ? ` to ${to}` : ""}.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test failed";
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
