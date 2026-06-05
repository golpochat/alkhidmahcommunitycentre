import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth";
import { setPaymentGatewayEnabled } from "@/lib/payment-gateway-store";
import { z } from "zod";

const bodySchema = z.object({
  isEnabled: z.boolean(),
});

function getErrorStatus(message: string) {
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Payment gateway not found") return 404;
  return 400;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission(PERMISSIONS.settings.manage);
    const { isEnabled } = bodySchema.parse(await request.json());
    const gateway = await setPaymentGatewayEnabled(params.id, isEnabled);

    return NextResponse.json({ success: true, gateway });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
