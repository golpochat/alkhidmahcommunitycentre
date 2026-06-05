import { redirect } from "next/navigation";
import { AdminGalleryAlbumDetail } from "@/components/admin/admin-gallery-album-detail";
import { getSession, canAccessAdminRoutes } from "@/lib/auth";

export default async function AdminGalleryAlbumPage({
  params,
}: {
  params: { albumId: string };
}) {
  const session = await getSession();

  if (!session || !canAccessAdminRoutes(session)) {
    redirect("/login");
  }

  return <AdminGalleryAlbumDetail albumId={params.albumId} />;
}
