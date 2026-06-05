import type { Metadata } from "next";
import { FAVICON_HREF, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./constants";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: FAVICON_HREF, type: "image/png" }],
    apple: [{ url: "/logo/favicon.png?v=7", type: "image/png" }],
    shortcut: FAVICON_HREF,
  },
  alternates: {
    canonical: SITE_URL,
  },
  title: {
    default: `${SITE_NAME} | Clondalkin`,
    template: `%s | ${SITE_NAME}`,
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
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function createPageMetadata(
  title: string,
  description: string
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}
