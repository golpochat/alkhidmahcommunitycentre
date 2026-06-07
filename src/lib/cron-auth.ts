export function isValidCronRequest(
  authHeader: string | null,
  cronSecret: string | undefined,
): boolean {
  if (!cronSecret) {
    return false;
  }

  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  return token === cronSecret;
}
