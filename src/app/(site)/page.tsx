import { HeroSection } from "@/components/home/hero-section";
import { EidHomeBanner } from "@/components/home/eid-home-banner";
import { TimetableHomeBanner } from "@/components/home/timetable-home-banner";
import { PrayerTimesWidget } from "@/components/home/prayer-times-widget";
import { HomeExploreSection } from "@/components/home/home-explore-section";
import { AboutTeaser } from "@/components/home/about-teaser";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <EidHomeBanner />
      <TimetableHomeBanner />
      <PrayerTimesWidget />
      <HomeExploreSection />
      <AboutTeaser />
    </>
  );
}
