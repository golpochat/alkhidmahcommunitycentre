"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { CategoryFilter } from "@/components/gallery/category-filter";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Lightbox } from "@/components/gallery/lightbox";
import type { SerializedGalleryItem } from "@/lib/gallery";
import { IMAGES } from "@/lib/images";
import { SITE_NAME } from "@/lib/constants";

interface GalleryPageContentProps {
  images: SerializedGalleryItem[];
}

function filterByCategory(
  images: SerializedGalleryItem[],
  filter: string,
) {
  if (filter === "all") {
    return images;
  }

  return images.filter(
    (image) => image.category?.toLowerCase() === filter.toLowerCase(),
  );
}

export function GalleryPageContent({ images }: GalleryPageContentProps) {
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredImages = useMemo(
    () => filterByCategory(images, filter),
    [images, filter],
  );

  const selectedIndex = useMemo(() => {
    if (!selectedId) {
      return null;
    }

    const index = filteredImages.findIndex((image) => image.id === selectedId);
    return index >= 0 ? index : null;
  }, [filteredImages, selectedId]);

  const goToPrevious = useCallback(() => {
    if (selectedIndex === null || filteredImages.length <= 1) {
      return;
    }

    const nextIndex =
      selectedIndex === 0 ? filteredImages.length - 1 : selectedIndex - 1;
    setSelectedId(filteredImages[nextIndex]?.id ?? null);
  }, [filteredImages, selectedIndex]);

  const goToNext = useCallback(() => {
    if (selectedIndex === null || filteredImages.length <= 1) {
      return;
    }

    const nextIndex =
      selectedIndex === filteredImages.length - 1 ? 0 : selectedIndex + 1;
    setSelectedId(filteredImages[nextIndex]?.id ?? null);
  }, [filteredImages, selectedIndex]);

  useEffect(() => {
    setSelectedId(null);
  }, [filter]);

  useEffect(() => {
    if (selectedId && selectedIndex === null) {
      setSelectedId(null);
    }
  }, [selectedId, selectedIndex]);

  useEffect(() => {
    if (selectedId) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => document.body.classList.remove("overflow-hidden");
  }, [selectedId]);

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
            <CategoryFilter value={filter} onChange={setFilter} />
          </div>

          <GalleryGrid
            items={filteredImages}
            onItemClick={(item) => setSelectedId(item.id)}
          />
        </div>
      </section>

      {selectedIndex !== null && (
        <Lightbox
          items={filteredImages}
          index={selectedIndex}
          onClose={() => setSelectedId(null)}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onSelectIndex={(index) => setSelectedId(filteredImages[index]?.id ?? null)}
        />
      )}
    </>
  );
}
