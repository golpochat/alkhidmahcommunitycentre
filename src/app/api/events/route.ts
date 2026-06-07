import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  canManageEvents,
  getSession,
  requirePermission,
  PERMISSIONS,
} from "@/lib/auth";
import {
  assertUniqueEventTitle,
  generateUniqueEventSlug,
} from "@/lib/events-server";
import { serializeEvent } from "@/lib/events";
import { eventFormSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const includePast = searchParams.get("includePast") === "true";
    const now = new Date();
    const session = await getSession();
    const canViewUnpublished = session ? canManageEvents(session) : false;

    const events = await db.event.findMany({
      where: {
        ...(canViewUnpublished ? {} : { published: true }),
        ...(includePast ? {} : { startAt: { gte: now } }),
        ...(category && category !== "all"
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(events.map(serializeEvent));
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.events.manage);

    const body = await request.json();
    const validated = eventFormSchema.parse(body);

    await assertUniqueEventTitle(validated.title);
    const slug = await generateUniqueEventSlug(validated.title);

    const event = await db.event.create({
      data: {
        title: validated.title.trim(),
        slug,
        description: validated.description,
        category: validated.category ?? null,
        startAt: new Date(validated.startAt),
        endAt: validated.endAt ? new Date(validated.endAt) : null,
        location: validated.location ?? null,
        imageUrl: validated.imageUrl ?? null,
        publishAt: validated.publishAt ? new Date(validated.publishAt) : null,
        unpublishAt: validated.unpublishAt ? new Date(validated.unpublishAt) : null,
      },
    });

    return NextResponse.json(serializeEvent(event), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    if (message === "An event with this title already exists") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

