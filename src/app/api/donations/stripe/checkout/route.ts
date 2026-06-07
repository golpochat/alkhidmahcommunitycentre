import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  assertActiveDonationCategory,
  resolveSiteUrlForDonations,
} from "@/lib/donation-categories";
import { resolveDonationUserId } from "@/lib/donation-user-link";
import { resolveDonationPaymentAmount } from "@/lib/donation-payment-amount";
import { getCategoryLabel } from "@/lib/donations";
import { getEnabledStripeGateway } from "@/lib/payment-gateway-store";
import { getStripe } from "@/lib/stripe";
import { donationFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = donationFormSchema.parse(body);

    await assertActiveDonationCategory(validated.category);

    if (validated.provider !== "stripe") {
      return NextResponse.json({ error: "Invalid payment provider" }, { status: 400 });
    }

    const stripeGateway = await getEnabledStripeGateway();
    const stripe = await getStripe();

    if (!stripe || !stripeGateway) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const currency = stripeGateway.currency.toLowerCase() || "eur";
    const payment = resolveDonationPaymentAmount(validated, stripeGateway.feeConfig);

    const userId = await resolveDonationUserId();

    const donation = await db.donation.create({
      data: {
        donorName: validated.donorName?.trim() || null,
        donorEmail: validated.donorEmail.trim(),
        userId,
        amount: payment.donationData.amount,
        processingFeeCents: payment.donationData.processingFeeCents,
        coverFee: payment.donationData.coverFee,
        currency: stripeGateway.currency,
        category: validated.category,
        provider: "stripe",
        status: "pending",
      },
    });

    const lineItems = [
      {
        price_data: {
          currency,
          product_data: {
            name: `Donation - ${getCategoryLabel(validated.category)}`,
            description: getCategoryLabel(validated.category),
          },
          unit_amount: payment.breakdown.baseAmountCents,
        },
        quantity: 1,
      },
    ];

    if (payment.breakdown.coverFee && payment.breakdown.processingFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: "Payment processing fee",
            description: "Optional fee coverage so the full donation reaches the mosque",
          },
          unit_amount: payment.breakdown.processingFeeCents,
        },
        quantity: 1,
      });
    }

    const siteUrl = await resolveSiteUrlForDonations();

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      redirect_on_completion: "if_required",
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      return_url: `${siteUrl}/donations/success?provider=stripe&donationId=${donation.id}&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: validated.donorEmail,
      metadata: {
        donationId: donation.id,
        category: validated.category,
        coverFee: payment.breakdown.coverFee ? "true" : "false",
        processingFeeCents: String(payment.breakdown.processingFeeCents),
      },
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Unable to start card payment" },
        { status: 500 }
      );
    }

    await db.donation.update({
      where: { id: donation.id },
      data: { providerId: session.id },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      donationId: donation.id,
      sessionId: session.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 400 }
    );
  }
}
