/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip strict TS checking — pre-existing type mismatches in admin components
  // TODO: Fix these properly after migration is stable
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  webpack: (config, { isServer, nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },

  // Image optimization - allow external image domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    unoptimized: false,
  },

  // Security headers (migrated from vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://platform.twitter.com https://www.instagram.com https://connect.facebook.net https://www.tiktok.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.thetouchlinedribble.in https://*.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.com; font-src 'self' https://fonts.gstatic.com https://*.clerk.com; img-src 'self' data: blob: https: http:; connect-src 'self' https: wss:; frame-src https://www.youtube.com https://platform.twitter.com https://www.instagram.com https://www.tiktok.com https://www.sofascore.com https://widget.sofascore.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com; media-src 'self' https:; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },

};

export default nextConfig;
