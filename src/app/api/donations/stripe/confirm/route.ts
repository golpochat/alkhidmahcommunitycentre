import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendDonationAdminNotification, sendDonationReceipt } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const donationId = String(body.donationId ?? "").trim();
    const sessionId = String(body.sessionId ?? "").trim();

    if (!donationId || !sessionId) {
      return NextResponse.json({ error: "Missing donation or session" }, { status: 400 });
    }

    const donation = await db.donation.findUnique({ where: { id: donationId } });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (donation.provider !== "stripe") {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (donation.status === "succeeded") {
      return NextResponse.json({ success: true, status: donation.status });
    }

    const stripe = await getStripe();

    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.donationId !== donationId) {
      return NextResponse.json({ error: "Session does not match donation" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment has not completed yet", status: session.payment_status },
        { status: 400 }
      );
    }

    const updated = await db.donation.update({
      where: { id: donationId },
      data: {
        status: "succeeded",
        providerId: session.payment_intent?.toString() || session.id,
      },
    });

    await sendDonationReceipt(updated);
    await sendDonationAdminNotification(updated);

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Confirmation failed" },
      { status: 400 }
    );
  }
}
