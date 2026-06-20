import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import { syncDisplayPanelForMessages } from "@/lib/display-section-sync";
import { updateMessage } from "@/lib/messages";
import { validateMessageScheduleValues } from "@/lib/message-validation";
import { messageUpdateSchema } from "@/lib/validations";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireDisplayAdminSession();
    const body = await request.json();
    const validated = messageUpdateSchema.parse(body);

    const existing = await db.message.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const nextState = validated.state ?? existing.state;
    const nextStartsAt =
      validated.startsAt !== undefined
        ? validated.startsAt
          ? new Date(validated.startsAt)
          : null
        : existing.startsAt;
    const nextEndsAt =
      validated.endsAt !== undefined
        ? validated.endsAt
          ? new Date(validated.endsAt)
          : null
        : existing.endsAt;

    validateMessageScheduleValues({
      state: nextState,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
    });

    const message = await updateMessage(params.id, {
      ...(validated.title !== undefined
        ? { title: validated.title.trim() }
        : {}),
      ...(validated.body !== undefined ? { body: validated.body.trim() } : {}),
      ...(validated.state !== undefined ? { state: validated.state } : {}),
      ...(validated.status !== undefined ? { status: validated.status } : {}),
      ...(validated.includeInRotation !== undefined
        ? { includeInRotation: validated.includeInRotation }
        : {}),
      ...(validated.durationSeconds !== undefined
        ? { durationSeconds: validated.durationSeconds }
        : {}),
      ...(validated.priorityOrder !== undefined
        ? { priorityOrder: validated.priorityOrder }
        : {}),
      ...(validated.normalOrder !== undefined
        ? { normalOrder: validated.normalOrder }
        : {}),
      ...(validated.startsAt !== undefined ? { startsAt: nextStartsAt } : {}),
      ...(validated.endsAt !== undefined ? { endsAt: nextEndsAt } : {}),
    });

    await syncDisplayPanelForMessages(message.state);

    return NextResponse.json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Message not found"
            ? 404
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireDisplayAdminSession();
    await db.message.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
