/** Mirrors Prisma `AccountTier` — usable in Edge/middleware without `@prisma/client`. */
export const AccountTier = {
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "STAFF",
  MEMBER: "MEMBER",
} as const;

export type AccountTier = (typeof AccountTier)[keyof typeof AccountTier];
