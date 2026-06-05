import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPayPalOrder } from "@/lib/paypal";
import { getEnabledPayPalGateway } from "@/lib/payment-gateway-store";
import { assertActiveDonationCategory } from "@/lib/donation-categories";
import { donationFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = donationFormSchema.parse(body);

    await assertActiveDonationCategory(validated.category);

    if (validated.provider !== "paypal") {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const paypalGateway = await getEnabledPayPalGateway();

    if (!paypalGateway) {
      return NextResponse.json({ error: "PayPal is not configured" }, { status: 500 });
    }

    const donation = await db.donation.create({
      data: {
        donorName: validated.donorName?.trim() || null,
        donorEmail: validated.donorEmail.trim(),
        amount: validated.amount,
        currency: paypalGateway.currency,
        category: validated.category,
        provider: "paypal",
        status: "pending",
      },
    });

    const order = await createPayPalOrder({
      amount: validated.amount,
      currency: paypalGateway.currency,
      category: validated.category,
      donationId: donation.id,
    });

    await db.donation.update({
      where: { id: donation.id },
      data: { providerId: order.orderId },
    });

    return NextResponse.json({
      url: order.approvalUrl,
      donationId: donation.id,
      orderId: order.orderId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PayPal order failed" },
      { status: 400 }
    );
  }
}
