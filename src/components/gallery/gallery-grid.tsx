"use client";

import { GalleryItemCard } from "@/components/gallery/gallery-item";
import type { SerializedGalleryItem } from "@/lib/gallery";

interface GalleryGridProps {
  items: SerializedGalleryItem[];
  onItemClick: (item: SerializedGalleryItem) => void;
}

export function GalleryGrid({ items, onItemClick }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">No images found in this category.</p>
      </div>
    );
  }

  return (
    <div className="gallery-masonry">
      {items.map((item, index) => (
        <GalleryItemCard
          key={item.id}
          item={item}
          onClick={() => onItemClick(item)}
          priority={index < 4}
        />
      ))}
    </div>
  );
}
