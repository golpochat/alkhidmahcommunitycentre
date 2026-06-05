"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";
import { DonationCategoryCard } from "@/components/donations/donation-category-card";
import { DonationForm } from "@/components/donations/donation-form";
import { IMAGES } from "@/lib/images";
import type { PublicDonationCategory } from "@/lib/donations";
import type { DonationPaymentOptions } from "@/lib/payment-settings";
import { isDonationCategory } from "@/lib/donations";

interface DonationsPageContentProps {
  categories: PublicDonationCategory[];
  initialCategory?: string;
  paymentOptions: DonationPaymentOptions;
}

export function DonationsPageContent({
  categories,
  initialCategory,
  paymentOptions,
}: DonationsPageContentProps) {
  const defaultCategory =
    initialCategory && isDonationCategory(initialCategory, categories)
      ? initialCategory
      : categories[0]?.slug ?? "";

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [showForm, setShowForm] = useState(
    Boolean(initialCategory && isDonationCategory(initialCategory, categories))
  );

  function handleCategorySelect(slug: string) {
    if (!isDonationCategory(slug, categories)) return;
    setSelectedCategory(slug);
    setShowForm(true);
  }

  const selectedCategoryName =
    categories.find((item) => item.slug === selectedCategory)?.name ?? "Donation";

  return (
    <>
      <PageHero
        badge="Donate"
        title="Support Your Mosque"
        description="Choose a donation category and give securely online or by bank transfer. All contributions support prayer, education, and community services."
        image={IMAGES.heroes.donations}
        imageAlt="Charity and community support"
      />

      <section className="section-padding">
        <div className="section-container">
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No donation categories are available at the moment. Please check back later.
            </p>
          ) : (
            <>
              <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <DonationCategoryCard
                    key={category.slug}
                    id={category.slug}
                    title={category.name}
                    description={category.description}
                    selected={selectedCategory === category.slug}
                    onSelect={handleCategorySelect}
                  />
                ))}
              </div>

              {showForm && selectedCategory && (
                <Card className="card-mosque mx-auto max-w-2xl">
                  <CardHeader>
                    <CardTitle className="font-heading">Complete Your Donation</CardTitle>
                    <CardDescription>
                      Donating to{" "}
                      <span className="font-medium text-gold">{selectedCategoryName}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonationForm
                      key={selectedCategory}
                      category={selectedCategory}
                      stripeEnabled={paymentOptions.stripeEnabled}
                      stripePublishableKey={paymentOptions.stripePublishableKey}
                      paypalEnabled={paymentOptions.paypalEnabled}
                      bankTransferEnabled={paymentOptions.bankTransferEnabled}
                      bankTransfer={paymentOptions.bankTransfer}
                      onError={(message) => {
                        toast.error(message);
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
