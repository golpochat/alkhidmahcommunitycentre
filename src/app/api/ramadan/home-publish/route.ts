import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getRamadanTimetableHomePublishState,
  setRamadanTimetableHomePublished,
} from "@/lib/ramadan-timetable";
import { requireTimetableAdmin } from "@/lib/timetable-api-auth";

const publishSchema = z.object({
  published: z.boolean(),
});

export async function GET() {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  const state = await getRamadanTimetableHomePublishState();
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const auth = await requireTimetableAdmin();
  if (auth.error) return auth.error;

  try {
    const body = publishSchema.parse(await request.json());
    const current = await getRamadanTimetableHomePublishState();

    if (body.published && !current.hasData) {
      return NextResponse.json(
        { error: "Load and save a Ramadan timetable before publishing to the homepage." },
        { status: 400 },
      );
    }

    await setRamadanTimetableHomePublished(body.published);
    const state = await getRamadanTimetableHomePublishState();
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
