import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManagePrayerTimes, getSession } from "@/lib/auth";
import { serializeDisplayNotice } from "@/lib/display-api";
import { displayNoticeSchema } from "@/lib/validations";

async function requireDisplayAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (!canManagePrayerTimes(session)) throw new Error("Forbidden");
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireDisplayAdmin();
    const body = await request.json();
    const validated = displayNoticeSchema.parse(body);

    const notice = await db.displayNotice.update({
      where: { id: params.id },
      data: {
        title: validated.title.trim(),
        message: validated.message.trim(),
        priority: validated.priority,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
    });

    return NextResponse.json(serializeDisplayNotice(notice));
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
    await requireDisplayAdmin();
    await db.displayNotice.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
