import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDonationReceipt } from "@/lib/email";
import { capturePayPalOrder } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  let donationId: string | undefined;

  try {
    const body = await request.json();
    const orderId = body.orderId as string;
    donationId = body.donationId as string;

    if (!orderId || !donationId) {
      return NextResponse.json(
        { error: "orderId and donationId are required" },
        { status: 400 }
      );
    }

    const donation = await db.donation.findUnique({ where: { id: donationId } });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (donation.status === "succeeded") {
      return NextResponse.json({ success: true, donationId });
    }

    const capture = await capturePayPalOrder(orderId);
    const captureId =
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;

    const updated = await db.donation.update({
      where: { id: donationId },
      data: {
        status: "succeeded",
        providerId: captureId,
      },
    });

    await sendDonationReceipt(updated);

    return NextResponse.json({ success: true, donationId });
  } catch (error) {
    if (donationId) {
      await db.donation
        .update({
          where: { id: donationId },
          data: { status: "failed" },
        })
        .catch(() => undefined);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Capture failed" },
      { status: 400 }
    );
  }
}
