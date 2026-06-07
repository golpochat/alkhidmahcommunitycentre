import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import {
  normalizeAlbumName,
  serializeGalleryAlbum,
  serializeGalleryItem,
} from "@/lib/gallery";
import { galleryAlbumUpdateSchema, publishStatusSchema } from "@/lib/validations";
import { logContentPublishAction } from "@/lib/content-audit-log";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const album = await db.galleryAlbum.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { items: true } },
        items: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...serializeGalleryAlbum(album),
      items: album.items.map((item) =>
        serializeGalleryItem({ ...item, album: { id: album.id, name: album.name } })
      ),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch album" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.gallery.manage);

    const body = await request.json();
    const validated = galleryAlbumUpdateSchema.parse(body);
    const name = normalizeAlbumName(validated.name);

    const existing = await db.galleryAlbum.findFirst({
      where: {
        name,
        NOT: { id: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An album with this name already exists" },
        { status: 409 }
      );
    }

    const album = await db.galleryAlbum.update({
      where: { id: params.id },
      data: { name },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(serializeGalleryAlbum(album));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission(PERMISSIONS.gallery.manage);

    const existing = await db.galleryAlbum.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const body = await request.json();
    const { published } = publishStatusSchema.parse(body);

    const album = await db.galleryAlbum.update({
      where: { id: params.id },
      data: { published },
      include: { _count: { select: { items: true } } },
    });

    if (existing.published !== published) {
      await logContentPublishAction({
        entityType: "gallery_album",
        entityId: album.id,
        entityTitle: album.name,
        published,
        actorEmail: session.email,
      });
    }

    return NextResponse.json(serializeGalleryAlbum(album));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.gallery.delete);

    const album = await db.galleryAlbum.findUnique({
      where: { id: params.id },
      include: { _count: { select: { items: true } } },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const photoCount = album._count.items;

    await db.galleryAlbum.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      photoCount,
      message: `Album "${album.name}" and ${photoCount} photo${
        photoCount === 1 ? "" : "s"
      } deleted`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
