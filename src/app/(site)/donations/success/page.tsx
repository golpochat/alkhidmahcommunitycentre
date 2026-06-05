"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DonationSuccess } from "@/components/donations/donation-success";

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || undefined;
  const donationId = searchParams.get("donationId");
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("token");
  const [processing, setProcessing] = useState(
    provider === "paypal" || provider === "stripe"
  );

  useEffect(() => {
    async function finalizePayment() {
      if (provider === "paypal") {
        if (!donationId || !orderId) {
          setProcessing(false);
          return;
        }

        try {
          await fetch("/api/donations/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donationId, orderId }),
          });
        } finally {
          setProcessing(false);
        }
        return;
      }

      if (provider === "stripe") {
        if (!donationId || !sessionId) {
          setProcessing(false);
          return;
        }

        try {
          await fetch("/api/donations/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donationId, sessionId }),
          });
        } finally {
          setProcessing(false);
        }
        return;
      }

      setProcessing(false);
    }

    finalizePayment();
  }, [provider, donationId, sessionId, orderId]);

  if (processing) {
    return (
      <section className="section-padding">
        <div className="section-container flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding">
      <div className="section-container">
        <DonationSuccess provider={provider} donationId={donationId ?? undefined} />
      </div>
    </section>
  );
}
