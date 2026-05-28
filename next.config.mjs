import os from 'node:os';

/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const localIpv4Hosts = Object.values(os.networkInterfaces())
  .flat()
  .filter((network) => network?.family === 'IPv4' && !network.internal)
  .map((network) => network.address);

const configuredAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedDevOrigins = isProduction
  ? []
  : Array.from(new Set(['127.0.0.1', 'localhost', '0.0.0.0', ...localIpv4Hosts, ...configuredAllowedDevOrigins]));
const serverActionAllowedOrigins = process.env.NEXT_SERVER_ACTION_ALLOWED_ORIGINS
  ? process.env.NEXT_SERVER_ACTION_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : undefined;
// Normalize server action origins: ensure they include a scheme (default to https for bare domains)
const normalizeOriginValue = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    const trimmed = value.trim();
    if (/^localhost(:\d+)?$/i.test(trimmed) || /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(trimmed) || /^0\.0\.0\.0(:\d+)?$/.test(trimmed)) {
      return `http://${trimmed.replace(/:\d+$/, '')}`;
    }
    return `https://${trimmed.replace(/:\d+$/, '')}`;
  }
};
const serverActionAllowedOriginsNormalized = serverActionAllowedOrigins ? Array.from(new Set(serverActionAllowedOrigins.map(normalizeOriginValue))) : undefined;

// CSP Header strategy:
// Production: strict CSP without unsafe-eval. Configure CSP_IMG_SRC and CSP_CONNECT_SRC
// with commercial providers such as image CDN, storage, analytics and AI gateways.
// Development: allows unsafe-inline/unsafe-eval plus ws/http for React refresh and Turbopack.
const getCspHeader = () => {
  const imgSrc = process.env.CSP_IMG_SRC || "'self' data: blob: https:";
  const connectSrc = process.env.CSP_CONNECT_SRC || "'self' https:";
  const basePolicy = `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src ${imgSrc}`;
  
  if (isProduction) {
    return `${basePolicy}; connect-src ${connectSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'`;
  }

  return `${basePolicy}; connect-src 'self' http: https: ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'`;
};

const nextConfig = {
  ...(serverActionAllowedOrigins
    ? {
        experimental: {
          serverActions: {
            allowedOrigins: serverActionAllowedOriginsNormalized
          }
        }
      }
    : {}),
  allowedDevOrigins,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
          {
            key: 'Content-Security-Policy',
            value: getCspHeader()
          }
        ]
      }
    ];
  }
};

export default nextConfig;
