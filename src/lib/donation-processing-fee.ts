export interface GatewayFeeConfig {
  feePercent: number;
  feeFixedCents: number;
  allowCoverFee: boolean;
}

export interface DonationFeeBreakdown {
  baseAmountEuros: number;
  baseAmountCents: number;
  processingFeeCents: number;
  totalCents: number;
  coverFee: boolean;
}

export const DEFAULT_STRIPE_FEE_CONFIG: GatewayFeeConfig = {
  feePercent: 1.4,
  feeFixedCents: 25,
  allowCoverFee: true,
};

export const DEFAULT_PAYPAL_FEE_CONFIG: GatewayFeeConfig = {
  feePercent: 2.9,
  feeFixedCents: 35,
  allowCoverFee: true,
};

export function normalizeGatewayFeeConfig(
  input?: Partial<GatewayFeeConfig> | null,
  defaults: GatewayFeeConfig = DEFAULT_STRIPE_FEE_CONFIG,
): GatewayFeeConfig {
  const rawFeePercent = Number(
    input?.feePercent !== undefined && input?.feePercent !== null
      ? input.feePercent
      : defaults.feePercent,
  );
  const rawFeeFixedCents = Number(
    input?.feeFixedCents !== undefined && input?.feeFixedCents !== null
      ? input.feeFixedCents
      : defaults.feeFixedCents,
  );

  return {
    feePercent:
      Number.isFinite(rawFeePercent) && rawFeePercent >= 0
        ? rawFeePercent
        : defaults.feePercent,
    feeFixedCents:
      Number.isFinite(rawFeeFixedCents) && rawFeeFixedCents >= 0
        ? Math.round(rawFeeFixedCents)
        : defaults.feeFixedCents,
    allowCoverFee: input?.allowCoverFee ?? defaults.allowCoverFee,
  };
}

/** Fee deducted from a charge (percent + fixed), rounded to the nearest cent. */
export function calculateGatewayFeeOnCharge(
  chargeCents: number,
  config: GatewayFeeConfig,
): number {
  if (chargeCents <= 0) {
    return 0;
  }

  const normalizedConfig = normalizeGatewayFeeConfig(config);
  const rate = normalizedConfig.feePercent / 100;
  return Math.round(chargeCents * rate + normalizedConfig.feeFixedCents);
}

/** Gross-up so the mosque receives the full base amount after gateway fees. */
export function calculateDonationFeeBreakdown(
  baseAmountEuros: number,
  config: GatewayFeeConfig,
  coverFee: boolean,
): DonationFeeBreakdown {
  const normalizedConfig = normalizeGatewayFeeConfig(config);
  const safeBaseEuros = Number.isFinite(baseAmountEuros)
    ? Math.max(0, Math.floor(baseAmountEuros))
    : 0;
  const baseAmountCents = safeBaseEuros * 100;

  if (baseAmountCents <= 0) {
    return {
      baseAmountEuros: safeBaseEuros,
      baseAmountCents,
      processingFeeCents: 0,
      totalCents: 0,
      coverFee: false,
    };
  }

  const shouldCoverFee = coverFee && normalizedConfig.allowCoverFee;

  if (!shouldCoverFee) {
    const processingFeeCents = calculateGatewayFeeOnCharge(
      baseAmountCents,
      normalizedConfig,
    );

    return {
      baseAmountEuros: safeBaseEuros,
      baseAmountCents,
      processingFeeCents,
      totalCents: baseAmountCents,
      coverFee: false,
    };
  }

  const rate = normalizedConfig.feePercent / 100;
  const divisor = 1 - rate;

  if (divisor <= 0) {
    return {
      baseAmountEuros: safeBaseEuros,
      baseAmountCents,
      processingFeeCents: 0,
      totalCents: baseAmountCents,
      coverFee: false,
    };
  }

  const totalCents = Math.ceil(
    (baseAmountCents + normalizedConfig.feeFixedCents) / divisor,
  );
  const processingFeeCents = Math.max(0, totalCents - baseAmountCents);

  return {
    baseAmountEuros: safeBaseEuros,
    baseAmountCents,
    processingFeeCents,
    totalCents,
    coverFee: true,
  };
}

export function getDonationTotalCents(input: {
  amount: number;
  processingFeeCents?: number | null;
  coverFee?: boolean | null;
}) {
  const baseCents = input.amount * 100;
  const feeCents = input.processingFeeCents ?? 0;

  if (input.coverFee && feeCents > 0) {
    return baseCents + feeCents;
  }

  return baseCents;
}

/** Estimated amount the mosque receives after gateway fees. */
export function getDonationNetCents(input: {
  amount: number;
  processingFeeCents?: number | null;
  coverFee?: boolean | null;
}) {
  const baseCents = input.amount * 100;
  const feeCents = input.processingFeeCents ?? 0;

  if (input.coverFee) {
    return baseCents;
  }

  return Math.max(0, baseCents - feeCents);
}

export const DEFAULT_DONATION_CURRENCY = "EUR";

export function normalizeDonationCurrency(currency?: string | null) {
  const normalized = currency?.trim().toUpperCase();
  return normalized || DEFAULT_DONATION_CURRENCY;
}

export function formatDonationMoney(
  amountEuros: number,
  currency?: string | null,
  fractionDigits = 2,
) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: normalizeDonationCurrency(currency),
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountEuros);
}

export function formatDonationCents(cents: number, currency?: string | null) {
  return formatDonationMoney(cents / 100, currency);
}
