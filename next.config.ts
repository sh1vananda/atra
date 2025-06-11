
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // ADDED for static export
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // ENSURED for static export
  },
};

export default nextConfig;
