import "server-only";

import { getFreshSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function resolveDonationUserId(): Promise<string | null> {
  const session = await getFreshSession();
  return session?.id ?? null;
}

export async function linkDonationsToUser(userId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  await db.donation.updateMany({
    where: {
      userId: null,
      donorEmail: { equals: normalizedEmail, mode: "insensitive" },
    },
    data: { userId },
  });
}

export async function listMemberDonations(userId: string, email: string) {
  await linkDonationsToUser(userId, email);

  const normalizedEmail = email.trim().toLowerCase();

  return db.donation.findMany({
    where: {
      OR: [
        { userId },
        { donorEmail: { equals: normalizedEmail, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}
