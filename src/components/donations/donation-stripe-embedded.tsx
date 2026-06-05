"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useMemo } from "react";

interface DonationStripeEmbeddedProps {
  clientSecret: string;
  publishableKey: string;
  donationId: string;
  sessionId: string;
}

export function DonationStripeEmbedded({
  clientSecret,
  publishableKey,
  donationId,
  sessionId,
}: DonationStripeEmbeddedProps) {
  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (!publishableKey.trim()) {
      return null;
    }
    return loadStripe(publishableKey.trim());
  }, [publishableKey]);

  const checkoutOptions = useMemo(
    () => ({
      clientSecret,
      onComplete: () => {
        const params = new URLSearchParams({
          provider: "stripe",
          donationId,
          session_id: sessionId,
        });
        window.location.assign(`/donations/success?${params.toString()}`);
      },
    }),
    [clientSecret, donationId, sessionId]
  );

  if (!publishableKey.trim() || !stripePromise) {
    return (
      <p className="text-sm text-destructive">
        Card payments are not configured. Please contact the mosque office or use
        PayPal.
      </p>
    );
  }

  return (
    <div className="donation-stripe-embedded">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
