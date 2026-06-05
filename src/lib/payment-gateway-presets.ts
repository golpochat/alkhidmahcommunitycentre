export type PaymentGatewayTypeId = "STRIPE" | "PAYPAL" | "BANK_TRANSFER";

export interface PaymentGatewayPreset {
  type: PaymentGatewayTypeId;
  label: string;
  description: string;
}

export const PAYMENT_GATEWAY_PRESETS: PaymentGatewayPreset[] = [
  {
    type: "STRIPE",
    label: "Stripe",
    description: "Card payments via Stripe Checkout",
  },
  {
    type: "PAYPAL",
    label: "PayPal",
    description: "PayPal checkout for donors",
  },
  {
    type: "BANK_TRANSFER",
    label: "Bank Transfer",
    description: "Display account details for manual transfer",
  },
];

export function paymentGatewayTypeLabel(type: PaymentGatewayTypeId) {
  return (
    PAYMENT_GATEWAY_PRESETS.find((preset) => preset.type === type)?.label ?? type
  );
}
