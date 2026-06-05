import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { serializeRegistration } from "@/lib/classes";

function buildWhere(searchParams: URLSearchParams) {
  const classId = searchParams.get("classId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  return {
    ...(classId && classId !== "all" ? { classId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
          },
        }
      : {}),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.registrations.manage);
    const { searchParams } = new URL(request.url);

    const registrations = await db.registration.findMany({
      where: buildWhere(searchParams),
      include: {
        class: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(registrations.map(serializeRegistration));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.registrations.manage);

    const { searchParams } = new URL(request.url);

    const registrations = await db.registration.findMany({
      where: buildWhere(searchParams),
      include: {
        class: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const csv = [
      "Name,Email,Phone,Class,Notes,Date",
      ...registrations.map(
        (item) =>
          `"${item.name}","${item.email}","${item.phone || ""}","${item.class.title}","${(item.notes || "").replace(/"/g, '""')}",${format(item.createdAt, "yyyy-MM-dd HH:mm")}`
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="registrations.csv"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

