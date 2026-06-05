import { NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { setDefaultSmtpEmailSetting } from "@/lib/email-settings-store";

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

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const setting = await setDefaultSmtpEmailSetting(params.id);

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
