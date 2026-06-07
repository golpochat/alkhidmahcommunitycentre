"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateDonationFeeBreakdown,
  formatDonationCents,
  formatDonationMoney,
  normalizeGatewayFeeConfig,
  type GatewayFeeConfig,
} from "@/lib/donation-processing-fee";

interface DonationProcessingFeeOptionProps {
  amount: number;
  currency: string;
  feeConfig: GatewayFeeConfig;
  coverProcessingFee: boolean;
  disabled?: boolean;
  onCoverProcessingFeeChange: (value: boolean) => void;
}

export function DonationProcessingFeeOption({
  amount,
  currency,
  feeConfig,
  coverProcessingFee,
  disabled = false,
  onCoverProcessingFeeChange,
}: DonationProcessingFeeOptionProps) {
  const normalizedFeeConfig = normalizeGatewayFeeConfig(feeConfig);
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;

  if (!normalizedFeeConfig.allowCoverFee || safeAmount < 1) {
    return null;
  }

  const breakdown = calculateDonationFeeBreakdown(
    safeAmount,
    normalizedFeeConfig,
    coverProcessingFee,
  );
  const feePreview = calculateDonationFeeBreakdown(safeAmount, normalizedFeeConfig, true);
  const totalLabel = coverProcessingFee
    ? formatDonationCents(breakdown.totalCents, currency)
    : formatDonationMoney(safeAmount, currency);

  return (
    <div className="donation-fee-option space-y-3">
      <label className="donation-fee-option-checkbox">
        <Checkbox
          checked={coverProcessingFee}
          disabled={disabled}
          onCheckedChange={(checked) => onCoverProcessingFeeChange(Boolean(checked))}
        />
        <span>
          Add{" "}
          <strong>{formatDonationCents(feePreview.processingFeeCents, currency)}</strong>{" "}
          to cover payment processing fees
        </span>
      </label>

      <div className="text-[clamp(0.85rem,1.2vw,1rem)] text-white/80 leading-relaxed mt-1">
        By covering the small processing fee, you ensure your full donation reaches the
        mosque — and your reward remains complete.
      </div>

      <dl className="donation-fee-summary">
        <div className="donation-fee-summary-row">
          <dt>Donation</dt>
          <dd>{formatDonationMoney(safeAmount, currency)}</dd>
        </div>
        {coverProcessingFee && breakdown.processingFeeCents > 0 ? (
          <div className="donation-fee-summary-row">
            <dt>Processing fee</dt>
            <dd>{formatDonationCents(breakdown.processingFeeCents, currency)}</dd>
          </div>
        ) : null}
        <div className="donation-fee-summary-row donation-fee-summary-row-total">
          <dt>{coverProcessingFee ? "Total to pay" : "You pay"}</dt>
          <dd>{totalLabel}</dd>
        </div>
      </dl>

      <p className="donation-fee-option-note text-xs text-muted-foreground">
        {coverProcessingFee
          ? "The extra amount covers card or PayPal fees so the full donation reaches the mosque."
          : "Payment provider fees are deducted from your donation amount."}
      </p>
    </div>
  );
}
