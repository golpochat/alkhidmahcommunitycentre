import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import { updateMessageOrder } from "@/lib/messages";
import { messageOrderSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireDisplayAdminSession();
    const body = await request.json();
    const validated = messageOrderSchema.parse(body);

    const existing = await db.message.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (
      validated.priorityOrder !== undefined &&
      existing.state !== "PRIORITY"
    ) {
      return NextResponse.json(
        { error: "priorityOrder applies only to PRIORITY messages" },
        { status: 400 },
      );
    }

    if (
      validated.normalOrder !== undefined &&
      existing.state !== "NON_PRIORITY"
    ) {
      return NextResponse.json(
        { error: "normalOrder applies only to NON_PRIORITY messages" },
        { status: 400 },
      );
    }

    const message = await updateMessageOrder(params.id, validated);
    return NextResponse.json(message);
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
