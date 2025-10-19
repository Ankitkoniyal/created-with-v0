/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    unoptimized: false,
    domains: ['blob.vercel-storage.com', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
      },
    ],
  },
  // ✅ ADD THESE NEW CONFIGURATIONS TO FIX NOT-FOUND ISSUE
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // ✅ Ensure proper static generation
  output: 'standalone',
  // ✅ Better handling for dynamic routes
  skipTrailingSlashRedirect: true,
  // ✅ Optimize bundle splitting
  bundlePagesRouterDependencies: true,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
