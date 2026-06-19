import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import {
  ensureDisplaySettings,
  serializeDisplaySettings,
  weatherEnabledPanels,
} from "@/lib/display-settings";
import { displaySettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireDisplayAdminSession();
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
    await requireDisplayAdminSession();
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
        enabledPanels: weatherEnabledPanels(validated.showWeather),
        pinCode: validated.pinCode ?? null,
        brightnessSchedule,
        orientationOverride: validated.orientationOverride ?? null,
        autoFullscreen: validated.autoFullscreen ?? false,
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
