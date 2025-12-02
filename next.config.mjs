/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    '@sparticuz/chromium',
    'groq-sdk',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
