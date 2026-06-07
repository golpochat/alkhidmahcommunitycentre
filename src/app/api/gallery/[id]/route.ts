import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { logContentPublishAction } from "@/lib/content-audit-log";
import { serializeGalleryItem } from "@/lib/gallery";
import { publishStatusSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission(PERMISSIONS.gallery.manage);

    const existing = await db.galleryItem.findUnique({
      where: { id: params.id },
      include: { album: { select: { id: true, name: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const body = await request.json();
    const { published } = publishStatusSchema.parse(body);

    const item = await db.galleryItem.update({
      where: { id: params.id },
      data: { published },
      include: { album: { select: { id: true, name: true } } },
    });

    if (existing.published !== published) {
      await logContentPublishAction({
        entityType: "gallery_item",
        entityId: item.id,
        entityTitle: item.title || item.album.name,
        published,
        actorEmail: session.email,
      });
    }

    return NextResponse.json(serializeGalleryItem(item));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.gallery.delete);

    await db.galleryItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
