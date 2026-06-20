"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGalleryCategoryLabel } from "@/lib/gallery";
import type { SerializedGalleryItem } from "@/lib/gallery";
import { cn } from "@/lib/utils";

interface LightboxProps {
  items: SerializedGalleryItem[];
  index: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectIndex?: (index: number) => void;
}

export function Lightbox({
  items,
  index,
  onClose,
  onPrevious,
  onNext,
  onSelectIndex,
}: LightboxProps) {
  const item = items[index];
  const touchStartX = useRef<number | null>(null);
  const hasMultiple = items.length > 1;

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (!hasMultiple) {
        return;
      }
      if (event.key === "ArrowLeft") {
        onPrevious();
      }
      if (event.key === "ArrowRight") {
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, onClose, onNext, onPrevious]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery image viewer"
      onClick={handleBackdropClick}
    >
      <div className="gallery-lightbox-backdrop" aria-hidden="true" />

      <header className="gallery-lightbox-toolbar">
        <div className="gallery-lightbox-toolbar-meta">
          {item.category ? (
            <Badge
              variant="outline"
              className="border-gold/40 bg-gold/10 text-gold"
            >
              {getGalleryCategoryLabel(item.category)}
            </Badge>
          ) : null}
          {hasMultiple ? (
            <span className="gallery-lightbox-counter">
              {index + 1} / {items.length}
            </span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="gallery-lightbox-close"
          onClick={onClose}
          aria-label="Close gallery viewer"
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="gallery-lightbox-stage">
        {hasMultiple ? (
          <Button
            variant="ghost"
            size="icon"
            className="gallery-lightbox-nav gallery-lightbox-nav-prev"
            onClick={onPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-7 w-7" />
          </Button>
        ) : null}

        <figure
          className="gallery-lightbox-figure"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (!hasMultiple || touchStartX.current === null) {
              return;
            }

            const delta =
              (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            touchStartX.current = null;

            if (Math.abs(delta) < 48) {
              return;
            }

            if (delta > 0) {
              onPrevious();
            } else {
              onNext();
            }
          }}
        >
          <div className="gallery-lightbox-image-wrap">
            <Image
              key={item.id}
              src={item.imageUrl}
              alt={item.title || "Gallery image"}
              fill
              className="gallery-lightbox-image"
              sizes="(max-width: 768px) 100vw, 90vw"
              priority
            />
          </div>

          <figcaption className="gallery-lightbox-caption">
            {item.title ? (
              <h3 className="gallery-lightbox-title">{item.title}</h3>
            ) : null}
            {item.albumName ? (
              <p className="gallery-lightbox-album">{item.albumName}</p>
            ) : null}
          </figcaption>
        </figure>

        {hasMultiple ? (
          <Button
            variant="ghost"
            size="icon"
            className="gallery-lightbox-nav gallery-lightbox-nav-next"
            onClick={onNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-7 w-7" />
          </Button>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="gallery-lightbox-thumbs" role="tablist" aria-label="Gallery thumbnails">
          {items.map((thumb, thumbIndex) => (
            <button
              key={thumb.id}
              type="button"
              role="tab"
              aria-selected={thumbIndex === index}
              aria-label={thumb.title || `Image ${thumbIndex + 1}`}
              className={cn(
                "gallery-lightbox-thumb",
                thumbIndex === index && "gallery-lightbox-thumb-active",
              )}
              onClick={() => onSelectIndex?.(thumbIndex)}
            >
              <Image
                src={thumb.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
