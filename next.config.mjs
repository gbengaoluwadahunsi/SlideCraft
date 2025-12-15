import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'groq-sdk',
    'mammoth',
    'cloudinary',
  ],
  outputFileTracingIncludes: {
    '/api/export': [
      './node_modules/@sparticuz/chromium/bin/**/*',
      './node_modules/@sparticuz/chromium/lib/**/*',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow larger file uploads (for videos)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Increase body size limit for API routes
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
