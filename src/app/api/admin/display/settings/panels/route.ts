import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import { serializeDisplaySettings } from "@/lib/display-settings";
import {
  applyMasterDisplayPanelToggle,
} from "@/lib/display-section-sync";
import {
  DISPLAY_PANEL_AYAT_HADITH,
  DISPLAY_PANEL_NORMAL_MESSAGES,
  DISPLAY_PANEL_PRIORITY_MESSAGES,
  DISPLAY_PANEL_WEATHER,
} from "@/lib/display-settings-types";

const displayPanelPatchSchema = z.object({
  panel: z.enum([
    DISPLAY_PANEL_WEATHER,
    DISPLAY_PANEL_PRIORITY_MESSAGES,
    DISPLAY_PANEL_NORMAL_MESSAGES,
    DISPLAY_PANEL_AYAT_HADITH,
  ]),
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireDisplayAdminSession();
    const body = await request.json();
    const { panel, enabled } = displayPanelPatchSchema.parse(body);
    const { settings, enabledItemCount } = await applyMasterDisplayPanelToggle(
      panel,
      enabled,
    );

    return NextResponse.json({
      ...serializeDisplaySettings(settings),
      enabledItemCount,
    });
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
