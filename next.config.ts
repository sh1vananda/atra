
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // REMOVED for SSR
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
    // unoptimized: true, // REMOVED to enable image optimization in SSR
  },
};

export default nextConfig;
