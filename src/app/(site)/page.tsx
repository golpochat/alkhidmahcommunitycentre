import { HeroSection } from "@/components/home/hero-section";
import { EidHomeBanner } from "@/components/home/eid-home-banner";
import { TimetableHomeBanner } from "@/components/home/timetable-home-banner";
import { PrayerTimesWidget } from "@/components/home/prayer-times-widget";
import { DonationHighlights } from "@/components/home/donation-highlights";
import { EventsPreview } from "@/components/home/events-preview";
import { ClassesPreview } from "@/components/home/classes-preview";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { AboutTeaser } from "@/components/home/about-teaser";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <EidHomeBanner />
      <TimetableHomeBanner />
      <PrayerTimesWidget />
      <DonationHighlights />
      <EventsPreview />
      <ClassesPreview />
      <GalleryPreview />
      <AboutTeaser />
    </>
  );
}
