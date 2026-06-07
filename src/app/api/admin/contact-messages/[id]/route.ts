import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serializeContactMessage } from "@/lib/contact-messages";
import { requirePermission, PERMISSIONS } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["pending", "handled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requirePermission(PERMISSIONS.contact.manage);
    const body = patchSchema.parse(await request.json());

    const updated = await db.contactMessage.update({
      where: { id: params.id },
      data: {
        status: body.status,
        handledAt: body.status === "handled" ? new Date() : null,
      },
    });

    return NextResponse.json(serializeContactMessage(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Forbidden" ? 403 : message.includes("Record") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
