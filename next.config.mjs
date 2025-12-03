/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'groq-sdk',
    'mammoth',
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
};

export default nextConfig;
