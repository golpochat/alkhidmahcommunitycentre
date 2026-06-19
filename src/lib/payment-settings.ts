import {
  getEnabledBankTransferGateway,
  getEnabledPayPalGateway,
  getEnabledStripeGateway,
} from "@/lib/payment-gateway-store";
import {
  DEFAULT_DONATION_CURRENCY,
  type GatewayFeeConfig,
} from "@/lib/donation-processing-fee";
import type { BankTransferDetails } from "@/lib/payment-gateway-types";

export interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalMode: "sandbox" | "live";
  donationCurrency: string;
  bankTransferEnabled: boolean;
  bankTransfer: BankTransferDetails | null;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const stripe = await getEnabledStripeGateway();
  const paypal = await getEnabledPayPalGateway();
  const bank = await getEnabledBankTransferGateway();

  const donationCurrency = DEFAULT_DONATION_CURRENCY;

  return {
    stripeEnabled: Boolean(stripe),
    stripePublishableKey: stripe?.publishableKey ?? "",
    stripeSecretKey: stripe?.secretKey ?? "",
    stripeWebhookSecret: stripe?.webhookSecret ?? "",
    paypalEnabled: Boolean(paypal),
    paypalClientId: paypal?.clientId ?? "",
    paypalClientSecret: paypal?.clientSecret ?? "",
    paypalMode: paypal?.mode ?? "sandbox",
    donationCurrency,
    bankTransferEnabled: Boolean(bank),
    bankTransfer: bank,
  };
}

export interface DonationPaymentOptions {
  donationCurrency: string;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeFee: GatewayFeeConfig | null;
  paypalEnabled: boolean;
  paypalFee: GatewayFeeConfig | null;
  bankTransferEnabled: boolean;
  bankTransfer: BankTransferDetails | null;
}

export async function getDonationPaymentOptions(): Promise<DonationPaymentOptions> {
  const settings = await getPaymentSettings();
  const stripe = await getEnabledStripeGateway();
  const paypal = await getEnabledPayPalGateway();

  return {
    donationCurrency: settings.donationCurrency,
    stripeEnabled: settings.stripeEnabled,
    stripePublishableKey: settings.stripePublishableKey,
    stripeFee: stripe?.feeConfig ?? null,
    paypalEnabled: settings.paypalEnabled,
    paypalFee: paypal?.feeConfig ?? null,
    bankTransferEnabled: settings.bankTransferEnabled,
    bankTransfer: settings.bankTransfer,
  };
}
