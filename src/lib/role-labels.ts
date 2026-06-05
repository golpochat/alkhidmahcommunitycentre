import type { AccountTier } from "@prisma/client";

export const ACCOUNT_TYPE_LABELS: Record<AccountTier, string> = {
  SUPER_ADMIN: "Platform owner",
  STAFF: "Staff — admin panel",
  MEMBER: "Member — user dashboard",
};

export const ACCOUNT_TYPE_DESCRIPTIONS: Record<"STAFF" | "MEMBER", string> = {
  STAFF:
    "Can sign in to the admin panel. Permissions below control which sections they can use.",
  MEMBER:
    "Public member account for donations and programme registrations — not admin staff.",
};
