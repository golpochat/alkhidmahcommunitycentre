import { ArrowRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { getSiteBranding } from "@/lib/site-branding";

export async function AboutTeaser() {
  const branding = await getSiteBranding();

  return (
    <section className="section-padding">
      <div className="section-container grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge variant="outline" className="mb-4 border-emerald text-emerald">
            About Us
          </Badge>
          <h2 className="heading-section mb-4">Welcome to {branding.siteName}</h2>
          <p className="mb-4 text-muted-foreground">
            A cornerstone of the Muslim community in Clondalkin since 2010,
            providing a spiritual home for worship, learning, and charitable
            service.
          </p>
          <p className="mb-6 text-muted-foreground">
            We strive to nurture faith, knowledge, and compassion — from the
            youngest child learning their first surah to elders sharing wisdom
            and experience.
          </p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-sm text-gold">
            <Award className="h-4 w-4" />
            Registered Charity: {branding.charityNumber}
          </div>
          <ButtonLink href="/about" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-mosque-black">
            Learn More About Us
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="rounded-lg border border-border bg-islamic-star bg-secondary/30 p-8">
          <h3 className="mb-4 font-heading text-xl font-semibold">Our Mission</h3>
          <p className="text-muted-foreground">
            To serve the Muslim community of Clondalkin by providing a centre
            for the five daily prayers, Jumuah, Islamic education, and
            charitable outreach — while fostering understanding and good
            relations with our neighbours.
          </p>
        </div>
      </div>
    </section>
  );
}
