import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import {
  getActiveDisplayNotices,
  serializeDisplayNotice,
} from "@/lib/display-api";
import { displayNoticeSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireDisplayAdminSession();
    const notices = await getActiveDisplayNotices();
    const all = await db.displayNotice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      active: notices,
      all: all.map(serializeDisplayNotice),
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
    const session = await requireDisplayAdminSession();
    const body = await request.json();
    const validated = displayNoticeSchema.parse(body);

    const notice = await db.displayNotice.create({
      data: {
        title: validated.title.trim(),
        message: validated.message.trim(),
        priority: validated.priority,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        createdById: session.id,
      },
    });

    return NextResponse.json(serializeDisplayNotice(notice), { status: 201 });
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
