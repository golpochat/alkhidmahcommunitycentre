import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { isPasswordMask } from "@/lib/encryption";
import {
  createPaymentGateway,
  listPublicPaymentGateways,
  type PaymentGatewayInput,
} from "@/lib/payment-gateway-store";
import { paymentGatewaySchema } from "@/lib/validations";

function getErrorStatus(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  return 400;
}

function toGatewayInput(
  validated: ReturnType<typeof paymentGatewaySchema.parse>
): PaymentGatewayInput {
  const base: PaymentGatewayInput = {
    name: validated.name,
    type: validated.type,
    isEnabled: validated.isEnabled,
    currency: validated.currency,
  };

  if (validated.type === "STRIPE") {
    return {
      ...base,
      stripe: {
        publishableKey: validated.publishableKey ?? "",
        secretKey: isPasswordMask(validated.secretKey)
          ? undefined
          : validated.secretKey,
        webhookSecret: isPasswordMask(validated.webhookSecret)
          ? undefined
          : validated.webhookSecret,
      },
    };
  }

  if (validated.type === "PAYPAL") {
    return {
      ...base,
      paypal: {
        clientId: validated.clientId ?? "",
        mode: validated.paypalMode ?? "sandbox",
        clientSecret: isPasswordMask(validated.clientSecret)
          ? undefined
          : validated.clientSecret,
      },
    };
  }

  return {
    ...base,
    bankTransfer: {
      accountName: validated.accountName ?? "",
      bankName: validated.bankName ?? "",
      iban: validated.iban ?? "",
      bic: validated.bic ?? "",
      referenceNote: validated.referenceNote ?? "",
    },
  };
}

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.settings.manage);
    const gateways = await listPublicPaymentGateways();
    return NextResponse.json({ gateways });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);
    const body = await request.json();
    const validated = paymentGatewaySchema.parse(body);
    const gateway = await createPaymentGateway(toGatewayInput(validated));

    return NextResponse.json({ success: true, gateway });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
