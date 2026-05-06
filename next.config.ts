import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'fra.cloud.appwrite.io',
        },
      ],
    },
    experimental: {
      useCache: true,
      serverActions: {
        bodySizeLimit: '10mb', // matches your "max 10MB" UI label
      },
    },
};

export default nextConfig;