import {
  getEnabledBankTransferGateway,
  getEnabledPayPalGateway,
  getEnabledStripeGateway,
} from "@/lib/payment-gateway-store";
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

  const donationCurrency =
    stripe?.currency ?? paypal?.currency ?? bank?.currency ?? "EUR";

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
  paypalEnabled: boolean;
  bankTransferEnabled: boolean;
  bankTransfer: BankTransferDetails | null;
}

export async function getDonationPaymentOptions(): Promise<DonationPaymentOptions> {
  const settings = await getPaymentSettings();

  return {
    donationCurrency: settings.donationCurrency,
    stripeEnabled: settings.stripeEnabled,
    stripePublishableKey: settings.stripePublishableKey,
    paypalEnabled: settings.paypalEnabled,
    bankTransferEnabled: settings.bankTransferEnabled,
    bankTransfer: settings.bankTransfer,
  };
}
