import "server-only";

import type { PaymentGatewayType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";
import type { PaymentGatewayTypeId } from "@/lib/payment-gateway-presets";
import { SETTING_KEYS } from "@/lib/settings";

export interface StripePublicConfig {
  publishableKey: string;
}

export interface StripeSecrets {
  secretKey: string;
  webhookSecret: string;
}

export interface PayPalPublicConfig {
  clientId: string;
  mode: "sandbox" | "live";
}

export interface PayPalSecrets {
  clientSecret: string;
}

export interface BankTransferPublicConfig {
  accountName: string;
  bankName: string;
  iban: string;
  bic: string;
  referenceNote: string;
}

export interface PaymentGatewayInput {
  name: string;
  type: PaymentGatewayTypeId;
  isEnabled?: boolean;
  currency: string;
  stripe?: StripePublicConfig & Partial<StripeSecrets>;
  paypal?: PayPalPublicConfig & Partial<PayPalSecrets>;
  bankTransfer?: BankTransferPublicConfig;
}

export interface PublicPaymentGateway {
  id: string;
  name: string;
  type: PaymentGatewayTypeId;
  isEnabled: boolean;
  currency: string;
  hasSecrets: boolean;
  publishableKey?: string;
  paypalMode?: string;
  paypalClientId?: string;
  accountName?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
  referenceNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedStripeGateway {
  id: string;
  currency: string;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface ResolvedPayPalGateway {
  id: string;
  currency: string;
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
}

export interface ResolvedBankTransferGateway {
  id: string;
  currency: string;
  accountName: string;
  bankName: string;
  iban: string;
  bic: string;
  referenceNote: string;
}

function toTypeId(type: PaymentGatewayType): PaymentGatewayTypeId {
  if (type === "STRIPE" || type === "PAYPAL" || type === "BANK_TRANSFER") {
    return type;
  }
  return "STRIPE";
}

function parsePublicConfig(
  type: PaymentGatewayType,
  publicConfig: Prisma.JsonValue
) {
  const config =
    publicConfig && typeof publicConfig === "object" && !Array.isArray(publicConfig)
      ? (publicConfig as Record<string, string>)
      : {};

  if (type === "STRIPE") {
    return { publishableKey: config.publishableKey ?? "" };
  }

  if (type === "PAYPAL") {
    return {
      paypalClientId: config.clientId ?? "",
      paypalMode: config.mode === "live" ? "live" : "sandbox",
    };
  }

  return {
    accountName: config.accountName ?? "",
    bankName: config.bankName ?? "",
    iban: config.iban ?? "",
    bic: config.bic ?? "",
    referenceNote: config.referenceNote ?? "",
  };
}

function decryptSecrets(stored: string): Record<string, string> {
  if (!stored) {
    return {};
  }

  try {
    const raw = decryptSecret(stored);
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function encryptSecrets(secrets: Record<string, string>) {
  return encryptSecret(JSON.stringify(secrets));
}

function buildPublicConfig(input: PaymentGatewayInput): Prisma.InputJsonValue {
  if (input.type === "STRIPE" && input.stripe) {
    return { publishableKey: input.stripe.publishableKey.trim() };
  }

  if (input.type === "PAYPAL" && input.paypal) {
    return {
      clientId: input.paypal.clientId.trim(),
      mode: input.paypal.mode,
    };
  }

  if (input.type === "BANK_TRANSFER" && input.bankTransfer) {
    return {
      accountName: input.bankTransfer.accountName.trim(),
      bankName: input.bankTransfer.bankName.trim(),
      iban: input.bankTransfer.iban.trim(),
      bic: input.bankTransfer.bic.trim(),
      referenceNote: input.bankTransfer.referenceNote.trim(),
    };
  }

  return {};
}

function buildSecrets(
  input: PaymentGatewayInput,
  currentEnc: string
): Record<string, string> {
  const current = decryptSecrets(currentEnc);

  if (input.type === "STRIPE") {
    return {
      secretKey:
        input.stripe?.secretKey?.trim() || current.secretKey || "",
      webhookSecret:
        input.stripe?.webhookSecret?.trim() || current.webhookSecret || "",
    };
  }

  if (input.type === "PAYPAL") {
    return {
      clientSecret:
        input.paypal?.clientSecret?.trim() || current.clientSecret || "",
    };
  }

  return {};
}

function validateSecrets(type: PaymentGatewayTypeId, secrets: Record<string, string>) {
  if (type === "STRIPE") {
    if (!secrets.secretKey) {
      throw new Error("Stripe secret key is required");
    }
    if (!secrets.webhookSecret) {
      throw new Error("Stripe webhook secret is required");
    }
  }

  if (type === "PAYPAL" && !secrets.clientSecret) {
    throw new Error("PayPal client secret is required");
  }
}

function toPublic(record: {
  id: string;
  name: string;
  type: PaymentGatewayType;
  isEnabled: boolean;
  currency: string;
  publicConfig: Prisma.JsonValue;
  secretsEnc: string;
  createdAt: Date;
  updatedAt: Date;
}): PublicPaymentGateway {
  return {
    id: record.id,
    name: record.name,
    type: toTypeId(record.type),
    isEnabled: record.isEnabled,
    currency: record.currency,
    hasSecrets: Boolean(record.secretsEnc) || record.type === "BANK_TRANSFER",
    ...parsePublicConfig(record.type, record.publicConfig),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function readLegacyPaymentSettings() {
  const keys = [
    SETTING_KEYS.stripeEnabled,
    SETTING_KEYS.stripePublishableKey,
    SETTING_KEYS.stripeSecretKey,
    SETTING_KEYS.stripeWebhookSecret,
    SETTING_KEYS.paypalEnabled,
    SETTING_KEYS.paypalClientId,
    SETTING_KEYS.paypalClientSecret,
    SETTING_KEYS.paypalMode,
    SETTING_KEYS.donationCurrency,
  ];

  const rows = await db.setting.findMany({
    where: { key: { in: keys } },
  });

  if (rows.length === 0) {
    return null;
  }

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

async function migrateLegacyIfEmpty() {
  const count = await db.paymentGateway.count();
  if (count > 0) {
    return;
  }

  const map = await readLegacyPaymentSettings();
  if (!map) {
    return;
  }

  const currency = map[SETTING_KEYS.donationCurrency] || "EUR";

  if (
    map[SETTING_KEYS.stripeEnabled] === "true" &&
    (map[SETTING_KEYS.stripePublishableKey] || map[SETTING_KEYS.stripeSecretKey])
  ) {
    await db.paymentGateway.create({
      data: {
        name: "Stripe",
        type: "STRIPE",
        isEnabled: true,
        currency,
        publicConfig: {
          publishableKey: map[SETTING_KEYS.stripePublishableKey] || "",
        },
        secretsEnc: encryptSecrets({
          secretKey: map[SETTING_KEYS.stripeSecretKey] || "",
          webhookSecret: map[SETTING_KEYS.stripeWebhookSecret] || "",
        }),
      },
    });
  }

  if (
    map[SETTING_KEYS.paypalEnabled] === "true" &&
    (map[SETTING_KEYS.paypalClientId] || map[SETTING_KEYS.paypalClientSecret])
  ) {
    await db.paymentGateway.create({
      data: {
        name: "PayPal",
        type: "PAYPAL",
        isEnabled: true,
        currency,
        publicConfig: {
          clientId: map[SETTING_KEYS.paypalClientId] || "",
          mode: map[SETTING_KEYS.paypalMode] === "live" ? "live" : "sandbox",
        },
        secretsEnc: encryptSecrets({
          clientSecret: map[SETTING_KEYS.paypalClientSecret] || "",
        }),
      },
    });
  }
}

export async function listPublicPaymentGateways(): Promise<PublicPaymentGateway[]> {
  await migrateLegacyIfEmpty();
  const records = await db.paymentGateway.findMany({
    orderBy: [{ isEnabled: "desc" }, { name: "asc" }],
  });
  return records.map(toPublic);
}

export async function getPublicPaymentGateway(
  id: string
): Promise<PublicPaymentGateway | null> {
  await migrateLegacyIfEmpty();
  const record = await db.paymentGateway.findUnique({ where: { id } });
  return record ? toPublic(record) : null;
}

function resolveStripe(record: {
  id: string;
  currency: string;
  publicConfig: Prisma.JsonValue;
  secretsEnc: string;
}): ResolvedStripeGateway | null {
  const publicFields = parsePublicConfig("STRIPE", record.publicConfig);
  const secrets = decryptSecrets(record.secretsEnc);
  const publishableKey = publicFields.publishableKey ?? "";

  if (!publishableKey || !secrets.secretKey) {
    return null;
  }

  return {
    id: record.id,
    currency: record.currency,
    publishableKey,
    secretKey: secrets.secretKey,
    webhookSecret: secrets.webhookSecret || "",
  };
}

function resolvePayPal(record: {
  id: string;
  currency: string;
  publicConfig: Prisma.JsonValue;
  secretsEnc: string;
}): ResolvedPayPalGateway | null {
  const publicFields = parsePublicConfig("PAYPAL", record.publicConfig);
  const secrets = decryptSecrets(record.secretsEnc);
  const clientId = publicFields.paypalClientId ?? "";

  if (!clientId || !secrets.clientSecret) {
    return null;
  }

  return {
    id: record.id,
    currency: record.currency,
    clientId,
    clientSecret: secrets.clientSecret,
    mode: publicFields.paypalMode === "live" ? "live" : "sandbox",
  };
}

function resolveBankTransfer(record: {
  id: string;
  currency: string;
  publicConfig: Prisma.JsonValue;
}): ResolvedBankTransferGateway | null {
  const publicFields = parsePublicConfig("BANK_TRANSFER", record.publicConfig);

  if (!publicFields.iban || !publicFields.accountName) {
    return null;
  }

  return {
    id: record.id,
    currency: record.currency,
    accountName: publicFields.accountName ?? "",
    bankName: publicFields.bankName ?? "",
    iban: publicFields.iban ?? "",
    bic: publicFields.bic ?? "",
    referenceNote: publicFields.referenceNote ?? "",
  };
}

export async function getEnabledStripeGateway() {
  await migrateLegacyIfEmpty();
  const record = await db.paymentGateway.findFirst({
    where: { type: "STRIPE", isEnabled: true },
    orderBy: { updatedAt: "desc" },
  });
  return record ? resolveStripe(record) : null;
}

export async function getEnabledPayPalGateway() {
  await migrateLegacyIfEmpty();
  const record = await db.paymentGateway.findFirst({
    where: { type: "PAYPAL", isEnabled: true },
    orderBy: { updatedAt: "desc" },
  });
  return record ? resolvePayPal(record) : null;
}

export async function getEnabledBankTransferGateway() {
  await migrateLegacyIfEmpty();
  const record = await db.paymentGateway.findFirst({
    where: { type: "BANK_TRANSFER", isEnabled: true },
    orderBy: { updatedAt: "desc" },
  });
  return record ? resolveBankTransfer(record) : null;
}

export async function createPaymentGateway(input: PaymentGatewayInput) {
  const secrets = buildSecrets(input, "");
  if (input.type !== "BANK_TRANSFER") {
    validateSecrets(input.type, secrets);
  }

  const record = await db.paymentGateway.create({
    data: {
      name: input.name.trim(),
      type: input.type,
      isEnabled: input.isEnabled ?? true,
      currency: input.currency.trim().toUpperCase() || "EUR",
      publicConfig: buildPublicConfig(input),
      secretsEnc: input.type === "BANK_TRANSFER" ? "" : encryptSecrets(secrets),
    },
  });

  return toPublic(record);
}

export async function updatePaymentGateway(
  id: string,
  input: PaymentGatewayInput
) {
  const current = await db.paymentGateway.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Payment gateway not found");
  }

  const secrets = buildSecrets(input, current.secretsEnc);
  if (input.type !== "BANK_TRANSFER") {
    validateSecrets(input.type, secrets);
  }

  const record = await db.paymentGateway.update({
    where: { id },
    data: {
      name: input.name.trim(),
      type: input.type,
      currency: input.currency.trim().toUpperCase() || "EUR",
      publicConfig: buildPublicConfig(input),
      secretsEnc:
        input.type === "BANK_TRANSFER" ? "" : encryptSecrets(secrets),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
    },
  });

  return toPublic(record);
}

export async function deletePaymentGateway(id: string) {
  const current = await db.paymentGateway.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Payment gateway not found");
  }

  await db.paymentGateway.delete({ where: { id } });
}

export async function setPaymentGatewayEnabled(id: string, isEnabled: boolean) {
  const current = await db.paymentGateway.findUnique({ where: { id } });
  if (!current) {
    throw new Error("Payment gateway not found");
  }

  const record = await db.paymentGateway.update({
    where: { id },
    data: { isEnabled },
  });

  return toPublic(record);
}
