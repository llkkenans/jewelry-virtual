/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['fal.run', 'storage.googleapis.com', 'v3.fal.media', 'fal.media'],
  },
};

export default nextConfig;
