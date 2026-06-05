import Link from "next/link";
import { WhatsAppIcon } from "@/components/layout/social-icons";
import { getWhatsAppUrlForSettings } from "@/lib/contact";
import type { SiteContactSettings } from "@/lib/site-contact-settings";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  site: SiteContactSettings;
  className?: string;
}

export function WhatsAppButton({ site, className }: WhatsAppButtonProps) {
  const whatsappUrl = getWhatsAppUrlForSettings(site);

  if (!whatsappUrl) {
    return null;
  }

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("whatsapp-chat-button", className)}
    >
      <WhatsAppIcon className="h-5 w-5" />
      Chat on WhatsApp
    </Link>
  );
}
