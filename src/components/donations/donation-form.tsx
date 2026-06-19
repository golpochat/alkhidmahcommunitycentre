"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CreditCard, Loader2 } from "lucide-react";
import { DonationLegalNotice } from "@/components/legal/donation-legal-notice";
import { DonationAmountSelector } from "@/components/donations/donation-amount-selector";
import { DonationProcessingFeeOption } from "@/components/donations/donation-processing-fee-option";
import { DonationStripeEmbedded } from "@/components/donations/donation-stripe-embedded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDonationMoney, type GatewayFeeConfig } from "@/lib/donation-processing-fee";
import type { BankTransferDetails } from "@/lib/payment-gateway-types";
import {
  donationFormSchema,
  type DonationFormValues,
} from "@/lib/validations";

interface BankTransferResult {
  accountName: string;
  bankName: string;
  iban: string;
  bic: string;
  reference: string;
  currency: string;
  amount: number;
  donationId: string;
}

interface DonationFormProps {
  category: DonationFormValues["category"];
  donationCurrency: string;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeFee: GatewayFeeConfig | null;
  paypalEnabled: boolean;
  paypalFee: GatewayFeeConfig | null;
  bankTransferEnabled: boolean;
  bankTransfer: BankTransferDetails | null;
  defaultDonorEmail?: string;
  defaultDonorName?: string;
  onSubmitting?: (submitting: boolean) => void;
  onError?: (message: string) => void;
}

function defaultProvider(
  stripeEnabled: boolean,
  paypalEnabled: boolean,
  bankTransferEnabled: boolean
): DonationFormValues["provider"] {
  if (stripeEnabled) return "stripe";
  if (paypalEnabled) return "paypal";
  if (bankTransferEnabled) return "bank_transfer";
  return "stripe";
}

