import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeDonation } from "@/lib/donations";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const donation = await db.donation.findUnique({
      where: { id: params.id },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    const serialized = serializeDonation(donation);

    return NextResponse.json({
      ...serialized,
      receiptAvailable: donation.status === "succeeded",
      receiptUrl:
        donation.status === "succeeded"
          ? `/api/donations/${donation.id}/receipt`
          : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load donation" }, { status: 500 });
  }
}
