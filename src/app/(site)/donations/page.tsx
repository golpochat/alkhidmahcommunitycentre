import { DonationsPageContent } from "@/components/donations/donations-page-content";
import { SITE_NAME } from "@/lib/constants";
import { listPublicDonationCategories } from "@/lib/donation-categories";
import { createPageMetadata } from "@/lib/metadata";
import { getDonationPaymentOptions } from "@/lib/payment-settings";

export const metadata = createPageMetadata(
  "Donations",
  `Support ${SITE_NAME} with zakah, sadaqah, and charitable donations via Stripe or PayPal.`
);

interface DonationsPageProps {
  searchParams: { category?: string };
}

export default async function DonationsPage({ searchParams }: DonationsPageProps) {
  const [paymentOptions, categories] = await Promise.all([
    getDonationPaymentOptions(),
    listPublicDonationCategories(),
  ]);

  return (
    <DonationsPageContent
      categories={categories}
      initialCategory={searchParams.category}
      paymentOptions={paymentOptions}
    />
  );
}
