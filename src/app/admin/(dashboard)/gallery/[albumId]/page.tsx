import { redirect } from "next/navigation";
import { AdminGalleryAlbumDetail } from "@/components/admin/admin-gallery-album-detail";
import { getFreshSession, canAccessAdminRoutes } from "@/lib/auth";

export default async function AdminGalleryAlbumPage({
  params,
}: {
  params: { albumId: string };
}) {
  const session = await getFreshSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  return <AdminGalleryAlbumDetail albumId={params.albumId} />;
}
