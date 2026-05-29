function normalizeOriginValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Invalid empty origin value");

  try {
    return new URL(trimmed).origin;
  } catch {
    if (/^localhost(:\d+)?$/i.test(trimmed) || /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(trimmed) || /^0\.0\.0\.0(:\d+)?$/.test(trimmed)) {
      return `http://${trimmed.replace(/:\d+$/, "")}`;
    }
    return `https://${trimmed.replace(/:\d+$/, "")}`;
  }
}

function getHeaderOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore invalid referer
    }
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  return null;
}

function getConfiguredTrustedOrigins(req: Request) {
  const rawOrigin = getHeaderOrigin(req);
  const requestOrigin = new URL(req.url).origin;
  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.AUTH_URL,
    process.env.TRUSTED_ORIGINS,
    process.env.REQUEST_ALLOWED_ORIGINS,
    process.env.NEXT_ALLOWED_DEV_ORIGINS,
    process.env.NEXT_SERVER_ACTION_ALLOWED_ORIGINS
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const uniqueOrigins = Array.from(new Set([requestOrigin, rawOrigin ?? "", ...configured]));
  return uniqueOrigins
    .map((value) => {
      try {
        return normalizeOriginValue(value);
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value));
}

function isDevTrustedOrigin(origin: string) {
  if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin)) return true;
  if (/^https?:\/\/0\.0\.0\.0(:\d+)?$/i.test(origin)) return true;
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/[^/]+\.trycloudflare\.com$/i.test(origin)) return true;
  return false;
}

export function requestHasAllowedOrigin(req: Request) {
  const origin = getHeaderOrigin(req);
  if (!origin) return process.env.NODE_ENV !== "production";

  const normalizedOrigin = normalizeOriginValue(origin);
  if (process.env.NODE_ENV !== "production") {
    return isDevTrustedOrigin(normalizedOrigin) || getConfiguredTrustedOrigins(req).includes(normalizedOrigin);
  }

  const configuredOrigins = getConfiguredTrustedOrigins(req);
  if (configuredOrigins.length === 0) {
    console.error("requestHasAllowedOrigin: no trusted origins configured in production. Set TRUSTED_ORIGINS, NEXT_PUBLIC_APP_URL, APP_URL or AUTH_URL.");
    return false;
  }

  return configuredOrigins.includes(normalizedOrigin);
}
