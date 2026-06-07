import type { MetadataRoute } from "next";
import { getSiteBranding } from "@/lib/site-branding";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const branding = await getSiteBranding();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/super-admin/", "/user/", "/display/", "/api/"],
    },
    sitemap: `${branding.siteUrl}/sitemap.xml`,
  };
}
