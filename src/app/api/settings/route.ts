import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/settings";

const EMAIL_SETTING_KEYS = new Set<string>([
  SETTING_KEYS.smtpHost,
  SETTING_KEYS.smtpPort,
  SETTING_KEYS.smtpSecure,
  SETTING_KEYS.smtpUser,
  SETTING_KEYS.smtpPass,
  SETTING_KEYS.smtpFrom,
  SETTING_KEYS.notificationEmail,
]);

const PAYMENT_SETTING_KEYS = new Set<string>([
  SETTING_KEYS.stripeEnabled,
  SETTING_KEYS.stripePublishableKey,
  SETTING_KEYS.stripeSecretKey,
  SETTING_KEYS.stripeWebhookSecret,
  SETTING_KEYS.paypalEnabled,
  SETTING_KEYS.paypalClientId,
  SETTING_KEYS.paypalClientSecret,
  SETTING_KEYS.paypalMode,
  SETTING_KEYS.donationCurrency,
]);

function isManagedElsewhere(key: string) {
  return EMAIL_SETTING_KEYS.has(key) || PAYMENT_SETTING_KEYS.has(key);
}

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const settings = await db.setting.findMany({ orderBy: { key: "asc" } });
    const map = {
      ...DEFAULT_SETTINGS,
      ...Object.fromEntries(
        settings
          .filter((setting) => !isManagedElsewhere(setting.key))
          .map((setting) => [setting.key, setting.value])
      ),
    };

    return NextResponse.json(map);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      if (isManagedElsewhere(key)) {
        continue;
      }

      await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
