import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SiteSocialLinks } from "@/components/layout/site-social-links";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPENING_HOURS, getDirectionsUrlForSettings } from "@/lib/contact";
import {
  buildMailtoHref,
  buildSiteSocialLinks,
  buildTelHref,
  type SiteContactSettings,
} from "@/lib/site-contact-settings";

interface ContactDetailsProps {
  site: SiteContactSettings;
}

export function ContactDetails({ site }: ContactDetailsProps) {
  const socialLinks = buildSiteSocialLinks(site);
  const phoneHref = buildTelHref(site.phone);
  const emailHref = buildMailtoHref(site.email);
  const directionsUrl = getDirectionsUrlForSettings(site);

  return (
    <Card className="card-mosque">
      <CardHeader>
        <CardTitle className="font-heading">Contact Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {site.address && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-medium">Address</p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-gold"
              >
                {site.address}
              </a>
            </div>
          </div>
        )}

        {site.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-medium">Phone</p>
              {phoneHref ? (
                <a
                  href={phoneHref}
                  className="text-sm text-muted-foreground transition-colors hover:text-gold"
                >
                  {site.phone}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">{site.phone}</p>
              )}
            </div>
          </div>
        )}

        {site.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="font-medium">Email</p>
              {emailHref ? (
                <a
                  href={emailHref}
                  className="text-sm text-muted-foreground transition-colors hover:text-gold"
                >
                  {site.email}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">{site.email}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-gold" />
          <div>
            <p className="font-medium">Opening Hours</p>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              {OPENING_HOURS.map((item) => (
                <li key={item.label}>
                  <span className="font-medium text-foreground">{item.label}:</span>{" "}
                  {item.value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div>
            <p className="mb-3 font-medium">Follow Us</p>
            <SiteSocialLinks
              links={socialLinks}
              className="flex flex-wrap gap-3"
              linkClassName="social-icon-link"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
