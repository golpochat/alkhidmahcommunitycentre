import "server-only";

import {
  DEFAULT_PAYPAL_FEE_CONFIG,
  DEFAULT_STRIPE_FEE_CONFIG,
} from "@/lib/donation-processing-fee";
import type { DonationProviderFeeConfigs } from "@/lib/donation-accounting";
import {
  getEnabledPayPalGateway,
  getEnabledStripeGateway,
} from "@/lib/payment-gateway-store";

export async function loadDonationProviderFeeConfigs(): Promise<DonationProviderFeeConfigs> {
  const [stripeGateway, paypalGateway] = await Promise.all([
    getEnabledStripeGateway(),
    getEnabledPayPalGateway(),
  ]);

  return {
    stripe: stripeGateway?.feeConfig ?? DEFAULT_STRIPE_FEE_CONFIG,
    paypal: paypalGateway?.feeConfig ?? DEFAULT_PAYPAL_FEE_CONFIG,
  };
}
