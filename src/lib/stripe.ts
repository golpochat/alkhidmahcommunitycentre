import Stripe from "stripe";
import { getEnabledStripeGateway } from "@/lib/payment-gateway-store";

export async function getStripe() {
  const gateway = await getEnabledStripeGateway();

  if (!gateway?.secretKey) {
    return null;
  }

  return new Stripe(gateway.secretKey);
}

export async function getStripeWebhookSecret() {
  const gateway = await getEnabledStripeGateway();
  return gateway?.webhookSecret || null;
}

export function generateReceiptId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AKM-${timestamp}-${random}`;
}
