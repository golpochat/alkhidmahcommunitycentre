import type { Donation } from "@prisma/client";
import {
  calculateDonationFeeBreakdown,
  calculateGatewayFeeOnCharge,
  DEFAULT_PAYPAL_FEE_CONFIG,
  DEFAULT_STRIPE_FEE_CONFIG,
  getDonationTotalCents,
  type GatewayFeeConfig,
} from "@/lib/donation-processing-fee";

export type DonationProviderFeeConfigs = Record<string, GatewayFeeConfig>;

export interface DonationAccounting {
  giftAmountCents: number;
  processingFeeCents: number;
  totalChargedCents: number;
  netReceivedCents: number;
  coverFee: boolean;
  feeEstimated: boolean;
}

function feeConfigForProvider(
  provider: string,
  configs: DonationProviderFeeConfigs,
): GatewayFeeConfig | null {
  if (provider === "stripe") {
    return configs.stripe ?? DEFAULT_STRIPE_FEE_CONFIG;
  }

  if (provider === "paypal") {
    return configs.paypal ?? DEFAULT_PAYPAL_FEE_CONFIG;
  }

  return null;
}

function estimateProcessingFeeCents(
  donation: Pick<Donation, "amount" | "coverFee" | "provider">,
  configs: DonationProviderFeeConfigs,
): number {
  const feeConfig = feeConfigForProvider(donation.provider, configs);
  if (!feeConfig) {
    return 0;
  }

  if (donation.coverFee) {
    return calculateDonationFeeBreakdown(
      donation.amount,
      feeConfig,
      true,
    ).processingFeeCents;
  }

  return calculateGatewayFeeOnCharge(donation.amount * 100, feeConfig);
}

export function resolveDonationAccounting(
  donation: Pick<
    Donation,
    "amount" | "processingFeeCents" | "coverFee" | "provider" | "status"
  >,
  configs: DonationProviderFeeConfigs = {},
): DonationAccounting {
  let processingFeeCents = donation.processingFeeCents;
  let feeEstimated = false;

  if (
    processingFeeCents === 0 &&
    donation.provider !== "bank_transfer" &&
    donation.amount > 0
  ) {
    processingFeeCents = estimateProcessingFeeCents(donation, configs);
    feeEstimated = processingFeeCents > 0;
  }

  const giftAmountCents = donation.amount * 100;
  const totalChargedCents = getDonationTotalCents({
    amount: donation.amount,
    processingFeeCents,
    coverFee: donation.coverFee,
  });
  const netReceivedCents = Math.max(0, totalChargedCents - processingFeeCents);

  return {
    giftAmountCents,
    processingFeeCents,
    totalChargedCents,
    netReceivedCents,
    coverFee: donation.coverFee,
    feeEstimated,
  };
}

export function centsToEuros(cents: number) {
  return Math.round(cents) / 100;
}

export function formatProviderLabel(provider: string) {
  if (provider === "stripe") return "Stripe";
  if (provider === "paypal") return "PayPal";
  if (provider === "bank_transfer") return "Bank transfer";
  return provider;
}

export interface DonationAccountingTotals {
  recordCount: number;
  giftTotalCents: number;
  processingFeeTotalCents: number;
  totalChargedCents: number;
  netReceivedCents: number;
  feesCoveredByDonorsCents: number;
  feesDeductedFromGiftsCents: number;
  succeededNetReceivedCents: number;
}

export function sumDonationAccounting(
  donations: Pick<
    Donation,
    "amount" | "processingFeeCents" | "coverFee" | "provider" | "status"
  >[],
  configs: DonationProviderFeeConfigs = {},
): DonationAccountingTotals {
  const totals: DonationAccountingTotals = {
    recordCount: donations.length,
    giftTotalCents: 0,
    processingFeeTotalCents: 0,
    totalChargedCents: 0,
    netReceivedCents: 0,
    feesCoveredByDonorsCents: 0,
    feesDeductedFromGiftsCents: 0,
    succeededNetReceivedCents: 0,
  };

  for (const donation of donations) {
    const accounting = resolveDonationAccounting(donation, configs);

    totals.giftTotalCents += accounting.giftAmountCents;
    totals.processingFeeTotalCents += accounting.processingFeeCents;
    totals.totalChargedCents += accounting.totalChargedCents;
    totals.netReceivedCents += accounting.netReceivedCents;

    if (accounting.coverFee) {
      totals.feesCoveredByDonorsCents += accounting.processingFeeCents;
    } else {
      totals.feesDeductedFromGiftsCents += accounting.processingFeeCents;
    }

    if (donation.status === "succeeded") {
      totals.succeededNetReceivedCents += accounting.netReceivedCents;
    }
  }

  return totals;
}

/** Gross inflow for statements: fees plus net received (equals total charged). */
export function getStatementCharitableTotalCents(
  totals: Pick<
    DonationAccountingTotals,
    "processingFeeTotalCents" | "netReceivedCents" | "totalChargedCents"
  >,
) {
  return totals.processingFeeTotalCents + totals.netReceivedCents;
}
