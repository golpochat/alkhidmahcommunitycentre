import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { DonationCategoryCard } from "@/components/donations/donation-category-card";
import { listPublicDonationCategories } from "@/lib/donation-categories";

export async function DonationHighlights() {
  const categories = await listPublicDonationCategories();
  const previewCategories = categories.slice(0, 4);

  if (previewCategories.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-islamic-geometric">
      <div className="section-container">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4 border-gold text-gold">
            Give Generously
          </Badge>
          <h2 className="heading-section text-white">Support Your Community</h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
            Your donations help maintain prayer facilities, fund education, and
            serve those in need.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {previewCategories.map((item) => (
            <DonationCategoryCard
              key={item.slug}
              id={item.slug}
              title={item.name}
              description={item.description}
              href={`/donations?category=${item.slug}`}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <ButtonLink href="/donations" size="lg" className="btn-gold">
            View All Donation Options
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
