/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Fail the build in production, but allow speed in dev
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
  typescript: {
    // Fail the build in production, but allow speed in dev
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },
  swcMinify: true,
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    unoptimized: false,
    domains: ['blob.vercel-storage.com', 'supabase.co', 'api.dicebear.com', 'ui-avatars.com', 'gkaeeayfwrgekssmtuzn.supabase.co'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'gkaeeayfwrgekssmtuzn.supabase.co' },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://blob.vercel-storage.com",
      // Add wss:// for WebSocket connections
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app https://vitals.vercel-insights.com",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig