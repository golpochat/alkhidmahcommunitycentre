import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { getRecentGallery } from "@/lib/queries";
import { getGalleryCategoryLabel } from "@/lib/gallery";
import { SITE_NAME } from "@/lib/constants";

export async function GalleryPreview() {
  const recentImages = await getRecentGallery(8);

  if (recentImages.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-secondary/30">
      <div className="section-container">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-4 border-gold text-gold">
              Gallery
            </Badge>
            <h2 className="heading-section">Moments at {SITE_NAME}</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Glimpses of prayer, community, and celebration at our centre.
            </p>
          </div>
          <ButtonLink
            href="/gallery"
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-mosque-black"
          >
            View Full Gallery
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>

        <div className="gallery-masonry">
          {recentImages.map((item, index) => (
            <Link
              key={item.id}
              href="/gallery"
              className="gallery-masonry-item gallery-image-card group image-frame-card relative block overflow-hidden rounded-lg"
            >
              <div
                className={`relative w-full ${
                  index % 5 === 0 ? "aspect-[4/5]" : "aspect-square"
                }`}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Gallery image"}
                  fill
                  className="object-cover brightness-105 transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 20vw"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mosque-black/80 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {item.title && (
                  <p className="font-heading text-sm font-semibold text-white">
                    {item.title}
                  </p>
                )}
                {item.category && (
                  <p className="text-xs text-gold">
                    {getGalleryCategoryLabel(item.category)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
