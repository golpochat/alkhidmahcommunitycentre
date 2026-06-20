import { GalleryPageContent } from "@/components/gallery/gallery-page-content";
import { getAllGallery } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(
  "Gallery",
  `Browse photos from prayer, events, and community life at ${SITE_NAME}.`
);

export default async function GalleryPage() {
  const images = await getAllGallery();
  return <GalleryPageContent images={images} />;
}
