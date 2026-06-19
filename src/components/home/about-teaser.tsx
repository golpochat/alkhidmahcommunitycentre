import { ArrowRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { getSiteBranding } from "@/lib/site-branding";

export async function AboutTeaser() {
  const branding = await getSiteBranding();

  return (
    <section className="section-padding">
      <div className="section-container max-w-3xl text-center">
        <Badge variant="outline" className="mb-4 border-emerald text-emerald">
          About Us
        </Badge>
        <h2 className="heading-section mb-4">Welcome to {branding.siteName}</h2>
        <p className="mb-4 text-muted-foreground">
          A cornerstone of the Muslim community in Clondalkin since 2010 —
          a spiritual home for worship, learning, and charitable service.
        </p>
        <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-sm text-gold">
          <Award className="h-4 w-4" />
          Registered Charity: {branding.charityNumber}
        </div>
        <div>
          <ButtonLink
            href="/about"
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-mosque-black"
          >
            Learn More About Us
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
