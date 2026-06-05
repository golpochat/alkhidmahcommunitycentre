"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { resolveGalleryImageUrl } from "@/lib/images";
import type { SerializedGalleryItem } from "@/lib/gallery";
import { cn } from "@/lib/utils";

interface GalleryItemProps {
  item: SerializedGalleryItem;
  onClick: () => void;
  priority?: boolean;
}

export function GalleryItemCard({ item, onClick, priority = false }: GalleryItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const imageSrc = resolveGalleryImageUrl(
    item.imageUrl,
    item.category,
    item.title
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={item.title || "View gallery image"}
      className={cn(
        "gallery-masonry-item gallery-fade-in gallery-image-card group image-frame-card relative block w-full text-left focus:outline-none focus:ring-2 focus:ring-gold"
      )}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-square">
        <Image
          src={imageSrc}
          alt={item.title || "Gallery image"}
          fill
          priority={priority}
          className="object-cover brightness-105 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>
      {(item.title || item.albumName) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mosque-black/85 via-mosque-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100">
          {item.title && (
            <p className="font-heading text-sm font-semibold text-white">
              {item.title}
            </p>
          )}
          {item.albumName && (
            <p className="text-xs text-gold">{item.albumName}</p>
          )}
        </div>
      )}
    </button>
  );
}
