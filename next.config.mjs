/** @type {import('next').NextConfig} */
const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://26.223.102.248:3000',
      '26.223.102.248'
    ];

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://26.223.102.248:3000'
      ]
    }
  },
  allowedDevOrigins
};

export default nextConfig;
