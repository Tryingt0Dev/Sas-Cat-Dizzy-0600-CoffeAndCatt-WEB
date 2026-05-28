export function requestHasAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  // In development, be permissive to avoid blocking local dev hosts (localhost, 0.0.0.0, LAN IPs)
  if (process.env.NODE_ENV !== "production") return true;

  const requestOrigin = new URL(req.url).origin;

  const rawConfigured = [requestOrigin, process.env.NEXT_PUBLIC_APP_URL, ...(process.env.REQUEST_ALLOWED_ORIGINS ?? "").split(",")]
    .map((v) => (typeof v === "string" ? v.trim() : v))
    .filter((v): v is string => Boolean(v));

  const normalizeOrigin = (value: string) => {
    try {
      return new URL(value).origin;
    } catch {
      // If the value looks like a host without scheme, assume https in production and http in dev
      const trimmed = value.trim();
      if (/^localhost(:\d+)?$/i.test(trimmed) || /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(trimmed) || /^0\.0\.0\.0(:\d+)?$/.test(trimmed)) {
        return `http://${trimmed.replace(/:\d+$/, '')}`;
      }
      // Default to https for bare domains
      return `https://${trimmed.replace(/:\d+$/, '')}`;
    }
  };

  const configuredOrigins = Array.from(new Set(rawConfigured.map(normalizeOrigin)));

  return configuredOrigins.includes(origin);
}
