"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getCategoryLabel,
  type SerializedDonation,
} from "@/lib/donations";

interface DonationSuccessProps {
  provider?: string;
  donationId?: string;
}

interface DonationStatusResponse extends SerializedDonation {
  receiptAvailable: boolean;
  receiptUrl: string | null;
}

function formatProviderLabel(provider?: string) {
  if (provider === "stripe") return "Stripe";
  if (provider === "paypal") return "PayPal";
  if (provider === "bank_transfer") return "Bank Transfer";
  if (!provider) return "";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function formatReference(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatAmount(amount: number, currency: string) {
  const symbol = currency.toUpperCase() === "EUR" ? "€" : `${currency.toUpperCase()} `;
  return `${symbol}${amount}`;
}

export function DonationSuccess({ provider, donationId }: DonationSuccessProps) {
  const [loadingReceipt, setLoadingReceipt] = useState(Boolean(donationId));
  const [donation, setDonation] = useState<DonationStatusResponse | null>(null);

  useEffect(() => {
    if (!donationId) {
      setLoadingReceipt(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    async function pollDonationStatus() {
      try {
        const response = await fetch(`/api/donations/${donationId}`);
        if (!response.ok) {
          if (!cancelled) {
            setLoadingReceipt(false);
          }
          return;
        }

        const data = (await response.json()) as DonationStatusResponse;
        if (cancelled) {
          return;
        }

        setDonation(data);

        if (data.receiptAvailable && data.receiptUrl) {
          setLoadingReceipt(false);
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts && data.status === "pending") {
          window.setTimeout(pollDonationStatus, 2000);
          return;
        }

        setLoadingReceipt(false);
      } catch {
        if (!cancelled) {
          setLoadingReceipt(false);
        }
      }
    }

    pollDonationStatus();

    return () => {
      cancelled = true;
    };
  }, [donationId]);

  const paymentProvider = formatProviderLabel(donation?.provider ?? provider);
  const receiptReady = Boolean(donation?.receiptUrl);
  const isPending = donation?.status === "pending";

  return (
    <Card className="donation-success-card mx-auto max-w-lg border-gold/30 text-center shadow-gold">
      <CardContent className="donation-success-content">
        <div className="donation-success-header">
          <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
          <h1 className="font-heading text-3xl font-semibold">Thank You</h1>
          <p className="text-muted-foreground">
            {paymentProvider
              ? `Your ${paymentProvider} donation was processed successfully.`
              : "Your donation was processed successfully."}
          </p>
          {donation?.donorEmail && (
            <p className="text-sm text-muted-foreground">
              A PDF receipt has been sent to{" "}
              <span className="font-medium text-foreground">{donation.donorEmail}</span>.
            </p>
          )}
        </div>

        {donation && (
          <dl className="donation-success-summary">
            <div className="donation-success-summary-row">
              <dt className="donation-success-summary-label">Category</dt>
              <dd className="donation-success-summary-value">
                {getCategoryLabel(donation.category)}
              </dd>
            </div>
            <div className="donation-success-summary-row">
              <dt className="donation-success-summary-label">Amount</dt>
              <dd className="donation-success-summary-value text-gold">
                {formatAmount(donation.amount, donation.currency)}
              </dd>
            </div>
            <div className="donation-success-summary-row">
              <dt className="donation-success-summary-label">Reference</dt>
              <dd className="donation-success-summary-value">
                {formatReference(donation.id)}
              </dd>
            </div>
            {paymentProvider && (
              <div className="donation-success-summary-row">
                <dt className="donation-success-summary-label">Payment</dt>
                <dd className="donation-success-summary-value">{paymentProvider}</dd>
              </div>
            )}
            <div className="donation-success-summary-row">
              <dt className="donation-success-summary-label">Date</dt>
              <dd className="donation-success-summary-value">
                {format(parseISO(donation.createdAt), "d MMM yyyy, HH:mm")}
              </dd>
            </div>
          </dl>
        )}

        <div className="donation-success-receipt">
          {loadingReceipt && (
            <div className="donation-success-receipt-loading">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              <span>Preparing your PDF receipt…</span>
            </div>
          )}

          {!loadingReceipt && receiptReady && donation?.receiptUrl && (
            <a
              href={donation.receiptUrl}
              download
              className={cn(
                buttonVariants({ size: "lg" }),
                "btn-gold donation-success-download"
              )}
            >
              <Download className="h-4 w-4 shrink-0" />
              Download PDF Receipt
            </a>
          )}

          {!loadingReceipt && donationId && !receiptReady && isPending && (
            <p className="text-sm text-muted-foreground">
              Your payment is still being confirmed. Refresh this page shortly or check
              your email for the receipt.
            </p>
          )}

          {!loadingReceipt && !donationId && (
            <p className="text-sm text-muted-foreground">
              If you provided an email address, your receipt is on its way.
            </p>
          )}
        </div>

        <div className="donation-success-nav">
          <ButtonLink href="/" variant="outline" className="donation-success-nav-link">
            Return Home
          </ButtonLink>
          <ButtonLink
            href="/donations"
            variant="outline"
            className="donation-success-nav-link"
          >
            Make Another Donation
          </ButtonLink>
        </div>

        <p className="donation-success-footer">
          JazakAllah khair for supporting our community.
        </p>
      </CardContent>
    </Card>
  );
}
