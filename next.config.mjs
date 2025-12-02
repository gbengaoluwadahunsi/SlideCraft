/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer', 'groq-sdk'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
