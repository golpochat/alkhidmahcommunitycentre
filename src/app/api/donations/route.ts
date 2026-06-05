import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeDonation } from "@/lib/donations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const donations = await db.donation.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(donations.map(serializeDonation));
  } catch {
    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }
}
