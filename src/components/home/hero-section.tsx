"use client";

import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import { usePublicSiteBranding } from "@/components/layout/site-branding-context";
import { IMAGES } from "@/lib/images";
import { ButtonLink } from "@/components/ui/button-link";

export function HeroSection() {
  const { siteName } = usePublicSiteBranding();

  return (
    <section className="relative flex min-h-[85vh] max-w-full items-center overflow-hidden">
      <div className="image-frame image-frame-hero absolute inset-0">
        <Image
          src={IMAGES.hero}
          alt={`${siteName} — masjid and community`}
          fill
          priority
          className="object-cover brightness-105"
          sizes="100vw"
        />
      </div>

      <div className="section-container relative z-10 py-section">
        <div className="max-w-3xl">
          <p className="mb-4 font-heading text-sm uppercase tracking-[0.3em] text-gold">
            {siteName}
          </p>
          <h1 className="heading-display mb-6 text-balance text-white">
            Serving the Muslim Community of Clondalkin
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-neutral-200">
            A centre for worship, learning, and community — welcoming all to
            prayer, education, events, and charitable giving.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <ButtonLink href="/#prayer-times" size="lg" className="btn-gold">
              Prayer Times
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/donations"
              size="lg"
              variant="outline"
              className="border-gold bg-transparent text-gold hover:bg-gold hover:text-mosque-black"
            >
              <Heart className="mr-2 h-4 w-4" />
              Donate Now
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
