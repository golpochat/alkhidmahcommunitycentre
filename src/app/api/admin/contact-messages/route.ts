import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contactMessagesToCsv,
  serializeContactMessage,
} from "@/lib/contact-messages";
import { requirePermission, PERMISSIONS } from "@/lib/auth";

function buildStatusFilter(status: string | null) {
  if (status === "pending" || status === "handled") {
    return { status };
  }
  return {};
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.contact.manage);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const rows = await db.contactMessage.findMany({
      where: buildStatusFilter(status),
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rows.map(serializeContactMessage));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.contact.manage);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const rows = await db.contactMessage.findMany({
      where: buildStatusFilter(status),
      orderBy: { createdAt: "desc" },
    });

    const csv = contactMessagesToCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="contact-messages.csv"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
