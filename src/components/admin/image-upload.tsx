"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { UploadFolder } from "@/lib/upload-image";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  label?: string;
  previewAlt?: string;
  variant?: "landscape" | "square";
}

export function ImageUpload({
  value,
  onChange,
  folder = "events",
  label = "Image",
  previewAlt = "Image preview",
  variant = "landscape",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {value && (
        <div
          className={
            variant === "square"
              ? "relative mx-auto aspect-square w-full max-w-[12rem] overflow-hidden rounded-full border border-border"
              : "relative aspect-video overflow-hidden rounded-lg border border-border"
          }
        >
          <Image
            src={value}
            alt={previewAlt}
            fill
            className="object-cover"
            sizes={variant === "square" ? "192px" : "400px"}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 bg-mosque-black/70 text-white hover:bg-mosque-black"
            onClick={() => onChange("")}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
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
          Upload Image
        </Button>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
