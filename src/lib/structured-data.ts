import type { SiteBranding } from "@/lib/site-branding";

export function buildOrganizationJsonLd(branding: SiteBranding) {
  return {
    "@context": "https://schema.org",
    "@type": "PlaceOfWorship",
    name: branding.siteName,
    url: branding.siteUrl,
    telephone: branding.phone,
    email: branding.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: branding.address,
      addressLocality: "Clondalkin",
      addressRegion: "Dublin",
      addressCountry: "IE",
    },
    sameAs: [
      branding.socialFacebook,
      branding.socialInstagram,
      branding.socialYoutube,
      branding.socialTwitter,
    ].filter(Boolean),
  };
}

export function buildEventJsonLd(input: {
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  url: string;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.title,
    description: input.description.slice(0, 500),
    startDate: input.startAt,
    endDate: input.endAt ?? input.startAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: input.location || input.siteName,
      address: input.location || "Clondalkin, Dublin, Ireland",
    },
    organizer: {
      "@type": "Organization",
      name: input.siteName,
      url: input.url.split("/events/")[0],
    },
    url: input.url,
  };
}

export function buildCourseJsonLd(input: {
  title: string;
  description: string;
  url: string;
  siteName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.title,
    description: input.description.slice(0, 500),
    provider: {
      "@type": "Organization",
      name: input.siteName,
      url: input.url.split("/education/")[0],
    },
    url: input.url,
  };
}
