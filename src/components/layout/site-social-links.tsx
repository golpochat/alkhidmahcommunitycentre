import type { ComponentType } from "react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/layout/social-icons";
import type { SiteSocialLink, SiteSocialLinkId } from "@/lib/site-contact-settings";

const SOCIAL_ICONS: Record<
  SiteSocialLinkId,
  ComponentType<{ className?: string }>
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon,
  whatsapp: WhatsAppIcon,
};

interface SiteSocialLinksProps {
  links: SiteSocialLink[];
  className?: string;
  linkClassName?: string;
}

export function SiteSocialLinks({
  links,
  className,
  linkClassName,
}: SiteSocialLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {links.map((link) => {
        const Icon = SOCIAL_ICONS[link.id];
        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={linkClassName}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
}
