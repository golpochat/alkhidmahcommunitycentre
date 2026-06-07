import { DonationsPageContent } from "@/components/donations/donations-page-content";
import { getFreshSession } from "@/lib/auth";
import { listPublicDonationCategories } from "@/lib/donation-categories";
import { createPageMetadata } from "@/lib/metadata";
import { getSiteBranding } from "@/lib/site-branding";
import { getDonationPaymentOptions } from "@/lib/payment-settings";

export async function generateMetadata() {
  const branding = await getSiteBranding();
  return createPageMetadata(
    "Donations",
    `Support ${branding.siteName} with zakah, sadaqah, and charitable donations via Stripe or PayPal.`,
  );
}

interface DonationsPageProps {
  searchParams: { category?: string };
}

export default async function DonationsPage({ searchParams }: DonationsPageProps) {
  const [paymentOptions, categories, session] = await Promise.all([
    getDonationPaymentOptions(),
    listPublicDonationCategories(),
    getFreshSession(),
  ]);

  return (
    <DonationsPageContent
      categories={categories}
      initialCategory={searchParams.category}
      paymentOptions={paymentOptions}
      defaultDonorEmail={session?.email}
      defaultDonorName={session?.name ?? undefined}
    />
  );
}
