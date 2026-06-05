"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GalleryUploadForm } from "@/components/admin/gallery-upload-form";
import { Lightbox } from "@/components/gallery/lightbox";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SerializedGalleryItem } from "@/lib/gallery";

interface AlbumDetail {
  id: string;
  name: string;
  photoCount: number;
  items: SerializedGalleryItem[];
}

interface AdminGalleryAlbumDetailProps {
  albumId: string;
}

export function AdminGalleryAlbumDetail({ albumId }: AdminGalleryAlbumDetailProps) {
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const loadAlbum = useCallback(async () => {
    setLoading(true);
    try {
      const [albumResponse, sessionResponse] = await Promise.all([
        fetch(`/api/gallery/albums/${albumId}`),
        fetch("/api/auth/session"),
      ]);

      if (albumResponse.ok) {
        const data = await albumResponse.json();
        setAlbum(data);
      } else {
        setAlbum(null);
      }

      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        setCanDelete(Boolean(session.canDeleteGallery));
        setCanManage(Boolean(session.canManageGallery));
      }
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  async function handleDeleteImage(id: string) {
    if (!canDelete) {
      toast.error("You do not have permission to delete images");
      return;
    }

    if (!confirm("Delete this image?")) return;

    const response = await fetch(`/api/gallery/${id}`, { method: "DELETE" });

    if (response.ok) {
      toast.success("Image deleted");
      setPreviewIndex(null);
      setAlbum((current) =>
        current
          ? {
              ...current,
              photoCount: Math.max(0, current.photoCount - 1),
              items: current.items.filter((item) => item.id !== id),
            }
          : current
      );
    } else {
      const data = await response.json();
      toast.error(data.error || "Failed to delete image");
    }
  }

  function handleUploadSuccess(items: SerializedGalleryItem[]) {
    setUploadOpen(false);
    setAlbum((current) =>
      current
        ? {
            ...current,
            photoCount: current.photoCount + items.length,
            items: [...items, ...current.items],
          }
        : current
    );
  }

  const goToPrevious = useCallback(() => {
    if (!album || previewIndex === null) return;
    setPreviewIndex(
      previewIndex === 0 ? album.items.length - 1 : previewIndex - 1
    );
  }, [album, previewIndex]);

  const goToNext = useCallback(() => {
    if (!album || previewIndex === null) return;
    setPreviewIndex(
      previewIndex === album.items.length - 1 ? 0 : previewIndex + 1
    );
  }, [album, previewIndex]);

  useEffect(() => {
    if (previewIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goToPrevious();
      if (event.key === "ArrowRight") goToNext();
      if (event.key === "Escape") setPreviewIndex(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, goToPrevious, goToNext]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!album) {
    return (
      <div>
        <ButtonLink href="/admin/gallery" variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to albums
        </ButtonLink>
        <p className="text-muted-foreground">Album not found.</p>
      </div>
    );
  }

  return (
    <div>
      <ButtonLink href="/admin/gallery" variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to albums
      </ButtonLink>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{album.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {album.photoCount} photo{album.photoCount === 1 ? "" : "s"} in this album
          </p>
        </div>
        {canManage && (
          <Button type="button" className="btn-gold" onClick={() => setUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Images
          </Button>
        )}
      </div>

      {album.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">
            No photos in this album yet.
            {canManage && " Use Upload Images to add one or more."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {album.items.map((item, index) => (
            <div
              key={item.id}
              className="gallery-image-card overflow-hidden rounded-lg border border-border"
            >
              <div className="relative aspect-square">
                <Image
                  src={item.imageUrl}
                  alt="Gallery image"
                  fill
                  className="image-card-islamic"
                  sizes="250px"
                />
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(item.createdAt), "d MMM yyyy")}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border hover:border-gold hover:text-gold"
                    onClick={() => setPreviewIndex(index)}
                  >
                    View
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteImage(item.id)}
                      aria-label="Delete image"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Upload to {album.name}
            </DialogTitle>
          </DialogHeader>
          <GalleryUploadForm
            albumId={album.id}
            onSuccess={handleUploadSuccess}
            onCancel={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {previewIndex !== null && album.items.length > 0 && (
        <Lightbox
          items={album.items}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </div>
  );
}
