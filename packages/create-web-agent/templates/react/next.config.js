/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@web-agent/core',
    '@web-agent/ui-protocol',
    '@web-agent/react',
    '@web-agent/transformers',
  ],
};

export default nextConfig;

