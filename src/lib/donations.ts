import type { Donation } from "@prisma/client";
import {
  resolveDonationAccounting,
  type DonationProviderFeeConfigs,
} from "@/lib/donation-accounting";
import { normalizeDonationCurrency } from "@/lib/donation-processing-fee";
import { DONATION_CATEGORIES } from "@/lib/constants";

export type DonationProvider = "stripe" | "paypal";
export type DonationStatus = "pending" | "succeeded" | "failed";

export const DONATION_PROVIDERS: DonationProvider[] = ["stripe", "paypal"];
export const DONATION_STATUSES: DonationStatus[] = [
  "pending",
  "succeeded",
  "failed",
];

export const DONATION_PRESET_AMOUNTS = [10, 20, 50, 100] as const;

export interface PublicDonationCategory {
  slug: string;
  name: string;
  description: string;
}

export interface SerializedDonationCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  donationUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedDonation {
  id: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  processingFeeCents: number;
  coverFee: boolean;
  totalCents: number;
  netCents: number;
  feeEstimated: boolean;
  currency: string;
  category: string;
  provider: DonationProvider;
  providerId: string | null;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export function serializeDonation(
  donation: Donation,
  feeConfigs?: DonationProviderFeeConfigs,
): SerializedDonation {
  const accounting = resolveDonationAccounting(donation, feeConfigs);

  return {
    id: donation.id,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    amount: donation.amount,
    processingFeeCents: accounting.processingFeeCents,
    coverFee: donation.coverFee,
    totalCents: accounting.totalChargedCents,
    netCents: accounting.netReceivedCents,
    feeEstimated: accounting.feeEstimated,
    currency: normalizeDonationCurrency(donation.currency),
    category: donation.category,
    provider: donation.provider as DonationProvider,
    providerId: donation.providerId,
    status: donation.status as DonationStatus,
    createdAt: donation.createdAt.toISOString(),
    updatedAt: donation.updatedAt.toISOString(),
  };
}

export function getCategoryLabel(
  categoryId: string,
  categories?: { slug: string; name: string }[]
): string {
  if (categories) {
    const match = categories.find((item) => item.slug === categoryId);
    if (match) return match.name;
  }

  const match = DONATION_CATEGORIES.find((item) => item.id === categoryId);
  return match?.title ?? categoryId;
}

export function isDonationCategory(
  value: string,
  categories?: { slug: string }[]
): boolean {
  if (categories) {
    return categories.some((item) => item.slug === value);
  }

  return DONATION_CATEGORIES.some((item) => item.id === value);
}
