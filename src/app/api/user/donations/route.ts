import { NextResponse } from "next/server";
import { listActiveDonationCategories } from "@/lib/donation-categories";
import { listMemberDonations } from "@/lib/donation-user-link";
import { getCategoryLabel, serializeDonation } from "@/lib/donations";
import { requireMemberPortalSession } from "@/lib/user-portal-auth";

export async function GET() {
  try {
    const session = await requireMemberPortalSession();
    const [donations, categories] = await Promise.all([
      listMemberDonations(session.id, session.email),
      listActiveDonationCategories(),
    ]);

    const categoryOptions = categories.map((item) => ({
      slug: item.slug,
      name: item.name,
    }));

    return NextResponse.json(
      donations.map((donation) => ({
        ...serializeDonation(donation),
        categoryLabel: getCategoryLabel(donation.category, categoryOptions),
      })),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load donations";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
