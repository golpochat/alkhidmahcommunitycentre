import { AccountTier } from "@/lib/account-tier";

export function getHomeRouteForTier(tier: AccountTier): string {
  switch (tier) {
    case AccountTier.SUPER_ADMIN:
      return "/super-admin";
    case AccountTier.STAFF:
      return "/admin";
    case AccountTier.MEMBER:
      return "/user";
    default:
      return "/login";
  }
}

export function getHomeRouteForSession(session: { tier: AccountTier }): string {
  return getHomeRouteForTier(session.tier);
}
