import Script from "next/script";
import { buildOrganizationJsonLd } from "@/lib/structured-data";
import { getSiteBranding } from "@/lib/site-branding";

export async function SiteStructuredData() {
  const branding = await getSiteBranding();
  const jsonLd = buildOrganizationJsonLd(branding);

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
