import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { isPasswordMask } from "@/lib/encryption";
import {
  createSmtpEmailSetting,
  listPublicSmtpEmailSettings,
} from "@/lib/email-settings-store";
import { smtpEmailSettingSchema } from "@/lib/validations";

function getErrorStatus(message: string) {
  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message.includes("database model is unavailable")) {
    return 503;
  }

  return 400;
}

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const settings = await listPublicSmtpEmailSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const body = await request.json();
    const validated = smtpEmailSettingSchema.parse(body);

    const setting = await createSmtpEmailSetting({
      provider: validated.provider,
      smtpHost: validated.smtpHost,
      smtpPort: validated.smtpPort,
      encryption: validated.encryption,
      smtpUsername: validated.smtpUsername,
      smtpPassword: isPasswordMask(validated.smtpPassword)
        ? undefined
        : validated.smtpPassword,
      fromEmail: validated.fromEmail,
      fromName: validated.fromName,
      isDefault: validated.isDefault,
    });

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
