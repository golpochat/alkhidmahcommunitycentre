import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { assertActiveDonationCategory } from "@/lib/donation-categories";
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

    const donation = await db.donation.create({
      data: {
        donorName: validated.donorName?.trim() || null,
        donorEmail: validated.donorEmail.trim(),
        amount: validated.amount,
        category: validated.category,
        provider: "stripe",
        status: "pending",
      },
    });

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      redirect_on_completion: "if_required",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Donation - ${getCategoryLabel(validated.category)}`,
              description: getCategoryLabel(validated.category),
            },
            unit_amount: validated.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${SITE_URL}/donations/success?provider=stripe&donationId=${donation.id}&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: validated.donorEmail,
      metadata: {
        donationId: donation.id,
        category: validated.category,
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
