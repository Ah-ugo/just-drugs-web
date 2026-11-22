/** @type {import('next').NextConfig} */
const API_URL = (process.env.API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The browser talks to the FastAPI backend through this same-origin proxy,
  // so there are no CORS or cookie problems and the API URL stays private.
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${API_URL}/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  experimental: { optimizePackageImports: ['@chakra-ui/react'] },
};
