import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import {
  canManageGallery,
  getSession,
  requirePermission,
  PERMISSIONS,
} from "@/lib/auth";
import { serializeGalleryItem } from "@/lib/gallery";
import { gallerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const albumId = searchParams.get("albumId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const session = await getSession();
    const canViewUnpublished = session ? canManageGallery(session) : false;

    const items = await db.galleryItem.findMany({
      where: {
        ...(canViewUnpublished ? {} : { published: true, album: { published: true } }),
        ...(albumId ? { albumId } : {}),
        ...(category && category !== "all"
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { album: { select: { id: true, name: true } } },
      ...(limit ? { take: limit } : {}),
    });

    return NextResponse.json(items.map(serializeGalleryItem));
  } catch {
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.gallery.manage);

    const body = await request.json();
    const validated = gallerySchema.parse(body);

    const album = await db.galleryAlbum.findUnique({
      where: { id: validated.albumId },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const item = await db.galleryItem.create({
      data: {
        albumId: validated.albumId,
        title: validated.title ?? null,
        category: validated.category ?? null,
        imageUrl: validated.imageUrl,
      },
      include: { album: { select: { id: true, name: true } } },
    });

    return NextResponse.json(serializeGalleryItem(item), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Invalid data";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

