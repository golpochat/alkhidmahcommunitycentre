import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDonationReceiptPdf } from "@/lib/generate-donation-receipt";

export const runtime = "nodejs";

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

    if (donation.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "Receipt is available once payment has succeeded",
          status: donation.status,
        },
        { status: 409 }
      );
    }

    const { buffer, filename } = await generateDonationReceiptPdf(donation);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Donation receipt PDF failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
