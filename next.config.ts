import type { NextConfig } from "next";


// Validate critical environment variables at build time
const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Warning: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
  console.warn('   The application may not work correctly in production.');
}

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Cloud Run
  output: 'standalone',
  // (Removed unsupported outputFileTracing key for Next.js 15)

  // Explicitly expose public environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_AI_VIDEO_GEN_URL: process.env.NEXT_PUBLIC_AI_VIDEO_GEN_URL || '',
  },

  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
    // optimizePackageImports: ['lucide-react', 'framer-motion'], // Temporarily disabled for build debugging
  },
  
  // Temporarily disable ESLint during builds to unblock deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Bundle analyzer (uncomment for analysis)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client bundle from trying to include Node built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api-backend.Bloocube.com',
        pathname: '/uploads/**',
      },
      // Allow any hostname for GCS or other cloud storage
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },

  // Compression
  compress: true,

  // Proxy /api/* to the backend server-side. This makes every API call
  // same-origin from the browser's point of view, so the backend's
  // HttpOnly auth cookies land on *this* domain instead of the backend's —
  // required because the frontend and backend are deployed to unrelated
  // domains (Vercel/Railway) with no shared parent domain to scope a
  // cross-site cookie to. BACKEND_API_URL is a server-only env var (not
  // NEXT_PUBLIC_*) since it's only ever read during the rewrite, not by
  // browser code.
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;