"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { GalleryImageUpload } from "@/components/admin/gallery-image-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SerializedGalleryItem } from "@/lib/gallery";

interface GalleryUploadFormProps {
  albumId: string;
  onSuccess?: (items: SerializedGalleryItem[]) => void;
  onCancel?: () => void;
}

function parseApiError(data: { error?: unknown }) {
  if (typeof data.error === "string") {
    try {
      const parsed = JSON.parse(data.error);
      if (Array.isArray(parsed) && parsed[0]?.message) {
        return parsed[0].message as string;
      }
    } catch {
      return data.error;
    }
    return data.error;
  }

  return "Failed to save gallery item";
}

export function GalleryUploadForm({
  albumId,
  onSuccess,
  onCancel,
}: GalleryUploadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);

  function handleFilesUploaded(urls: string[]) {
    setPendingUrls((current) => [...current, ...urls]);
  }

  function removePendingUrl(url: string) {
    setPendingUrls((current) => current.filter((item) => item !== url));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (pendingUrls.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.all(
        pendingUrls.map(async (imageUrl) => {
          const response = await fetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              albumId,
              title: null,
              imageUrl,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(parseApiError(data));
          }

          return data as SerializedGalleryItem;
        })
      );

      toast.success(
        `${results.length} image${results.length === 1 ? "" : "s"} added to album`
      );
      setPendingUrls([]);
      onSuccess?.(results);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GalleryImageUpload multiple onFilesUploaded={handleFilesUploaded} />

      {pendingUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Selected images ({pendingUrls.length})</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pendingUrls.map((url) => (
              <div
                key={url}
                className="gallery-image-card relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={url}
                  alt="Pending upload"
                  fill
                  className="image-card-islamic"
                  sizes="120px"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 border border-gold/40 bg-mosque-black/70 text-gold hover:bg-gold/10"
                  onClick={() => removePendingUrl(url)}
                  aria-label="Remove image from upload queue"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          className="btn-gold"
          disabled={submitting || pendingUrls.length === 0}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save {pendingUrls.length > 0 ? `${pendingUrls.length} ` : ""}to Album
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
