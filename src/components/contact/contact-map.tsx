import { Card } from "@/components/ui/card";
import { getMapEmbedUrlForSettings } from "@/lib/contact";
import type { SiteContactSettings } from "@/lib/site-contact-settings";

interface ContactMapProps {
  site: SiteContactSettings;
}

export function ContactMap({ site }: ContactMapProps) {
  if (!site.address) {
    return null;
  }

  return (
    <Card className="contact-map-card overflow-hidden">
      <div className="relative aspect-video">
        <iframe
          title={`${site.siteName} location on Google Maps`}
          src={getMapEmbedUrlForSettings(site)}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </Card>
  );
}
