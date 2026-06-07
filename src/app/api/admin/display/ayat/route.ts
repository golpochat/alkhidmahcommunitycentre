import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import { refreshAyatCache } from "@/lib/display-api";
import { ayahRotationSchema } from "@/lib/validations";

function serializeAyah(item: {
  id: string;
  arabic: string;
  english: string;
  source: string;
  createdAt: Date;
}) {
  return {
    id: item.id,
    arabic: item.arabic,
    english: item.english,
    source: item.source,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    await requireDisplayAdminSession();
    const items = await db.ayahRotation.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(items.map(serializeAyah));
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
    const validated = ayahRotationSchema.parse(body);

    const item = await db.ayahRotation.create({
      data: {
        arabic: validated.arabic.trim(),
        english: validated.english.trim(),
        source: validated.source.trim(),
      },
    });

    await refreshAyatCache();
    return NextResponse.json(serializeAyah(item), { status: 201 });
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
