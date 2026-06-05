import { SITE_URL } from "@/lib/constants";
import { getEnabledPayPalGateway } from "@/lib/payment-gateway-store";

function getPayPalApiBase(mode: "sandbox" | "live") {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
  const gateway = await getEnabledPayPalGateway();

  if (!gateway?.clientId || !gateway.clientSecret) {
    throw new Error("PayPal is not configured");
  }

  const credentials = Buffer.from(
    `${gateway.clientId}:${gateway.clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${getPayPalApiBase(gateway.mode)}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function createPayPalOrder(input: {
  amount: number;
  currency: string;
  category: string;
  donationId: string;
}) {
  const gateway = await getEnabledPayPalGateway();
  if (!gateway) {
    throw new Error("PayPal is not configured");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(
    `${getPayPalApiBase(gateway.mode)}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: input.donationId,
            description: `Donation - ${input.category}`,
            amount: {
              currency_code: input.currency,
              value: input.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Al Khidmah Community Centre",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${SITE_URL}/donations/success?provider=paypal&donationId=${input.donationId}`,
          cancel_url: `${SITE_URL}/donations/error?provider=paypal`,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create PayPal order");
  }

  const order = await response.json();
  const approvalUrl = order.links?.find(
    (link: { rel: string; href: string }) => link.rel === "approve"
  )?.href;

  if (!approvalUrl) {
    throw new Error("PayPal approval URL not found");
  }

  return {
    orderId: order.id as string,
    approvalUrl: approvalUrl as string,
  };
}

export async function capturePayPalOrder(orderId: string) {
  const gateway = await getEnabledPayPalGateway();
  if (!gateway) {
    throw new Error("PayPal is not configured");
  }

  const accessToken = await getAccessToken();

  const response = await fetch(
    `${getPayPalApiBase(gateway.mode)}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to capture PayPal payment");
  }

  return response.json();
}
