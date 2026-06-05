import { GalleryPageContent } from "@/components/gallery/gallery-page-content";
import { getAllGallery, getGalleryAlbums } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(
  "Gallery",
  `Browse photos from prayer, events, and community life at ${SITE_NAME}.`
);

export default async function GalleryPage() {
  const [images, albums] = await Promise.all([getAllGallery(), getGalleryAlbums()]);
  return <GalleryPageContent images={images} albums={albums} />;
}
