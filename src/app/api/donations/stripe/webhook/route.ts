import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { sendDonationAdminNotification, sendDonationReceipt } from "@/lib/email";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const stripe = await getStripe();
  const webhookSecret = await getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donationId;

    if (donationId) {
      const donation = await db.donation.update({
        where: { id: donationId },
        data: {
          status: "succeeded",
          providerId: session.payment_intent?.toString() || session.id,
        },
      });

      await sendDonationReceipt(donation);
      await sendDonationAdminNotification(donation);
    }
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const donationId = session.metadata?.donationId;
    if (donationId) {
      await db.donation.update({
        where: { id: donationId },
        data: { status: "failed" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
