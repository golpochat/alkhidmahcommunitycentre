import { ContactPageContent } from "@/components/contact/contact-page-content";
import { createPageMetadata } from "@/lib/metadata";
import { getSiteContactSettings } from "@/lib/site-contact-settings";

export async function generateMetadata() {
  const site = await getSiteContactSettings();

  return createPageMetadata(
    "Contact",
    `Contact ${site.siteName} — address, phone, email, and contact form.`
  );
}

export default async function ContactPage() {
  const site = await getSiteContactSettings();

  return <ContactPageContent site={site} />;
}
