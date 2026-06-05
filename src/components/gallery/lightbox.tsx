"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGalleryCategoryLabel } from "@/lib/gallery";
import type { SerializedGalleryItem } from "@/lib/gallery";

interface LightboxProps {
  items: SerializedGalleryItem[];
  index: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function Lightbox({
  items,
  index,
  onClose,
  onPrevious,
  onNext,
}: LightboxProps) {
  const item = items[index];

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mosque-black/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery lightbox"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 border border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-light"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
        onClick={onPrevious}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
        onClick={onNext}
        aria-label="Next image"
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="max-h-[85vh] w-full max-w-5xl">
        <div className="relative aspect-video max-h-[70vh] w-full">
          <Image
            src={item.imageUrl}
            alt={item.title || "Gallery image"}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
        <div className="mt-4 text-center text-white">
          {item.title && (
            <h3 className="font-heading text-xl font-semibold">{item.title}</h3>
          )}
          {item.category && (
            <p className="mt-1 text-sm text-gold">
              {getGalleryCategoryLabel(item.category)}
            </p>
          )}
          <p className="mt-2 text-xs text-neutral-400">
            {index + 1} of {items.length}
          </p>
        </div>
      </div>
    </div>
  );
}
