export const GALLERY_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "ramadan", label: "Ramadan" },
  { value: "eid", label: "Eid" },
  { value: "classes", label: "Education" },
  { value: "youth", label: "Youth" },
  { value: "community", label: "Community" },
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]["value"];

export interface SerializedGalleryAlbum {
  id: string;
  name: string;
  photoCount: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedGalleryItem {
  id: string;
  albumId: string;
  albumName: string;
  title: string | null;
  category: string | null;
  imageUrl: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function serializeGalleryAlbum(
  album: {
    id: string;
    name: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { items: number };
  }
): SerializedGalleryAlbum {
  return {
    id: album.id,
    name: album.name,
    photoCount: album._count?.items ?? 0,
    published: album.published,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  };
}

export function serializeGalleryItem(item: {
  id: string;
  albumId: string;
  title: string | null;
  category: string | null;
  imageUrl: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  album?: { id: string; name: string };
}): SerializedGalleryItem {
  return {
    id: item.id,
    albumId: item.albumId,
    albumName: item.album?.name ?? "",
    title: item.title,
    category: item.category,
    imageUrl: item.imageUrl,
    published: item.published,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function getGalleryCategoryLabel(category: string | null | undefined) {
  if (!category) return "Uncategorised";
  const match = GALLERY_CATEGORIES.find(
    (item) => item.value === category.toLowerCase()
  );
  return match?.label ?? category;
}

export function normalizeAlbumName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}
