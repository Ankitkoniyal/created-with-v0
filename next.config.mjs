/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint checks in production builds
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checks in production builds
  },
  images: {
    unoptimized: false, // Enable Next.js image optimization for better performance
    domains: ['localhost', 'marketplace.example.com'], // Add your production domain
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
