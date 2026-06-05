import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { isPasswordMask } from "@/lib/encryption";
import {
  deleteSmtpEmailSetting,
  getPublicSmtpEmailSetting,
  updateSmtpEmailSetting,
} from "@/lib/email-settings-store";
import { smtpEmailSettingSchema } from "@/lib/validations";

function getErrorStatus(message: string) {
  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message === "Email setting not found") {
    return 404;
  }

  return 400;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const setting = await getPublicSmtpEmailSetting(params.id);
    if (!setting) {
      return NextResponse.json({ error: "Email setting not found" }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const body = await request.json();
    const validated = smtpEmailSettingSchema.parse(body);

    const setting = await updateSmtpEmailSetting(params.id, {
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
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    await deleteSmtpEmailSetting(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
