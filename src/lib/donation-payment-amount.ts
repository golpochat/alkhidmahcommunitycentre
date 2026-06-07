import "server-only";

import {
  calculateDonationFeeBreakdown,
  type GatewayFeeConfig,
} from "@/lib/donation-processing-fee";
import type { DonationFormValues } from "@/lib/validations";

export function resolveDonationPaymentAmount(
  validated: Pick<DonationFormValues, "amount" | "coverProcessingFee">,
  feeConfig: GatewayFeeConfig,
) {
  const breakdown = calculateDonationFeeBreakdown(
    validated.amount,
    feeConfig,
    Boolean(validated.coverProcessingFee),
  );

  return {
    breakdown,
    donationData: {
      amount: breakdown.baseAmountEuros,
      processingFeeCents: breakdown.processingFeeCents,
      coverFee: breakdown.coverFee,
    },
    chargeCents: breakdown.totalCents,
  };
}