export function DonationForm({
  category,
  donationCurrency,
  stripeEnabled,
  stripePublishableKey,
  stripeFee,
  paypalEnabled,
  paypalFee,
  bankTransferEnabled,
  defaultDonorEmail = "",
  defaultDonorName = "",
  onSubmitting,
  onError,
}: DonationFormProps) {
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [stripeDonationId, setStripeDonationId] = useState<string | null>(null);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankTransferResult | null>(null);

  const hasAnyMethod = stripeEnabled || paypalEnabled || bankTransferEnabled;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      category,
      amount: 20,
      donorName: defaultDonorName,
      donorEmail: defaultDonorEmail,
      provider: defaultProvider(stripeEnabled, paypalEnabled, bankTransferEnabled),
      coverProcessingFee: false,
    },
  });

  const amount = watch("amount");
  const provider = watch("provider");
  const coverProcessingFee = watch("coverProcessingFee");

  const activeFeeConfig =
    provider === "stripe" ? stripeFee : provider === "paypal" ? paypalFee : null;

  useEffect(() => {
    setShowStripeCheckout(false);
    setStripeClientSecret(null);
    setStripeDonationId(null);
    setStripeSessionId(null);
    setCheckoutError(null);
  }, [amount, provider, coverProcessingFee]);

  async function onPayPalSubmit(data: DonationFormValues) {
    onSubmitting?.(true);
    try {
      const response = await fetch("/api/donations/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          provider: "paypal",
          donorName: data.donorName?.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Unable to start PayPal checkout");
      }

      window.location.href = result.url;
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Donation failed. Please try again."
      );
    } finally {
      onSubmitting?.(false);
    }
  }

  async function onBankTransferSubmit(data: DonationFormValues) {
    onSubmitting?.(true);
    try {
      const response = await fetch("/api/donations/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          provider: "bank_transfer",
          donorName: data.donorName?.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.bankDetails) {
        throw new Error(result.error || "Unable to load bank details");
      }

      setBankDetails({
        ...result.bankDetails,
        donationId: result.donationId,
      });
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Donation failed. Please try again."
      );
    } finally {
      onSubmitting?.(false);
    }
  }

  async function handleContinue() {
    const valid = await trigger();
    if (!valid) {
      return;
    }

    if (provider === "bank_transfer") {
      await handleSubmit(onBankTransferSubmit)();
      return;
    }

    if (provider === "stripe") {
      setCheckoutError(null);
      setLoadingCheckout(true);
      onSubmitting?.(true);
      try {
        const data = getValues();
        const response = await fetch("/api/donations/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok || !result.clientSecret) {
          throw new Error(result.error || "Unable to load card payment form");
        }
        setStripeClientSecret(result.clientSecret);
        setStripeDonationId(result.donationId ?? null);
        setStripeSessionId(result.sessionId ?? null);
        setShowStripeCheckout(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to start card payment";
        setCheckoutError(message);
        onError?.(message);
      } finally {
        setLoadingCheckout(false);
        onSubmitting?.(false);
      }
      return;
    }

    await handleSubmit(onPayPalSubmit)();
  }

  function handleProviderChange(next: DonationFormValues["provider"]) {
    setValue("provider", next, { shouldValidate: true });
    if (next === "bank_transfer") {
      setValue("coverProcessingFee", false);
    }
    setShowStripeCheckout(false);
    setStripeClientSecret(null);
    setStripeDonationId(null);
    setStripeSessionId(null);
    setCheckoutError(null);
    setBankDetails(null);
  }

  function continueLabel() {
    if (provider === "stripe") return "Continue to card payment";
    if (provider === "paypal") return "Continue to PayPal";
    return "View bank transfer details";
  }

  function providerHint() {
    if (provider === "stripe") {
      return "Click Continue to card payment — Stripe’s secure card fields will appear in the box below.";
    }
    if (provider === "paypal") {
      return "You will complete payment on PayPal’s secure site (no card fields on this page).";
    }
    return "You will receive our bank account details to complete the transfer manually.";
  }

  if (bankDetails) {
    return (
      <div className="donation-bank-details space-y-4">
        <p className="text-sm text-muted-foreground">
          Please transfer{" "}
          <strong>{formatDonationMoney(bankDetails.amount, bankDetails.currency)}</strong>{" "}
          using the details below. Use the reference exactly so we can match your
          donation.
        </p>
        <dl className="email-setting-view-list rounded-lg border border-border p-4">
          <div>
            <dt>Account name</dt>
            <dd>{bankDetails.accountName}</dd>
          </div>
          {bankDetails.bankName && (
            <div>
              <dt>Bank</dt>
              <dd>{bankDetails.bankName}</dd>
            </div>
          )}
          <div>
            <dt>IBAN</dt>
            <dd className="font-mono text-sm">{bankDetails.iban}</dd>
          </div>
          {bankDetails.bic && (
            <div>
              <dt>BIC / SWIFT</dt>
              <dd className="font-mono text-sm">{bankDetails.bic}</dd>
            </div>
          )}
          <div>
            <dt>Payment reference</dt>
            <dd className="font-medium text-gold">{bankDetails.reference}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Reference ID: {bankDetails.donationId}. We will email your receipt after
          we confirm the transfer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input type="hidden" {...register("category")} value={category} />

      <DonationAmountSelector
        value={amount}
        onChange={(value) => setValue("amount", value, { shouldValidate: true })}
      />
      {errors.amount && (
        <p className="text-sm text-destructive">{errors.amount.message}</p>
      )}

      {activeFeeConfig ? (
        <DonationProcessingFeeOption
          amount={amount}
          currency={donationCurrency}
          feeConfig={activeFeeConfig}
          coverProcessingFee={Boolean(coverProcessingFee)}
          disabled={showStripeCheckout}
          onCoverProcessingFeeChange={(value) =>
            setValue("coverProcessingFee", value, { shouldValidate: true })
          }
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="donorName">Donor Name (optional)</Label>
        <Input
          id="donorName"
          {...register("donorName")}
          placeholder="Your name"
          disabled={showStripeCheckout}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="donorEmail">Donor Email</Label>
        <Input
          id="donorEmail"
          type="email"
          required
          {...register("donorEmail")}
          placeholder="you@example.com"
          disabled={showStripeCheckout}
        />
        {errors.donorEmail && (
          <p className="text-sm text-destructive">{errors.donorEmail.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Required — your PDF receipt will be emailed after payment is confirmed.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Payment method</Label>
        {!hasAnyMethod ? (
          <p className="text-sm text-destructive">
            Online payments are not available right now. Please contact the mosque
            office.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stripeEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={showStripeCheckout}
                  onClick={() => handleProviderChange("stripe")}
                  className={cn(
                    provider === "stripe" && "border-gold bg-gold/10 text-gold"
                  )}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card (Stripe)
                </Button>
              )}
              {paypalEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={showStripeCheckout}
                  onClick={() => handleProviderChange("paypal")}
                  className={cn(
                    provider === "paypal" && "border-gold bg-gold/10 text-gold"
                  )}
                >
                  PayPal
                </Button>
              )}
              {bankTransferEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={showStripeCheckout}
                  onClick={() => handleProviderChange("bank_transfer")}
                  className={cn(
                    provider === "bank_transfer" &&
                      "border-gold bg-gold/10 text-gold"
                  )}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Bank Transfer
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{providerHint()}</p>
          </>
        )}
      </div>

      {!showStripeCheckout && hasAnyMethod && (
        <div className="space-y-3">
          <DonationLegalNotice />
          <Button
            type="button"
            className="btn-gold w-full"
            size="lg"
            disabled={isSubmitting || loadingCheckout}
            onClick={handleContinue}
          >
            {(isSubmitting || loadingCheckout) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {continueLabel()}
          </Button>
        </div>
      )}

      {provider === "stripe" && stripeEnabled && (
        <div className="donation-card-payment-zone">
          <p className="donation-card-payment-zone-label">Card payment</p>
          {loadingCheckout && (
            <div className="donation-card-payment-zone-loading">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
              <p className="text-sm text-muted-foreground">Loading secure card form…</p>
            </div>
          )}
          {!loadingCheckout && checkoutError && (
            <p className="text-sm text-destructive">{checkoutError}</p>
          )}
          {!loadingCheckout && !checkoutError && !showStripeCheckout && (
            <p className="text-sm text-muted-foreground">
              Card number, expiry date, and CVV will appear here after you click
              Continue to card payment.
            </p>
          )}
          {showStripeCheckout &&
            stripeClientSecret &&
            stripeDonationId &&
            stripeSessionId && (
              <DonationStripeEmbedded
                clientSecret={stripeClientSecret}
                publishableKey={stripePublishableKey}
                donationId={stripeDonationId}
                sessionId={stripeSessionId}
              />
            )}
        </div>
      )}
    </div>
  );
}
