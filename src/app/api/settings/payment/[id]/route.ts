import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { isPasswordMask } from "@/lib/encryption";
import {
  deletePaymentGateway,
  getPublicPaymentGateway,
  updatePaymentGateway,
  type PaymentGatewayInput,
} from "@/lib/payment-gateway-store";
import { paymentGatewaySchema } from "@/lib/validations";

function getErrorStatus(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Payment gateway not found") return 404;
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);
    const gateway = await getPublicPaymentGateway(params.id);
    if (!gateway) {
      return NextResponse.json({ error: "Payment gateway not found" }, { status: 404 });
    }
    return NextResponse.json({ gateway });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);
    const body = await request.json();
    const validated = paymentGatewaySchema.parse(body);
    const gateway = await updatePaymentGateway(params.id, toGatewayInput(validated));

    return NextResponse.json({ success: true, gateway });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);
    await deletePaymentGateway(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
