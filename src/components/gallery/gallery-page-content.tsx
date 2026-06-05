"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { AlbumFilter } from "@/components/gallery/album-filter";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Lightbox } from "@/components/gallery/lightbox";
import type { SerializedGalleryAlbum, SerializedGalleryItem } from "@/lib/gallery";
import { IMAGES } from "@/lib/images";
import { SITE_NAME } from "@/lib/constants";

interface GalleryPageContentProps {
  images: SerializedGalleryItem[];
  albums: SerializedGalleryAlbum[];
}

export function GalleryPageContent({ images, albums }: GalleryPageContentProps) {
  const [filter, setFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filteredImages = useMemo(() => {
    if (filter === "all") return images;
    return images.filter((image) => image.albumId === filter);
  }, [images, filter]);

  const goToPrevious = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === 0 ? filteredImages.length - 1 : selectedIndex - 1
    );
  }, [selectedIndex, filteredImages.length]);

  const goToNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === filteredImages.length - 1 ? 0 : selectedIndex + 1
    );
  }, [selectedIndex, filteredImages.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (selectedIndex === null) return;
      if (event.key === "ArrowLeft") goToPrevious();
      if (event.key === "ArrowRight") goToNext();
      if (event.key === "Escape") setSelectedIndex(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goToPrevious, goToNext]);

  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => document.body.classList.remove("overflow-hidden");
  }, [selectedIndex]);

  return (
    <>
      <PageHero
        badge="Gallery"
        title="Photo Gallery"
        description={`Moments of worship, community, and celebration at ${SITE_NAME}.`}
        image={IMAGES.heroes.gallery}
        imageAlt="Community gallery"
      />

      <section className="section-padding">
        <div className="section-container">
          <div className="mb-8">
            <AlbumFilter albums={albums} value={filter} onChange={setFilter} />
          </div>

          <GalleryGrid
            items={filteredImages}
            onItemClick={(index) => setSelectedIndex(index)}
          />
        </div>
      </section>

      {selectedIndex !== null && (
        <Lightbox
          items={filteredImages}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </>
  );
}
