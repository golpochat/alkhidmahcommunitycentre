import { getPaymentSettings } from "../src/lib/payment-settings";
import { getStripe } from "../src/lib/stripe";

async function main() {
  const settings = await getPaymentSettings();
  console.log("stripe_enabled:", settings.stripeEnabled);
  console.log("publishable_key:", settings.stripePublishableKey.slice(0, 20) + "...");
  console.log("secret_key length:", settings.stripeSecretKey.length);
  console.log("webhook_secret length:", settings.stripeWebhookSecret.length);

  const stripe = await getStripe();
  if (!stripe) {
    console.log("Stripe client: not configured");
    return;
  }

  try {
    await stripe.balance.retrieve();
    console.log("Stripe secret key: valid");
  } catch (error) {
    console.log(
      "Stripe secret key: invalid -",
      error instanceof Error ? error.message : error
    );
  }
}

main();
