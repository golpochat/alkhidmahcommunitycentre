import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import {
  assertUniqueEventTitle,
  generateUniqueEventSlug,
} from "@/lib/events-server";
import { serializeEvent } from "@/lib/events";
import { eventFormSchema, eventPublishSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await db.event.findUnique({ where: { id: params.id } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(serializeEvent(event));
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.events.manage);

    const existing = await db.event.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = eventFormSchema.parse(body);

    await assertUniqueEventTitle(validated.title, params.id);

    const titleChanged =
      validated.title.trim().toLowerCase() !== existing.title.trim().toLowerCase();
    const slug = titleChanged
      ? await generateUniqueEventSlug(validated.title, params.id)
      : existing.slug;

    const event = await db.event.update({
      where: { id: params.id },
      data: {
        title: validated.title.trim(),
        slug,
        description: validated.description,
        category: validated.category ?? null,
        startAt: new Date(validated.startAt),
        endAt: validated.endAt ? new Date(validated.endAt) : null,
        location: validated.location ?? null,
        imageUrl: validated.imageUrl ?? null,
      },
    });

    return NextResponse.json(serializeEvent(event));
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.events.manage);

    const existing = await db.event.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { published } = eventPublishSchema.parse(body);

    const event = await db.event.update({
      where: { id: params.id },
      data: { published },
    });

    return NextResponse.json(serializeEvent(event));
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.events.delete);

    await db.event.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
