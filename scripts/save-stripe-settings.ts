import { db } from "../src/lib/db";
import { SETTING_KEYS } from "../src/lib/settings";

const settings: Record<string, string> = {
  [SETTING_KEYS.stripeEnabled]: "true",
  [SETTING_KEYS.stripePublishableKey]:
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
  [SETTING_KEYS.stripeSecretKey]: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  [SETTING_KEYS.stripeWebhookSecret]:
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
};

async function main() {
  if (!settings[SETTING_KEYS.stripePublishableKey]) {
    throw new Error("STRIPE_PUBLISHABLE_KEY is required");
  }

  if (!settings[SETTING_KEYS.stripeSecretKey]) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  for (const [key, value] of Object.entries(settings)) {
    if (!value && key === SETTING_KEYS.stripeWebhookSecret) {
      continue;
    }

    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    const label =
      key === SETTING_KEYS.stripeWebhookSecret
        ? value
          ? `${value.slice(0, 12)}...`
          : "(skipped)"
        : key.includes("secret")
          ? `${value.slice(0, 12)}...`
          : `${value.slice(0, 20)}...`;

    console.log(`Saved ${key}: ${label}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
