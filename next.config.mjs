/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // needed for the Dockerfile; harmless on Vercel
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  eslint: {
    // Lint runs separately in CI; don't block `next build` on it here.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
