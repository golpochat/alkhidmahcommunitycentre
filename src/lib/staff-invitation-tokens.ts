import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

export const STAFF_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateInvitationTokenValue() {
  return randomBytes(32).toString("hex");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getInvitationAcceptUrl(token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${siteUrl}/accept-invitation?token=${encodeURIComponent(token)}`;
}

export async function findValidStaffInvitation(token: string) {
  const tokenHash = hashInvitationToken(token);

  const invitation = await db.staffInvitation.findUnique({
    where: { tokenHash },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
        },
      },
    },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return null;
  }

  if (invitation.expiresAt < new Date()) {
    return { invitation, expired: true as const };
  }

  return { invitation, expired: false as const };
}

export function isInvitationExpired(expiresAt: Date) {
  return expiresAt < new Date();
}
