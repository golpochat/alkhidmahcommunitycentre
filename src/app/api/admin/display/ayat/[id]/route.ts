import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireDisplayAdminSession } from "@/lib/display-admin-auth";
import { refreshAyatCache } from "@/lib/display-api";
import { syncDisplayPanelForAyat } from "@/lib/display-section-sync";
import { ayahRotationUpdateSchema } from "@/lib/validations";

function serializeAyah(item: {
  id: string;
  arabic: string;
  english: string;
  source: string;
  includeInRotation: boolean;
  createdAt: Date;
}) {
  return {
    id: item.id,
    arabic: item.arabic,
    english: item.english,
    source: item.source,
    includeInRotation: item.includeInRotation,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireDisplayAdminSession();
    const body = await request.json();
    const validated = ayahRotationUpdateSchema.parse(body);

    const existing = await db.ayahRotation.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const item = await db.ayahRotation.update({
      where: { id: params.id },
      data: {
        ...(validated.arabic !== undefined
          ? { arabic: validated.arabic.trim() }
          : {}),
        ...(validated.english !== undefined
          ? { english: validated.english.trim() }
          : {}),
        ...(validated.source !== undefined
          ? { source: validated.source.trim() }
          : {}),
        ...(validated.includeInRotation !== undefined
          ? { includeInRotation: validated.includeInRotation }
          : {}),
      },
    });

    await refreshAyatCache();
    await syncDisplayPanelForAyat();
    return NextResponse.json(serializeAyah(item));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Entry not found"
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
    await db.ayahRotation.delete({ where: { id: params.id } });
    await refreshAyatCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
