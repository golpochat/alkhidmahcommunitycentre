"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface GalleryImageUploadProps {
  multiple?: boolean;
  value?: string;
  onChange?: (url: string) => void;
  onFilesUploaded?: (urls: string[]) => void;
}

async function uploadGalleryFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "gallery");

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Upload failed");
  }

  const data = await response.json();
  return data.url as string;
}

export function GalleryImageUpload({
  multiple = false,
  value = "",
  onChange,
  onFilesUploaded,
}: GalleryImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    setUploadCount(0);

    try {
      if (multiple) {
        const urls: string[] = [];
        const fileList = Array.from(files);

        for (const file of fileList) {
          const url = await uploadGalleryFile(file);
          urls.push(url);
          setUploadCount((count) => count + 1);
        }

        onFilesUploaded?.(urls);
        toast.success(
          `${urls.length} image${urls.length === 1 ? "" : "s"} ready to save`
        );
      } else {
        const url = await uploadGalleryFile(files[0]);
        onChange?.(url);
        toast.success("Image uploaded");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
      setUploadCount(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <Label>{multiple ? "Gallery Images" : "Gallery Image"}</Label>

      {!multiple && value && (
        <div className="gallery-image-card relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={value}
            alt="Gallery preview"
            fill
            className="image-card-islamic"
            sizes="400px"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 border border-gold/40 bg-mosque-black/70 text-gold hover:bg-gold/10"
            onClick={() => onChange?.("")}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="border-gold text-gold hover:bg-gold/10"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {uploading && multiple
          ? `Uploading ${uploadCount > 0 ? uploadCount : ""}…`
          : multiple
            ? "Choose Images"
            : "Upload Image"}
      </Button>

      {multiple && (
        <p className="text-xs text-muted-foreground">
          You can select multiple images at once (JPEG, PNG, or WebP, max 5MB each).
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
