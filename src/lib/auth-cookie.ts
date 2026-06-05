export const AUTH_COOKIE = "alkhidmah-admin-token";

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "alkhidmah-dev-secret-change-in-production"
);
