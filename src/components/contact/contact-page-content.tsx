import { PageHero } from "@/components/layout/page-hero";
import { ContactDetails } from "@/components/contact/contact-details";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactMap } from "@/components/contact/contact-map";
import { WhatsAppButton } from "@/components/contact/whatsapp-button";
import { IMAGES } from "@/lib/images";
import type { SiteContactSettings } from "@/lib/site-contact-settings";

interface ContactPageContentProps {
  site: SiteContactSettings;
}

export function ContactPageContent({ site }: ContactPageContentProps) {
  return (
    <>
      <PageHero
        badge="Contact"
        title="Get in Touch"
        description="We welcome your questions, feedback, and enquiries. Reach out by form, phone, email, or WhatsApp."
        image={IMAGES.heroes.contact}
        imageAlt="Al Khidmah masjid interior"
      />

      <section className="section-padding">
        <div className="section-container grid gap-10 lg:grid-cols-2">
          <ContactForm />

          <div className="space-y-6">
            <ContactMap site={site} />
            <ContactDetails site={site} />
            <WhatsAppButton site={site} />
          </div>
        </div>
      </section>
    </>
  );
}
