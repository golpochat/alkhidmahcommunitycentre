import { NextRequest, NextResponse } from "next/server";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import { maintainDisplaySections, syncDisplayPanelForMessages, getSerializedDisplaySettings } from "@/lib/display-section-sync";
import {
  createMessage,
  listAllMessages,
} from "@/lib/messages";
import { messageCreateSchema } from "@/lib/validations";

function mapMessageInput(validated: ReturnType<typeof messageCreateSchema.parse>) {
  return {
    title: validated.title.trim(),
    body: validated.body.trim(),
    state: validated.state,
    status: validated.status,
    includeInRotation: validated.includeInRotation,
    durationSeconds: validated.durationSeconds,
    priorityOrder: validated.priorityOrder ?? null,
    normalOrder: validated.normalOrder ?? null,
    startsAt: validated.startsAt ? new Date(validated.startsAt) : null,
    endsAt: validated.endsAt ? new Date(validated.endsAt) : null,
  };
}

export async function GET() {
  try {
    await requireDisplayAdminSession();
    await maintainDisplaySections();
    const [messages, settings] = await Promise.all([
      listAllMessages(),
      getSerializedDisplaySettings(),
    ]);
    return NextResponse.json({
      messages,
      enabledPanels: settings.enabledPanels,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireDisplayAdminSession();
    const body = await request.json();
    const validated = messageCreateSchema.parse(body);
    const message = await createMessage(mapMessageInput(validated));
    await syncDisplayPanelForMessages(message.state);
    return NextResponse.json(message, { status: 201 });
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
