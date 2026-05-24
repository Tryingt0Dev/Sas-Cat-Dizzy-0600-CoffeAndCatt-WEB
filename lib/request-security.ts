export function requestHasAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  // In development, be permissive to avoid blocking local dev hosts (localhost, 0.0.0.0, LAN IPs)
  if (process.env.NODE_ENV !== "production") return true;

  const requestOrigin = new URL(req.url).origin;
  const configuredOrigins = [
    requestOrigin,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.REQUEST_ALLOWED_ORIGINS ?? "").split(",")
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return value;
      }
    });

  return configuredOrigins.includes(origin);
}
