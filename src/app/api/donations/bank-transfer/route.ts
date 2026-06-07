import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveDonationUserId } from "@/lib/donation-user-link";
import { assertActiveDonationCategory } from "@/lib/donation-categories";
import { getEnabledBankTransferGateway } from "@/lib/payment-gateway-store";
import { donationFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = donationFormSchema.parse({
      ...body,
      provider: "bank_transfer",
    });

    await assertActiveDonationCategory(validated.category);

    if (validated.provider !== "bank_transfer") {
      return NextResponse.json({ error: "Invalid payment provider" }, { status: 400 });
    }

    const gateway = await getEnabledBankTransferGateway();
    if (!gateway) {
      return NextResponse.json(
        { error: "Bank transfer is not configured" },
        { status: 503 }
      );
    }

    const userId = await resolveDonationUserId();

    const donation = await db.donation.create({
      data: {
        donorName: validated.donorName?.trim() || null,
        donorEmail: validated.donorEmail.trim(),
        userId,
        amount: validated.amount,
        currency: gateway.currency,
        category: validated.category,
        provider: "bank_transfer",
        providerId: gateway.id,
        status: "pending",
      },
    });

    const reference =
      gateway.referenceNote ||
      `Donation ${donation.id.slice(-8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      bankDetails: {
        accountName: gateway.accountName,
        bankName: gateway.bankName,
        iban: gateway.iban,
        bic: gateway.bic,
        reference,
        currency: gateway.currency,
        amount: validated.amount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
