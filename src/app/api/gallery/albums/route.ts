import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  canManageGallery,
  getFreshSession,
  requirePermission,
  PERMISSIONS,
} from "@/lib/auth";
import { normalizeAlbumName, serializeGalleryAlbum } from "@/lib/gallery";
import { galleryAlbumSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getFreshSession();
    const canViewUnpublished = session ? canManageGallery(session) : false;

    const albums = await db.galleryAlbum.findMany({
      where: canViewUnpublished ? {} : { published: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(albums.map(serializeGalleryAlbum));
  } catch {
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.gallery.manage);

    const body = await request.json();
    const validated = galleryAlbumSchema.parse(body);
    const name = normalizeAlbumName(validated.name);

    const existing = await db.galleryAlbum.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "An album with this name already exists" },
        { status: 409 }
      );
    }

    const album = await db.galleryAlbum.create({
      data: { name },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(serializeGalleryAlbum(album), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
