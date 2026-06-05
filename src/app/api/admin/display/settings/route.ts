import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canManagePrayerTimes, getSession } from "@/lib/auth";
import {
  ensureDisplaySettings,
  serializeDisplaySettings,
} from "@/lib/display-settings";
import { displaySettingsSchema } from "@/lib/validations";

async function requireDisplayAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!canManagePrayerTimes(session)) throw new Error("Forbidden");
  return session;
}

export async function GET() {
  try {
    await requireDisplayAdmin();
    const settings = await ensureDisplaySettings();
    return NextResponse.json(serializeDisplaySettings(settings));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireDisplayAdmin();
    const body = await request.json();
    const validated = displaySettingsSchema.parse(body);
    const existing = await ensureDisplaySettings();

    const brightnessSchedule =
      validated.brightnessSchedule != null
        ? (validated.brightnessSchedule as Prisma.InputJsonValue)
        : Prisma.DbNull;

    const settings = await db.displaySettings.update({
      where: { id: existing.id },
      data: {
        rotationSpeed: validated.rotationSpeed,
        enabledPanels: validated.enabledPanels,
        theme: validated.theme,
        pinCode: validated.pinCode ?? null,
        brightnessSchedule,
      },
    });

    return NextResponse.json(serializeDisplaySettings(settings));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
