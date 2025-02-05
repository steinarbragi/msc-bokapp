import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'c8relzaanv7wdgxi.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;
