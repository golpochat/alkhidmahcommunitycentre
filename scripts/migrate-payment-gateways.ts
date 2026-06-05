/**
 * Migrates legacy payment keys from Setting into PaymentGateway rows.
 * Run after `npm run db:push` creates the PaymentGateway table.
 *
 *   npm run db:migrate-payment
 */
import { PrismaClient } from "@prisma/client";
import { encryptSecret } from "../src/lib/encryption";

const prisma = new PrismaClient();

const KEYS = {
  stripeEnabled: "stripe_enabled",
  stripePublishableKey: "stripe_publishable_key",
  stripeSecretKey: "stripe_secret_key",
  stripeWebhookSecret: "stripe_webhook_secret",
  paypalEnabled: "paypal_enabled",
  paypalClientId: "paypal_client_id",
  paypalClientSecret: "paypal_client_secret",
  paypalMode: "paypal_mode",
  donationCurrency: "donation_currency",
} as const;

async function main() {
  const existing = await prisma.paymentGateway.count();
  if (existing > 0) {
    console.log("PaymentGateway already has rows; skipping.");
    return;
  }

  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  });

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const currency = map[KEYS.donationCurrency] || "EUR";

  if (
    map[KEYS.stripeEnabled] === "true" &&
    (map[KEYS.stripePublishableKey] || map[KEYS.stripeSecretKey])
  ) {
    await prisma.paymentGateway.create({
      data: {
        name: "Stripe",
        type: "STRIPE",
        isEnabled: true,
        currency,
        publicConfig: {
          publishableKey: map[KEYS.stripePublishableKey] || "",
        },
        secretsEnc: encryptSecret(
          JSON.stringify({
            secretKey: map[KEYS.stripeSecretKey] || "",
            webhookSecret: map[KEYS.stripeWebhookSecret] || "",
          })
        ),
      },
    });
    console.log("Migrated Stripe gateway.");
  }

  if (
    map[KEYS.paypalEnabled] === "true" &&
    (map[KEYS.paypalClientId] || map[KEYS.paypalClientSecret])
  ) {
    await prisma.paymentGateway.create({
      data: {
        name: "PayPal",
        type: "PAYPAL",
        isEnabled: true,
        currency,
        publicConfig: {
          clientId: map[KEYS.paypalClientId] || "",
          mode: map[KEYS.paypalMode] === "live" ? "live" : "sandbox",
        },
        secretsEnc: encryptSecret(
          JSON.stringify({
            clientSecret: map[KEYS.paypalClientSecret] || "",
          })
        ),
      },
    });
    console.log("Migrated PayPal gateway.");
  }

  console.log("Payment gateway migration finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
