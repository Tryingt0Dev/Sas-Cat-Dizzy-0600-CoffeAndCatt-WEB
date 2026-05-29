/**
 * Derives the public application URL from environment variables and/or request headers.
 *
 * Priority:
 * 1. APP_URL or AUTH_URL env var (explicit configuration)
 * 2. NEXT_PUBLIC_APP_URL env var
 * 3. Request headers: x-forwarded-proto + x-forwarded-host (Cloudflared / reverse proxy)
 * 4. Request headers: x-forwarded-proto + host
 * 5. Fallback to http://localhost:3000
 */

const STATIC_APP_URL =
  process.env.APP_URL ||
  process.env.AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "";

export function getStaticAppUrl(): string {
  return STATIC_APP_URL || "http://localhost:3000";
}

export function deriveAppUrlFromHeaders(headers: Headers): string {
  if (STATIC_APP_URL) return STATIC_APP_URL.replace(/\/$/, "");

  const forwardedProto = headers.get("x-forwarded-proto") || "https";
  const forwardedHost = headers.get("x-forwarded-host");
  const host = headers.get("host");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (host) {
    const proto = forwardedProto === "https" ? "https" : "http";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function getAppUrlFromHeaders(headersList: [string, string][]): string {
  const headers = new Headers(headersList);
  return deriveAppUrlFromHeaders(headers);
}
