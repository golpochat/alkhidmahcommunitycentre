import { createHash, randomBytes } from "crypto";
import { AuthTokenType } from "@prisma/client";
import { db } from "@/lib/db";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;

export function generateAuthTokenValue() {
  return randomBytes(32).toString("hex");
}

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string) {
  const token = generateAuthTokenValue();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await db.authToken.deleteMany({
    where: { userId, type: AuthTokenType.PASSWORD_RESET },
  });

  await db.authToken.create({
    data: {
      userId,
      type: AuthTokenType.PASSWORD_RESET,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function createEmailChangeToken(userId: string, newEmail: string) {
  const token = generateAuthTokenValue();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

  await db.authToken.deleteMany({
    where: { userId, type: AuthTokenType.EMAIL_CHANGE },
  });

  await db.authToken.create({
    data: {
      userId,
      type: AuthTokenType.EMAIL_CHANGE,
      tokenHash,
      newEmail: newEmail.toLowerCase(),
      expiresAt,
    },
  });

  return token;
}

export async function findValidAuthToken(token: string, type: AuthTokenType) {
  const tokenHash = hashAuthToken(token);

  const record = await db.authToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.type !== type) {
    return null;
  }

  if (record.expiresAt < new Date()) {
    await db.authToken.delete({ where: { id: record.id } });
    return null;
  }

  return record;
}

export async function deleteAuthToken(id: string) {
  await db.authToken.delete({ where: { id } });
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
