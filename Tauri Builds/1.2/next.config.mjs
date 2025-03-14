/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export mode
  // Optionally disable ESLint during builds:
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // ... other configuration options
};

export default nextConfig;

