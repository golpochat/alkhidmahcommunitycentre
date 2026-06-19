import type { MetadataRoute } from "next";
import { getSiteBranding } from "@/lib/site-branding";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getSiteBranding();

  return {
    name: branding.siteName,
    short_name: "Al Khidmah",
    description:
      "Prayer times, education, and community services for Clondalkin and surrounding areas.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f6b4a",
    theme_color: "#D4AF37",
    orientation: "portrait-primary",
    icons: [
      {
        src: branding.logoPath || "/logo/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: branding.faviconPath || "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
