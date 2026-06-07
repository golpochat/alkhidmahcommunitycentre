import type { Metadata } from "next";
import { FAVICON_HREF, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./constants";
import type { SiteBranding } from "@/lib/site-branding";

export function buildDefaultMetadata(branding: SiteBranding): Metadata {
  return {
    metadataBase: new URL(branding.siteUrl || SITE_URL),
    icons: {
      icon: [{ url: branding.faviconPath || FAVICON_HREF, type: "image/png" }],
      apple: [{ url: "/logo/favicon.png?v=7", type: "image/png" }],
      shortcut: branding.faviconPath || FAVICON_HREF,
    },
    alternates: {
      canonical: branding.siteUrl || SITE_URL,
    },
    title: {
      default: `${branding.siteName} | Clondalkin`,
      template: `%s | ${branding.siteName}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "community centre",
      "mosque",
      "Clondalkin",
      "Dublin",
      "Islamic centre",
      "prayer times",
      "Islamic education",
      "Quran classes",
      "Muslim community",
    ],
    authors: [{ name: branding.siteName }],
    openGraph: {
      type: "website",
      locale: "en_IE",
      url: branding.siteUrl || SITE_URL,
      siteName: branding.siteName,
      title: branding.siteName,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: branding.siteName,
      description: SITE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/** @deprecated Use buildDefaultMetadata(getSiteBranding()) */
export const defaultMetadata: Metadata = buildDefaultMetadata({
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  logoPath: "/logo/logo.png",
  faviconPath: FAVICON_HREF,
  charityNumber: "",
  address: "",
  phone: "",
  email: "",
  whatsapp: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
  socialTwitter: "",
});

export function createPageMetadata(
  title: string,
  description: string,
  options?: {
    siteName?: string;
    image?: string;
    canonical?: string;
    type?: "website" | "article";
  },
): Metadata {
  const trimmedDescription = description.slice(0, 160);
  const siteName = options?.siteName ?? SITE_NAME;

  return {
    title,
    description: trimmedDescription,
    alternates: options?.canonical ? { canonical: options.canonical } : undefined,
    openGraph: {
      title: `${title} | ${siteName}`,
      description: trimmedDescription,
      type: options?.type ?? "website",
      ...(options?.image ? { images: [{ url: options.image }] } : {}),
    },
  };
}
