import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDisplaySettings } from "@/lib/display-settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orientation =
      typeof body.orientation === "string" ? body.orientation : null;

    const settings = await ensureDisplaySettings();
    await db.displaySettings.update({
      where: { id: settings.id },
      data: {
        lastSeenAt: new Date(),
        lastOrientation: orientation,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
